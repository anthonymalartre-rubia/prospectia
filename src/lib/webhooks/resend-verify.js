// Vérification de signature des webhooks Resend.
//
// Resend utilise Svix pour signer ses webhooks. Le format de signature suit
// le standard Svix : https://docs.svix.com/receiving/verifying-payloads/how-manual
//
// Headers envoyés :
//   svix-id        : identifiant unique du message (idempotency key)
//   svix-timestamp : timestamp Unix (secondes) au moment de l'envoi
//   svix-signature : "v1,<base64sig> v1,<base64sig2>" (espace pour rotation de clé)
//
// Algorithme :
//   1. Le secret est au format "whsec_<base64>". On retire le préfixe puis on
//      décode le base64 pour obtenir la clé HMAC brute (raw bytes).
//   2. On construit le signed_payload : `<svix-id>.<svix-timestamp>.<body>`
//   3. On calcule HMAC-SHA256(signed_payload, key) puis on encode en base64.
//   4. On compare TOUTES les signatures fournies dans `svix-signature` (timing-safe).
//   5. On vérifie aussi que le timestamp n'est pas trop ancien (tolérance 5 min)
//      pour empêcher les replay attacks.
//
// Doc officielle : https://resend.com/docs/dashboard/webhooks/verify-webhooks

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 5 * 60; // 5 minutes — standard Svix

/**
 * Vérifie qu'un webhook Resend est authentique.
 *
 * @param {object} args
 * @param {string} args.payload  - Le body brut de la requête (string, AVANT JSON.parse)
 * @param {Headers|object} args.headers - Les headers HTTP (Headers ou objet plain)
 * @param {string} args.secret   - Le secret de signature (whsec_xxx ou base64 brut)
 * @returns {boolean} true si la signature est valide
 * @throws {Error} si la signature est manquante, invalide, ou expirée
 */
export function verifyResendSignature({ payload, headers, secret }) {
  if (!secret) {
    throw new Error('verifyResendSignature: secret manquant (RESEND_WEBHOOK_SECRET)');
  }
  if (typeof payload !== 'string') {
    throw new Error('verifyResendSignature: payload doit être une string (raw body)');
  }

  // Récup des headers (compatible Headers + objet)
  const getHeader = (name) => {
    if (!headers) return null;
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  const svixId = getHeader('svix-id');
  const svixTimestamp = getHeader('svix-timestamp');
  const svixSignature = getHeader('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('verifyResendSignature: headers Svix manquants');
  }

  // Anti-replay : timestamp doit être < 5 min
  const tsNum = Number(svixTimestamp);
  if (!Number.isFinite(tsNum)) {
    throw new Error('verifyResendSignature: timestamp invalide');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > TOLERANCE_SECONDS) {
    throw new Error('verifyResendSignature: timestamp hors tolérance (replay attack?)');
  }

  // Décodage du secret : strip "whsec_" puis base64-decode
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let keyBuf;
  try {
    keyBuf = Buffer.from(rawSecret, 'base64');
  } catch {
    throw new Error('verifyResendSignature: secret doit être base64');
  }
  if (keyBuf.length === 0) {
    throw new Error('verifyResendSignature: secret invalide');
  }

  // signed_payload = id.timestamp.body
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSig = createHmac('sha256', keyBuf).update(signedPayload).digest('base64');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');

  // svix-signature peut contenir plusieurs sigs séparées par espace : "v1,sig1 v1,sig2"
  const providedSigs = svixSignature.split(' ').map((part) => {
    const [version, sig] = part.split(',');
    return { version, sig };
  });

  for (const { version, sig } of providedSigs) {
    if (version !== 'v1' || !sig) continue;
    const sigBuf = Buffer.from(sig, 'utf8');
    if (sigBuf.length !== expectedBuf.length) continue;
    if (timingSafeEqual(sigBuf, expectedBuf)) {
      return true;
    }
  }

  throw new Error('verifyResendSignature: aucune signature valide');
}
