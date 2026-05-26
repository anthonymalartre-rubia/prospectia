// Vérification de signature des webhooks Twilio.
//
// Twilio signe ses webhooks avec un HMAC-SHA1 de :
//   <url complete (incluant query string)> + <concat des paires clé+valeur des
//   params POST, triés alphabétiquement par clé>
// puis encodé en base64. Header : `X-Twilio-Signature`.
//
// Doc : https://www.twilio.com/docs/usage/webhooks/webhooks-security
// Source de référence : https://github.com/twilio/twilio-node/blob/main/src/webhooks/webhooks.ts
//
// IMPORTANT : l'URL doit être EXACTEMENT celle configurée dans la console
// Twilio (donc l'URL publique en https://... derrière le load balancer Vercel,
// pas l'URL interne). On la reconstruit côté caller via request.url ou
// process.env.NEXT_PUBLIC_SITE_URL.

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Vérifie une signature de webhook Twilio.
 *
 * @param {object} args
 * @param {string} args.url             - URL complète configurée côté Twilio (avec query)
 * @param {object} args.params          - Body de la requête (form-urlencoded → objet)
 * @param {string} args.twilioSignature - Header X-Twilio-Signature
 * @param {string} args.authToken       - Auth Token Twilio du compte expéditeur
 * @returns {boolean} true si valide, false sinon
 */
export function verifyTwilioSignature({ url, params, twilioSignature, authToken }) {
  if (!url || !twilioSignature || !authToken) return false;
  if (!params || typeof params !== 'object') return false;

  // Construction du payload : url + concat(key + value) pour chaque param trié
  const keys = Object.keys(params).sort();
  let data = url;
  for (const key of keys) {
    data += key + String(params[key] ?? '');
  }

  const expected = createHmac('sha1', authToken).update(data, 'utf8').digest('base64');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(twilioSignature, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;

  try {
    return timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
