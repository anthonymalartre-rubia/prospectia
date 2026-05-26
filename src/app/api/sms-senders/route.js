// /api/sms-senders
//
// GET  → liste des numéros SMS du user (RLS). On ne retourne JAMAIS le
//        twilio_auth_token_encrypted (sensible).
// POST → connecte un nouveau numéro :
//        - type: 'volia_managed'  → on provisionne un numéro via le compte Volia
//        - type: 'byo'            → on valide les creds du user puis on insère
//                                   (auth_token chiffré AES-256-GCM)

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import {
  provisionTwilioNumber,
  verifyByoTwilioCredentials,
  isValidE164,
} from '@/lib/twilio-numbers';
import { cleanEnv } from '@/lib/envClean';

// Champs sûrs à retourner via l'API (jamais le token chiffré).
const SAFE_FIELDS =
  'id, type, phone_number, twilio_account_sid, twilio_phone_sid, friendly_name, status, verified_at, created_at, updated_at';

export async function GET() {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sms_senders')
    .select(SAFE_FIELDS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/sms-senders] GET error', error);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }

  return NextResponse.json({ senders: data || [] });
}

export async function POST(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body?.type;

  if (type !== 'volia_managed' && type !== 'byo') {
    return NextResponse.json(
      { error: "type doit être 'volia_managed' ou 'byo'" },
      { status: 400 }
    );
  }

  // ─── Mode Volia-managed : on provisionne via notre compte Twilio ────────
  if (type === 'volia_managed') {
    let provisioned;
    try {
      provisioned = await provisionTwilioNumber({
        countryCode: body?.country_code || 'FR',
      });
    } catch (err) {
      console.error('[api/sms-senders] provision error', err);
      const status = err.code === 21404 ? 409 : 502;
      return NextResponse.json(
        {
          error: err.message || 'Échec provisioning Twilio',
          code: err.code,
        },
        { status }
      );
    }

    const voliaSid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);

    const { data, error } = await supabase
      .from('sms_senders')
      .insert({
        user_id: user.id,
        type: 'volia_managed',
        phone_number: provisioned.phoneNumber,
        twilio_account_sid: voliaSid,
        twilio_phone_sid: provisioned.phoneNumberSid,
        friendly_name: body?.friendly_name || 'Numéro Volia',
        status: 'active',
        verified_at: new Date().toISOString(),
      })
      .select(SAFE_FIELDS)
      .single();

    if (error) {
      console.error('[api/sms-senders] insert managed error', error);
      // Best-effort : on devrait release le numéro, mais on log et on remonte
      // l'erreur — un admin pourra clean manuellement si besoin.
      return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 });
    }

    return NextResponse.json({ sender: data });
  }

  // ─── Mode BYO : creds + numéro fournis par le user ──────────────────────
  const accountSid = String(body?.account_sid || '').trim();
  const authToken = String(body?.auth_token || '').trim();
  const phoneNumber = String(body?.phone_number || '').trim();

  if (!accountSid || !authToken || !phoneNumber) {
    return NextResponse.json(
      { error: 'account_sid, auth_token et phone_number requis pour BYO' },
      { status: 400 }
    );
  }

  if (!isValidE164(phoneNumber)) {
    return NextResponse.json(
      { error: 'phone_number invalide (format E.164 attendu, ex: +33612345678)' },
      { status: 400 }
    );
  }

  // 1. Vérifie que les creds Twilio sont valides AVANT de chiffrer/stocker
  const verify = await verifyByoTwilioCredentials({ accountSid, authToken });
  if (!verify.valid) {
    return NextResponse.json(
      { error: verify.error || 'Credentials Twilio invalides' },
      { status: 400 }
    );
  }

  // 2. Chiffre le token
  let encrypted;
  try {
    encrypted = encryptSecret(authToken);
  } catch (err) {
    console.error('[api/sms-senders] encrypt error', err);
    return NextResponse.json(
      { error: err.message || 'Erreur chiffrement' },
      { status: 500 }
    );
  }

  // 3. Insert
  const { data, error } = await supabase
    .from('sms_senders')
    .insert({
      user_id: user.id,
      type: 'byo',
      phone_number: phoneNumber,
      twilio_account_sid: accountSid,
      twilio_auth_token_encrypted: encrypted,
      twilio_phone_sid: body?.twilio_phone_sid || null,
      friendly_name: body?.friendly_name || verify.friendlyName || null,
      status: 'active',
      verified_at: new Date().toISOString(),
    })
    .select(SAFE_FIELDS)
    .single();

  if (error) {
    console.error('[api/sms-senders] insert byo error', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ce numéro est déjà enregistré sur votre compte.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 });
  }

  return NextResponse.json({ sender: data });
}
