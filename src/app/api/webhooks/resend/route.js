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
import { emitWebhookEvent } from '@/lib/webhooks/emitter';

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
    // 5.warmup) WARMUP PEER-TO-PEER — court-circuit prioritaire.
    // Si l'event porte le tag `kind=warmup_peer`, c'est un envoi
    // généré par notre cron warmup peer. Pas de email_sends associé,
    // on update directement warmup_exchanges + bump peer counters.
    const tagsArr = Array.isArray(eventData?.tags) ? eventData.tags : [];
    const tagMap = Object.fromEntries(
      tagsArr
        .filter((t) => t && typeof t.name === 'string')
        .map((t) => [t.name, t.value])
    );
    if (tagMap.kind === 'warmup_peer') {
      // Note : le cron warmup-peer pré-remplit déjà opened_at/clicked_at via
      // simulation. On utilise ici .is(col, null) pour ne mettre à jour que les
      // exchanges qui n'avaient pas encore d'engagement simulé (cas rare où
      // le webhook arrive avant l'update DB, ou cas où on aurait désactivé
      // la simulation). On ne bump PAS les compteurs peer_pool ici pour
      // éviter le double-count avec le cron — la source de vérité reste le
      // cron. Le webhook sert juste à corriger les timestamps si besoin.
      if (providerId) {
        const update = {};
        if (eventType === 'email.opened') update.opened_at = new Date().toISOString();
        else if (eventType === 'email.clicked') update.clicked_at = new Date().toISOString();
        if (Object.keys(update).length > 0) {
          const guardCol = update.opened_at ? 'opened_at' : 'clicked_at';
          await supabase
            .from('warmup_exchanges')
            .update(update)
            .eq('resend_message_id', providerId)
            .is(guardCol, null);
        }
      }
      if (auditId) {
        await supabase.from('webhook_events').update({ processed: true }).eq('id', auditId);
      }
      return NextResponse.json({ ok: true, warmup_peer: true, event_type: eventType }, { status: 200 });
    }

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
    let campaignOwnerId = null;
    let campaignRow = null;
    if (mapping.crmType) {
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('id, owner_id, name, subject')
        .eq('id', send.campaign_id)
        .maybeSingle();
      campaignRow = campaign || null;
      campaignOwnerId = campaign?.owner_id || null;
      if (campaignOwnerId) {
        await logEmailEventToCrm({
          supabaseAdmin: supabase,
          ownerId: campaignOwnerId,
          recipientEmail: send.email,
          campaign,
          eventType: mapping.crmType,
          providerId,
        });
      }
    }

    // 8.bis) Webhooks publics Zapier/Make pour la déliverabilité fine
    // (email.delivered/opened/clicked). On émet UNIQUEMENT pour les events à
    // forte valeur métier ; les bounces/failed restent internes pour le moment.
    const PUBLIC_EMITTED = new Set(['email.delivered', 'email.opened', 'email.clicked']);
    if (PUBLIC_EMITTED.has(eventType)) {
      // owner_id : on a peut-être déjà fetch ci-dessus, sinon on le récupère.
      let ownerForEmit = campaignOwnerId;
      let camp = campaignRow;
      if (!ownerForEmit && send.campaign_id) {
        const { data } = await supabase
          .from('email_campaigns')
          .select('id, owner_id, name, subject')
          .eq('id', send.campaign_id)
          .maybeSingle();
        camp = data || null;
        ownerForEmit = data?.owner_id || null;
      }
      if (ownerForEmit) {
        const eventTs = new Date().toISOString();
        const payloadData = {
          campaign_id: send.campaign_id,
          campaign_name: camp?.name || null,
          to: send.email,
          ...(eventType === 'email.delivered' && { delivered_at: eventTs }),
          ...(eventType === 'email.opened' && { opened_at: eventTs }),
          ...(eventType === 'email.clicked' && {
            clicked_at: eventTs,
            url: eventData?.click?.link || eventData?.link || null,
          }),
        };
        emitWebhookEvent({
          userId: ownerForEmit,
          event: eventType,
          data: payloadData,
        }).catch((e) => console.warn('[webhooks/resend] emit failed', e?.message));
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
