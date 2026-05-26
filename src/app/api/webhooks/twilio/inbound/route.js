// POST /api/webhooks/twilio/inbound
//
// Webhook Twilio Inbound SMS : reçoit les réponses SMS à un message envoyé
// depuis Volia Campagnes. Twilio POST en application/x-www-form-urlencoded.
//
// Auto-création :
//   - crm_contacts dedup par phone
//   - crm_deals stage "Lead" si aucun open
//   - crm_activities (type=sms) avec body
//
// Sécurité : signature X-Twilio-Signature vérifiée avec l'auth_token du sender.
//   - Volia-managed (type='volia') → TWILIO_AUTH_TOKEN env
//   - BYO (type='byo') → twilio_auth_token_encrypted déchiffré via lib/crypto.js
//
// IMPORTANT : Twilio attend une réponse TwiML (XML). Sinon il retry.
// On renvoie toujours `<Response></Response>` avec status 200.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cleanEnv } from '@/lib/envClean';
import { verifyTwilioSignature } from '@/lib/webhooks/twilio-verify';
import { decryptSecret } from '@/lib/crypto';
import { autoCreateFromReply } from '@/lib/crm-auto-create';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twimlResponse() {
  return new NextResponse(TWIML_EMPTY, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

function rebuildPublicUrl(request) {
  // Twilio signe avec l'URL publique EXACTE configurée dans la console.
  // En prod derrière Vercel, request.url peut être l'URL interne. On essaie d'abord
  // d'utiliser X-Forwarded-Host + proto, sinon NEXT_PUBLIC_SITE_URL.
  try {
    const xfHost = request.headers.get('x-forwarded-host');
    const xfProto = request.headers.get('x-forwarded-proto') || 'https';
    if (xfHost) {
      const u = new URL(request.url);
      return `${xfProto}://${xfHost}${u.pathname}${u.search || ''}`;
    }
    const siteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL);
    if (siteUrl) {
      const u = new URL(request.url);
      return new URL(u.pathname + (u.search || ''), siteUrl).toString();
    }
  } catch {
    /* ignore */
  }
  return request.url;
}

export async function POST(request) {
  // 1) Parse form-urlencoded
  let formText = '';
  try {
    formText = await request.text();
  } catch (err) {
    console.warn('[twilio-inbound] failed to read body', err?.message);
    return twimlResponse();
  }

  const params = {};
  try {
    const sp = new URLSearchParams(formText);
    for (const [k, v] of sp.entries()) {
      params[k] = v;
    }
  } catch (err) {
    console.warn('[twilio-inbound] failed to parse form', err?.message);
    return twimlResponse();
  }

  const From = params.From || null;
  const To = params.To || null;
  const Body = params.Body || '';
  const MessageSid = params.MessageSid || null;
  const AccountSid = params.AccountSid || null;
  const twilioSig = request.headers.get('x-twilio-signature');

  const supabaseAdmin = (() => {
    try {
      return getSupabaseAdmin();
    } catch (err) {
      console.error('[twilio-inbound] no supabase admin', err.message);
      return null;
    }
  })();

  if (!supabaseAdmin) {
    return twimlResponse();
  }

  // 2) Identifier le sender via le numéro To
  let senderRow = null;
  let ownerId = null;

  try {
    if (To) {
      const { data: sender, error } = await supabaseAdmin
        .from('sms_senders')
        .select('id, user_id, type, phone_number, twilio_account_sid, twilio_auth_token_encrypted, status')
        .eq('phone_number', To)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[twilio-inbound] sender lookup error', error.message);
      } else if (sender) {
        senderRow = sender;
        ownerId = sender.user_id;
      }
    }
  } catch (e) {
    console.warn('[twilio-inbound] sender lookup exception', e.message);
  }

  // 3) Récupérer l'auth_token pour signature
  let authToken = null;
  try {
    if (senderRow?.type === 'byo' && senderRow.twilio_auth_token_encrypted) {
      try {
        authToken = decryptSecret(senderRow.twilio_auth_token_encrypted);
      } catch (e) {
        console.warn('[twilio-inbound] decrypt auth_token failed', e.message);
      }
    } else {
      authToken = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
    }
  } catch (e) {
    console.warn('[twilio-inbound] authToken resolve exception', e.message);
  }

  // 4) Vérifier signature (best-effort si token absent)
  if (authToken && twilioSig) {
    try {
      const url = rebuildPublicUrl(request);
      const ok = verifyTwilioSignature({
        url,
        params,
        twilioSignature: twilioSig,
        authToken,
      });
      if (!ok) {
        console.warn('[twilio-inbound] invalid signature for', url);
        // On répond TwiML 200 pour ne pas trigger retry, mais on ne traite pas
        return twimlResponse();
      }
    } catch (e) {
      console.warn('[twilio-inbound] signature verify exception', e.message);
      return twimlResponse();
    }
  } else {
    console.warn('[twilio-inbound] missing authToken or signature — verification skipped');
  }

  // 5) Best-effort lookup du SMS original
  let originalSend = null;
  try {
    if (From && ownerId) {
      // Cherche le dernier sms_sends à destination de From sur une campagne owned by ownerId
      const { data: send } = await supabaseAdmin
        .from('sms_sends')
        .select('id, campaign_id, contact_id, phone, provider_id, sms_campaigns!inner(owner_id)')
        .eq('phone', From)
        .eq('sms_campaigns.owner_id', ownerId)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (send) originalSend = send;
    }
  } catch (e) {
    console.warn('[twilio-inbound] original sms lookup error', e.message);
  }

  // 6) Auto-create CRM
  let autoResult = null;
  if (ownerId && From) {
    try {
      autoResult = await autoCreateFromReply({
        supabaseAdmin,
        ownerId,
        channel: 'sms',
        from: From,
        body: Body,
        subject: null,
        replyToProviderId: originalSend?.provider_id || MessageSid || null,
      });
    } catch (e) {
      console.error('[twilio-inbound] autoCreate exception', e.message);
    }
  } else {
    console.warn('[twilio-inbound] missing ownerId or From — skip auto-create', {
      hasOwner: !!ownerId,
      hasFrom: !!From,
      To,
    });
  }

  // 7) Audit inbound_events
  try {
    await supabaseAdmin.from('inbound_events').insert({
      user_id: ownerId,
      channel: 'sms',
      sender_id: senderRow?.id || null,
      from_email: null,
      from_phone: From,
      subject: null,
      body: typeof Body === 'string' ? Body.slice(0, 10000) : null,
      raw_payload: {
        From,
        To,
        Body,
        MessageSid,
        AccountSid,
        params,
      },
      processed_at: new Date().toISOString(),
      contact_id: autoResult?.contact_id || null,
      deal_id: autoResult?.deal_id || null,
    });
  } catch (e) {
    console.warn('[twilio-inbound] inbound_events insert failed', e?.message);
  }

  return twimlResponse();
}

export async function GET() {
  return new NextResponse(TWIML_EMPTY, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
