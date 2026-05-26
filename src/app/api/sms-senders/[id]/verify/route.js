// /api/sms-senders/[id]/verify
//
// POST → re-vérifie le sender en frappant l'API Twilio.
//   - BYO          : on déchiffre l'auth_token et on tape GET /Accounts/{sid}.json
//   - Volia-managed: on utilise les creds Volia et on vérifie l'existence du
//                    numéro acheté (GET IncomingPhoneNumbers/{sid}.json).
//
// Met à jour `status` ('active' | 'failed') et `verified_at` en conséquence.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { decryptSecret } from '@/lib/crypto';
import { verifyByoTwilioCredentials } from '@/lib/twilio-numbers';
import { cleanEnv } from '@/lib/envClean';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

async function verifyVoliaManagedNumber(phoneSid) {
  const sid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
  if (!sid || !token) {
    return { valid: false, error: 'Credentials Volia Twilio manquants' };
  }
  if (!phoneSid) {
    return { valid: false, error: 'twilio_phone_sid manquant pour ce sender' };
  }
  const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
  const url = `${TWILIO_API_BASE}/Accounts/${sid}/IncomingPhoneNumbers/${encodeURIComponent(phoneSid)}.json`;
  try {
    const res = await fetch(url, { headers: { Authorization: auth } });
    if (res.status === 404) {
      return { valid: false, error: 'Numéro introuvable côté Twilio (404)' };
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { valid: false, error: data?.message || `Twilio HTTP ${res.status}` };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message || 'fetch error' };
  }
}

export async function POST(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: sender, error: fetchErr } = await supabase
    .from('sms_senders')
    .select(
      'id, type, twilio_account_sid, twilio_auth_token_encrypted, twilio_phone_sid'
    )
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    console.error('[api/sms-senders/[id]/verify] fetch error', fetchErr);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
  if (!sender) {
    return NextResponse.json({ error: 'Sender introuvable' }, { status: 404 });
  }

  let result;

  if (sender.type === 'volia_managed') {
    result = await verifyVoliaManagedNumber(sender.twilio_phone_sid);
  } else if (sender.type === 'byo') {
    if (!sender.twilio_account_sid || !sender.twilio_auth_token_encrypted) {
      result = { valid: false, error: 'Credentials BYO manquants en base' };
    } else {
      let authToken;
      try {
        authToken = decryptSecret(sender.twilio_auth_token_encrypted);
      } catch (err) {
        console.error('[api/sms-senders/[id]/verify] decrypt error', err);
        result = { valid: false, error: 'Erreur déchiffrement du token' };
      }
      if (authToken) {
        result = await verifyByoTwilioCredentials({
          accountSid: sender.twilio_account_sid,
          authToken,
        });
      }
    }
  } else {
    result = { valid: false, error: `Type inconnu : ${sender.type}` };
  }

  const newStatus = result.valid ? 'active' : 'failed';
  const verifiedAt = result.valid ? new Date().toISOString() : null;

  const { error: updErr } = await supabase
    .from('sms_senders')
    .update({
      status: newStatus,
      verified_at: verifiedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updErr) {
    console.error('[api/sms-senders/[id]/verify] update error', updErr);
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  }

  return NextResponse.json({
    valid: result.valid,
    status: newStatus,
    error: result.error || null,
  });
}
