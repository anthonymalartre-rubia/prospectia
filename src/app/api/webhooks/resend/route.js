// POST /api/webhooks/resend
//
// Webhook Resend (signature Svix). Reçoit les événements email :
//   email.sent / email.delivered / email.delivery_delayed /
//   email.bounced / email.complained / email.opened / email.clicked /
//   email.failed
//
// Pour chaque event :
//   1. Vérifie la signature Svix (RESEND_WEBHOOK_SECRET). 401 si KO.
//   2. Idempotence : check svix-id dans webhook_events. Si déjà vu → skip.
//   3. Lookup email_sends par provider_id (=data.email_id).
//   4. Update les timestamps (delivered_at, opened_at, …) + opens_count/clicks_count.
//   5. Log activity CRM via logEmailEventToCrm + bump engagement_score.
//   6. Bonus : sur 'complained', marque le prospect_contacts en opt_out.
//   7. Retourne 200 TOUJOURS (sinon Resend retry 100×).
//
// Doc : https://resend.com/docs/dashboard/webhooks/event-types

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cleanEnv } from '@/lib/envClean';
import { verifyResendSignature } from '@/lib/webhooks/resend-verify';
import { logEmailEventToCrm } from '@/lib/crm-activity-logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Mapping event Resend → champ timestamp DB + nouveau status éventuel
const EVENT_MAP = {
  'email.sent':              { timestampField: 'sent_at',       status: null,        crmType: null },
  'email.delivered':         { timestampField: 'delivered_at',  status: 'delivered', crmType: 'delivered' },
  'email.delivery_delayed':  { timestampField: null,            status: null,        crmType: null },
  'email.opened':            { timestampField: null,            status: null,        crmType: 'opened',    counter: 'opens' },
  'email.clicked':           { timestampField: null,            status: null,        crmType: 'clicked',   counter: 'clicks' },
  'email.bounced':           { timestampField: 'bounced_at',    status: 'failed',    crmType: 'bounced' },
  'email.complained':        { timestampField: 'complained_at', status: null,        crmType: 'complained' },
  'email.failed':            { timestampField: null,            status: 'failed',    crmType: null },
};

export async function POST(request) {
  // 1) Lecture RAW body (obligatoire pour la signature)
  const rawBody = await request.text().catch(() => '');
  const secret = cleanEnv(process.env.RESEND_WEBHOOK_SECRET);

  if (!secret) {
    console.error('[webhooks/resend] RESEND_WEBHOOK_SECRET non configuré');
    // 401 (pas 500) pour pas que Resend retry à l'infini sur un misconfig
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 401 });
  }

  // 2) Vérification signature Svix
  try {
    verifyResendSignature({ payload: rawBody, headers: request.headers, secret });
  } catch (err) {
    console.warn('[webhooks/resend] signature invalide:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3) Parse JSON après vérification
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event?.type;
  const eventData = event?.data || {};
  const providerId = eventData.email_id || eventData.id;
  const svixId = request.headers.get('svix-id');

  if (!eventType) {
    return NextResponse.json({ ok: true, ignored: 'no event type' }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();

  // 4) Idempotence : si on a déjà traité ce svix-id, on no-op
  if (svixId) {
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('provider', 'resend')
      .eq('provider_event_id', svixId)
      .maybeSingle();
    if (existing?.processed) {
      return NextResponse.json({ ok: true, dedup: true }, { status: 200 });
    }
  }

  // Audit log (best-effort)
  let auditId = null;
  try {
    const { data: audit } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'resend',
        event_type: eventType,
        provider_event_id: svixId,
        payload: event,
        processed: false,
      })
      .select('id')
      .single();
    auditId = audit?.id || null;
  } catch (e) {
    console.warn('[webhooks/resend] audit insert error', e?.message);
  }

  const mapping = EVENT_MAP[eventType];
  if (!mapping) {
    // Event type pas géré → on logge en audit mais on renvoie 200
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true, error: 'unknown event_type' }).eq('id', auditId);
    }
    return NextResponse.json({ ok: true, ignored: eventType }, { status: 200 });
  }

  if (!providerId) {
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true, error: 'no provider_id' }).eq('id', auditId);
    }
    return NextResponse.json({ ok: true, ignored: 'no email_id' }, { status: 200 });
  }

  try {
    // 5) Lookup email_sends par provider_id
    const { data: send } = await supabase
      .from('email_sends')
      .select('id, campaign_id, contact_id, email, status')
      .eq('provider_id', providerId)
      .maybeSingle();

    if (!send) {
      // Email envoyé mais pas via nos campagnes → on ignore proprement
      if (auditId) {
        await supabase.from('webhook_events').update({ processed: true, error: 'send not found' }).eq('id', auditId);
      }
      return NextResponse.json({ ok: true, ignored: 'unknown email_id' }, { status: 200 });
    }

    // 6) Update email_sends
    if (mapping.counter === 'opens') {
      // Atomic increment via RPC (gère opened_at first-only + opens_count++)
      await supabase.rpc('increment_email_send_opens', { send_id: send.id });
    } else if (mapping.counter === 'clicks') {
      await supabase.rpc('increment_email_send_clicks', { send_id: send.id });
    } else {
      const update = {};
      if (mapping.timestampField) update[mapping.timestampField] = new Date().toISOString();
      if (mapping.status) update.status = mapping.status;
      // Capture l'erreur Resend si bounce/failed
      if (eventType === 'email.bounced' || eventType === 'email.failed') {
        const errMsg = eventData?.bounce?.message || eventData?.failed?.reason || eventData?.reason || eventType;
        update.error = String(errMsg).slice(0, 500);
      }
      if (Object.keys(update).length > 0) {
        await supabase.from('email_sends').update(update).eq('id', send.id);
      }
    }

    // 7) Bonus complained : marque le contact en opt-out
    if (eventType === 'email.complained' && send.contact_id) {
      await supabase
        .from('prospect_contacts')
        .update({
          opt_out: true,
          opt_out_at: new Date().toISOString(),
          opt_out_reason: 'Plainte spam (Resend webhook)',
        })
        .eq('id', send.contact_id)
        .eq('opt_out', false);
    }

    // 8) Bridge CRM : log activity + bump engagement
    if (mapping.crmType) {
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('id, owner_id, name, subject')
        .eq('id', send.campaign_id)
        .maybeSingle();
      if (campaign?.owner_id) {
        await logEmailEventToCrm({
          supabaseAdmin: supabase,
          ownerId: campaign.owner_id,
          recipientEmail: send.email,
          campaign,
          eventType: mapping.crmType,
          providerId,
        });
      }
    }

    // Marque l'audit comme processed
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true }).eq('id', auditId);
    }

    return NextResponse.json({ ok: true, event_type: eventType, send_id: send.id }, { status: 200 });
  } catch (err) {
    console.error('[webhooks/resend] processing error', err);
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: false, error: String(err.message || err).slice(0, 500) }).eq('id', auditId);
    }
    // 200 quand même : on ne veut pas que Resend retry 100×
    return NextResponse.json({ ok: false, error: 'processing failed' }, { status: 200 });
  }
}
