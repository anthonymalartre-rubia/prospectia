// POST /api/webhooks/resend/inbound
//
// Webhook Resend Inbound : reçoit les réponses à un email envoyé depuis
// Volia Campagnes. Quand un prospect répond, on auto-crée :
//   - un crm_contacts (si absent)
//   - un crm_deals au stage "Lead" (10%) dans le pipeline par défaut
//   - une crm_activities (type=email) avec le body
// Puis on met à jour email_sends.replied_at si on retrouve le message originel.
//
// Endpoint TOUJOURS 200 (sinon Resend retry à l'infini). L'auto-création
// est fire-and-forget, isolée par try/catch.
//
// Sécurité : signature Svix vérifiée via lib/webhooks/resend-verify.js.
// Env requis : RESEND_INBOUND_WEBHOOK_SECRET (whsec_xxx).

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cleanEnv } from '@/lib/envClean';
import { verifyResendSignature } from '@/lib/webhooks/resend-verify';
import { autoCreateFromReply } from '@/lib/crm-auto-create';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractDomain(emailLike) {
  if (!emailLike) return null;
  // Resend peut envoyer "Foo <foo@bar.com>" ou "foo@bar.com"
  const m = String(emailLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = m?.[1] || String(emailLike);
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 0) return null;
  return email.slice(atIdx + 1).toLowerCase().trim();
}

function extractEmail(emailLike) {
  if (!emailLike) return null;
  const m = String(emailLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  return (m?.[1] || String(emailLike)).toLowerCase().trim();
}

function asFirst(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function POST(request) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err) {
    console.warn('[resend-inbound] failed to read body', err?.message);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 1) Vérification signature (best-effort si secret absent en dev)
  const secret = cleanEnv(process.env.RESEND_INBOUND_WEBHOOK_SECRET);
  if (secret) {
    try {
      verifyResendSignature({ payload: rawBody, headers: request.headers, secret });
    } catch (err) {
      console.warn('[resend-inbound] signature invalid:', err.message);
      // 200 pour éviter les retries Resend qui n'aident pas
      return NextResponse.json({ received: true, error: 'invalid_signature' }, { status: 200 });
    }
  } else {
    console.warn('[resend-inbound] RESEND_INBOUND_WEBHOOK_SECRET non configuré — verification skip');
  }

  // 2) Parse payload
  let payload = {};
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Resend Inbound (basé sur svix + format webhook) : data contient l'email
  // Format attendu : { type: 'email.received', data: { from, to, subject, text, html, headers, message_id, in_reply_to } }
  const data = payload?.data || payload;
  const from = extractEmail(asFirst(data?.from));
  const toRaw = asFirst(data?.to);
  const toDomain = extractDomain(toRaw);
  const subject = data?.subject || null;
  const bodyText = data?.text || data?.plain || data?.body || '';
  const messageId = data?.message_id || data?.messageId || null;
  const inReplyTo = data?.in_reply_to || data?.inReplyTo || data?.headers?.['in-reply-to'] || null;

  // Audit row toujours créée même si la suite échoue
  const supabaseAdmin = (() => {
    try {
      return getSupabaseAdmin();
    } catch (err) {
      console.error('[resend-inbound] no supabase admin', err.message);
      return null;
    }
  })();

  if (!supabaseAdmin) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let senderRow = null;
  let ownerId = null;

  // 3) Identifier le sender par domaine du destinataire (to)
  try {
    if (toDomain) {
      const { data: sender, error } = await supabaseAdmin
        .from('email_senders')
        .select('id, user_id, domain, status')
        .ilike('domain', toDomain)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[resend-inbound] sender lookup error', error.message);
      } else if (sender) {
        senderRow = sender;
        ownerId = sender.user_id;
      }
    }
  } catch (e) {
    console.warn('[resend-inbound] sender lookup exception', e.message);
  }

  // 4) Retrouver le send originel via in_reply_to → email_sends.provider_id
  let originalSend = null;
  if (inReplyTo) {
    try {
      // Resend inclut souvent les chevrons <abcd@resend.dev>
      const cleanInReply = String(inReplyTo).replace(/[<>]/g, '').trim();
      const { data: send } = await supabaseAdmin
        .from('email_sends')
        .select('id, campaign_id, contact_id, email, provider_id')
        .eq('provider_id', cleanInReply)
        .limit(1)
        .maybeSingle();
      if (send) {
        originalSend = send;
        // Marque replied_at
        await supabaseAdmin
          .from('email_sends')
          .update({ replied_at: new Date().toISOString() })
          .eq('id', send.id);
        // Si ownerId pas trouvé via sender, on remonte via la campagne
        if (!ownerId && send.campaign_id) {
          const { data: camp } = await supabaseAdmin
            .from('email_campaigns')
            .select('owner_id')
            .eq('id', send.campaign_id)
            .maybeSingle();
          if (camp?.owner_id) ownerId = camp.owner_id;
        }
      }
    } catch (e) {
      console.warn('[resend-inbound] original send lookup error', e.message);
    }
  }

  // 5) Auto-create CRM (fire-and-forget)
  let autoResult = null;
  if (ownerId && from) {
    try {
      autoResult = await autoCreateFromReply({
        supabaseAdmin,
        ownerId,
        channel: 'email',
        from,
        body: bodyText,
        subject,
        replyToProviderId: originalSend?.provider_id || inReplyTo || null,
      });
    } catch (e) {
      console.error('[resend-inbound] autoCreate exception', e.message);
    }
  } else {
    console.warn('[resend-inbound] missing ownerId or from — skip auto-create', {
      hasOwner: !!ownerId,
      hasFrom: !!from,
      toDomain,
    });
  }

  // 6) Insert audit inbound_events
  try {
    await supabaseAdmin.from('inbound_events').insert({
      user_id: ownerId,
      channel: 'email',
      sender_id: senderRow?.id || null,
      from_email: from,
      from_phone: null,
      subject,
      body: typeof bodyText === 'string' ? bodyText.slice(0, 10000) : null,
      raw_payload: payload,
      processed_at: new Date().toISOString(),
      contact_id: autoResult?.contact_id || null,
      deal_id: autoResult?.deal_id || null,
    });
  } catch (e) {
    console.warn('[resend-inbound] inbound_events insert failed', e?.message);
  }

  return NextResponse.json(
    {
      received: true,
      processed: !!autoResult && !autoResult.error,
      contact_created: !!autoResult?.contact_created,
      deal_created: !!autoResult?.deal_created,
    },
    { status: 200 }
  );
}

// Resend test pings sometimes use GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'resend-inbound' });
}
