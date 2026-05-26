// Helpers Twilio pour la gestion des numéros (Volia-managed ET BYO).
//
// On utilise l'API REST 2010-04-01 directement (pas de SDK Twilio pour rester
// edge/serverless-friendly et limiter les deps).
//
// Référence : https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource
//
// Auth : Basic Auth = AccountSid + AuthToken (Volia ou BYO selon contexte).
//
// Codes d'erreur Twilio communs :
//   401  → credentials invalides
//   404  → ressource introuvable (déjà supprimée par ex.)
//   21404 → numéro indisponible
//   20003 → authentication failure
//   20404 → page not found / SID inexistant

import { cleanEnv } from './envClean';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function basicAuthHeader(sid, token) {
  const b64 = Buffer.from(`${sid}:${token}`).toString('base64');
  return `Basic ${b64}`;
}

function getVoliaCreds() {
  const sid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
  if (!sid || !token) {
    throw new Error(
      'TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN requis dans l\'environnement Volia'
    );
  }
  return { sid, token };
}

/**
 * Provisionne un nouveau numéro Twilio depuis le compte Volia.
 * Stratégie : 1) on cherche un numéro mobile disponible dans le pays,
 *             2) on l'achète via POST IncomingPhoneNumbers.
 *
 * @param {object} opts
 * @param {string} [opts.countryCode='FR']
 * @returns {Promise<{ phoneNumberSid: string, phoneNumber: string }>}
 */
export async function provisionTwilioNumber({ countryCode = 'FR' } = {}) {
  const { sid, token } = getVoliaCreds();
  const auth = basicAuthHeader(sid, token);

  // 1. Chercher un numéro mobile disponible dans le pays cible
  const searchUrl = `${TWILIO_API_BASE}/Accounts/${sid}/AvailablePhoneNumbers/${encodeURIComponent(countryCode)}/Mobile.json?SmsEnabled=true&PageSize=1`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: auth },
  });
  const searchData = await searchRes.json().catch(() => ({}));
  if (!searchRes.ok) {
    throw new Error(
      `Twilio search HTTP ${searchRes.status} : ${searchData?.message || 'unknown error'}`
    );
  }
  const candidate = searchData?.available_phone_numbers?.[0];
  if (!candidate?.phone_number) {
    const err = new Error(
      `Aucun numéro mobile disponible pour ${countryCode} (Twilio code 21404).`
    );
    err.code = 21404;
    throw err;
  }

  // 2. Acheter le numéro
  const buyUrl = `${TWILIO_API_BASE}/Accounts/${sid}/IncomingPhoneNumbers.json`;
  const form = new URLSearchParams();
  form.set('PhoneNumber', candidate.phone_number);

  const buyRes = await fetch(buyUrl, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const buyData = await buyRes.json().catch(() => ({}));
  if (!buyRes.ok) {
    const err = new Error(
      `Twilio purchase HTTP ${buyRes.status} : ${buyData?.message || 'unknown error'}`
    );
    err.code = buyData?.code;
    throw err;
  }

  return {
    phoneNumberSid: buyData.sid,
    phoneNumber: buyData.phone_number,
  };
}

/**
 * Libère (= supprime) un numéro Twilio acheté côté Volia.
 * @param {string} phoneNumberSid - SID commençant par PN...
 * @returns {Promise<{ released: boolean }>}
 */
export async function releaseTwilioNumber(phoneNumberSid) {
  if (!phoneNumberSid || typeof phoneNumberSid !== 'string') {
    throw new Error('phoneNumberSid requis');
  }
  const { sid, token } = getVoliaCreds();
  const auth = basicAuthHeader(sid, token);

  const url = `${TWILIO_API_BASE}/Accounts/${sid}/IncomingPhoneNumbers/${encodeURIComponent(phoneNumberSid)}.json`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: auth },
  });

  // 204 = success, 404 = déjà supprimé (idempotent)
  if (res.status === 204 || res.status === 404) {
    return { released: true };
  }
  const data = await res.json().catch(() => ({}));
  const err = new Error(
    `Twilio release HTTP ${res.status} : ${data?.message || 'unknown error'}`
  );
  err.code = data?.code;
  throw err;
}

/**
 * Vérifie qu'un couple (accountSid, authToken) BYO est valide en faisant un
 * GET /Accounts/{sid}.json. Renvoie aussi le friendlyName pour affichage.
 *
 * @param {object} opts
 * @param {string} opts.accountSid - commence par AC...
 * @param {string} opts.authToken
 * @returns {Promise<{ valid: boolean, friendlyName?: string, error?: string }>}
 */
export async function verifyByoTwilioCredentials({ accountSid, authToken }) {
  if (!accountSid || !authToken) {
    return { valid: false, error: 'accountSid et authToken requis' };
  }
  if (!/^AC[a-f0-9]{32}$/i.test(accountSid)) {
    return { valid: false, error: 'accountSid invalide (format attendu : AC + 32 hex)' };
  }

  const auth = basicAuthHeader(accountSid, authToken);
  const url = `${TWILIO_API_BASE}/Accounts/${encodeURIComponent(accountSid)}.json`;

  try {
    const res = await fetch(url, { headers: { Authorization: auth } });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      return { valid: false, error: 'Auth Twilio échouée (401) — vérifie account_sid + auth_token.' };
    }
    if (!res.ok) {
      return {
        valid: false,
        error: data?.message || `Twilio HTTP ${res.status}`,
      };
    }
    return {
      valid: true,
      friendlyName: data?.friendly_name || data?.owner_account_sid || accountSid,
    };
  } catch (err) {
    return { valid: false, error: err.message || 'fetch error' };
  }
}

/**
 * Validation E.164 stricte (max 15 chiffres, +<digits>).
 */
export function isValidE164(phone) {
  return typeof phone === 'string' && /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Masque un numéro pour affichage : +33 6 12 34 56 78 → +•• • •• •• 56 78
 * (on garde les 4 derniers chiffres visibles).
 */
export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const tail = phone.slice(-4);
  return `••• ••• ${tail}`;
}
