// POST /api/webhooks/twilio/status
//
// Status callback Twilio (SMS). Twilio envoie une requête POST en
// application/x-www-form-urlencoded avec :
//   MessageSid       : SID du message (= notre sms_sends.provider_id)
//   MessageStatus    : queued | sent | delivered | failed | undelivered
//   ErrorCode        : code Twilio si failed (optional)
//   AccountSid       : SID du compte qui a envoyé (Volia managed OU customer BYO)
//   To / From        : numéros
//
// Particularité multi-tenant : si le SMS a été envoyé via un sender BYO,
// l'AuthToken à utiliser pour vérifier la signature est celui du customer
// (chiffré dans sms_senders.twilio_auth_token_encrypted). On reroute donc
// le lookup en fonction de l'AccountSid reçu.
//
// Doc : https://www.twilio.com/docs/usage/webhooks/webhooks-security

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cleanEnv } from '@/lib/envClean';
import { verifyTwilioSignature } from '@/lib/webhooks/twilio-verify';
import { decryptSecret } from '@/lib/crypto';
import { logSmsEventToCrm } from '@/lib/crm-activity-logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Mapping Twilio MessageStatus → champs DB + crm event
const STATUS_MAP = {
  queued:      { timestampField: null,           status: 'queued',      crmType: null },
  sent:        { timestampField: 'sent_at',      status: 'sent',        crmType: null },
  delivered:   { timestampField: 'delivered_at', status: 'delivered',   crmType: 'delivered' },
  failed:      { timestampField: 'failed_at',    status: 'failed',      crmType: 'failed' },
  undelivered: { timestampField: 'failed_at',    status: 'failed',      crmType: 'undelivered' },
};

export async function POST(request) {
  // 1) Parse le body form-urlencoded
  let params;
  try {
    const formData = await request.formData();
    params = Object.fromEntries(formData);
  } catch (err) {
    console.warn('[webhooks/twilio] form parse error', err.message);
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const messageSid = params.MessageSid;
  const messageStatus = params.MessageStatus;
  const accountSid = params.AccountSid;
  const errorCode = params.ErrorCode || null;

  if (!messageSid || !messageStatus) {
    return NextResponse.json({ ok: true, ignored: 'missing MessageSid/MessageStatus' }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();
  const twilioSignature = request.headers.get('x-twilio-signature');

  // 2) Détermine le bon authToken pour vérifier la signature.
  // Cas A : AccountSid == compte Volia managed → utilise TWILIO_AUTH_TOKEN env.
  // Cas B : AccountSid == compte customer BYO → on lookup sms_senders et on déchiffre.
  let authToken = null;
  const voliaAccountSid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const voliaAuthToken = cleanEnv(process.env.TWILIO_AUTH_TOKEN);

  if (accountSid && voliaAccountSid && accountSid === voliaAccountSid) {
    authToken = voliaAuthToken;
  } else if (accountSid) {
    // Lookup sender BYO par account_sid
    try {
      const { data: sender } = await supabase
        .from('sms_senders')
        .select('twilio_auth_token_encrypted')
        .eq('twilio_account_sid', accountSid)
        .eq('status', 'verified')
        .maybeSingle();
      if (sender?.twilio_auth_token_encrypted) {
        authToken = decryptSecret(sender.twilio_auth_token_encrypted);
      }
    } catch (err) {
      console.error('[webhooks/twilio] decrypt error', err.message);
    }
  }

  // 3) Vérification signature — on RÉCONSTRUIT l'URL exacte attendue par Twilio.
  // En prod Vercel, request.url contient déjà l'URL publique HTTPS, mais on
  // permet un override via NEXT_PUBLIC_SITE_URL au cas où (load balancer
  // qui réécrit le host par exemple).
  const siteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL);
  const url = siteUrl
    ? `${siteUrl.replace(/\/$/, '')}/api/webhooks/twilio/status`
    : request.url;

  // Audit log
  let auditId = null;
  try {
    const { data: audit } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'twilio',
        event_type: `sms.${messageStatus}`,
        provider_event_id: messageSid,
        payload: params,
        processed: false,
      })
      .select('id')
      .single();
    auditId = audit?.id || null;
  } catch (e) {
    console.warn('[webhooks/twilio] audit insert error', e?.message);
  }

  if (!authToken) {
    console.warn('[webhooks/twilio] pas d\'authToken pour AccountSid=', accountSid);
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true, error: 'no auth token for account' }).eq('id', auditId);
    }
    return NextResponse.json({ error: 'Unknown account' }, { status: 401 });
  }

  const sigOk = verifyTwilioSignature({
    url,
    params,
    twilioSignature,
    authToken,
  });
  if (!sigOk) {
    console.warn('[webhooks/twilio] signature invalide pour MessageSid=', messageSid);
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true, error: 'invalid signature' }).eq('id', auditId);
    }
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const mapping = STATUS_MAP[messageStatus];
  if (!mapping) {
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true, error: 'unknown status' }).eq('id', auditId);
    }
    return NextResponse.json({ ok: true, ignored: messageStatus }, { status: 200 });
  }

  try {
    // 4) Lookup sms_sends par provider_id
    const { data: send } = await supabase
      .from('sms_sends')
      .select('id, campaign_id, contact_id, phone, status')
      .eq('provider_id', messageSid)
      .maybeSingle();

    if (!send) {
      if (auditId) {
        await supabase.from('webhook_events').update({ processed: true, error: 'send not found' }).eq('id', auditId);
      }
      return NextResponse.json({ ok: true, ignored: 'unknown MessageSid' }, { status: 200 });
    }

    // 5) Update sms_sends
    const update = { status: mapping.status };
    if (mapping.timestampField) update[mapping.timestampField] = new Date().toISOString();
    if (errorCode) update.error_code = String(errorCode);
    if (mapping.status === 'failed') {
      update.error = `Twilio ${messageStatus}${errorCode ? ` (code ${errorCode})` : ''}`;
    }
    await supabase.from('sms_sends').update(update).eq('id', send.id);

    // 6) Bridge CRM
    if (mapping.crmType) {
      const { data: campaign } = await supabase
        .from('sms_campaigns')
        .select('id, owner_id, name, body')
        .eq('id', send.campaign_id)
        .maybeSingle();
      if (campaign?.owner_id) {
        await logSmsEventToCrm({
          supabaseAdmin: supabase,
          ownerId: campaign.owner_id,
          recipientPhone: send.phone,
          campaign,
          eventType: mapping.crmType,
          providerId: messageSid,
        });
      }
    }

    if (auditId) {
      await supabase.from('webhook_events').update({ processed: true }).eq('id', auditId);
    }

    return NextResponse.json({ ok: true, status: messageStatus, send_id: send.id }, { status: 200 });
  } catch (err) {
    console.error('[webhooks/twilio] processing error', err);
    if (auditId) {
      await supabase.from('webhook_events').update({ processed: false, error: String(err.message || err).slice(0, 500) }).eq('id', auditId);
    }
    return NextResponse.json({ ok: false, error: 'processing failed' }, { status: 200 });
  }
}
