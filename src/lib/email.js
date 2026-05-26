// src/lib/email.js
// Lightweight email utility using Resend REST API (no SDK dependency)
import { cleanEnv } from './envClean';

// From address par défaut.
// Domaine `volia.fr` vérifié sur Resend depuis mai 2026 (post-rebrand
// Prospectia → Volia). Configuration hybride :
//   - DKIM TXT à l'apex (resend._domainkey.volia.fr) → DMARC alignment OK
//   - MX + SPF sur le sous-domaine `send.volia.fr` (isolé de l'apex,
//     pour ne pas casser le MX Infomaniak qui sert `*@volia.fr`)
//   - "Enable Receiving" OFF côté Resend (Infomaniak Mail gère la réception)
//
// Note délivrabilité : on envoie From: hello@volia.fr. DKIM signe avec la clé
// volia.fr → aligne avec le From. SPF check passe car Resend utilise
// `bounce@send.volia.fr` comme envelope sender (qui a son propre SPF
// include:amazonses.com). DMARC valide via DKIM alignment.
//
// Fallback `onboarding@resend.dev` : sandbox Resend qui marche même si le
// domaine custom est rejeté (utile en preview/staging avec une clé test).
//
// Surchargeable via RESEND_FROM_ADDRESS pour les déploiements preview/staging.
const DEFAULT_FROM = 'Volia <hello@volia.fr>';
const FALLBACK_FROM = 'Volia <onboarding@resend.dev>';

/**
 * Send a transactional email via Resend API.
 *
 * Comportement avec fallback automatique :
 *   1. Tentative depuis le domaine custom (hello@volia.fr)
 *   2. Si Resend refuse avec "domain not verified" ou "validation_error" ou 403,
 *      retentative depuis onboarding@resend.dev (sandbox Resend qui marche
 *      toujours, mais limité à l'email du compte Resend en mode dev).
 *
 * @param {{ to, subject, html, replyTo?, from? }} options
 * @returns {Promise<{ success, id?, error?, fromUsed?, fallbackUsed?, status? }>}
 */
export async function sendEmail({ to, subject, html, replyTo, from, tags }) {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — skipping email');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const isTestKey = apiKey.startsWith('re_test_');
  const customFrom = cleanEnv(process.env.RESEND_FROM_ADDRESS);
  // Si `from` est explicitement fourni (cas multi-tenant senders), on l'utilise
  // en priorité. Sinon on garde l'ancien comportement (env var ou default).
  const primaryFrom = isTestKey ? FALLBACK_FROM : (from || customFrom || DEFAULT_FROM);

  // Try 1 : sender custom
  const firstAttempt = await callResend({ apiKey, from: primaryFrom, to, subject, html, replyTo, tags });
  if (firstAttempt.success) {
    return { ...firstAttempt, fromUsed: primaryFrom, fallbackUsed: false };
  }

  // Si on était déjà sur le sandbox, pas de fallback possible
  if (primaryFrom === FALLBACK_FROM) {
    return { ...firstAttempt, fromUsed: primaryFrom, fallbackUsed: false };
  }

  // Cas qui méritent un fallback : domain non vérifié, validation, 403
  const errMsg = (firstAttempt.error || '').toLowerCase();
  const shouldFallback =
    errMsg.includes('domain') ||
    errMsg.includes('verify') ||
    errMsg.includes('not allowed') ||
    errMsg.includes('validation') ||
    firstAttempt.status === 403;

  if (!shouldFallback) {
    return { ...firstAttempt, fromUsed: primaryFrom, fallbackUsed: false };
  }

  console.warn(`[email] Primary sender ${primaryFrom} refused (${firstAttempt.error}). Retrying with ${FALLBACK_FROM}...`);
  const fallbackAttempt = await callResend({ apiKey, from: FALLBACK_FROM, to, subject, html, replyTo, tags });

  // Conserve la trace du primary error même si le fallback marche, et
  // surtout si le fallback échoue (très utile pour le debug).
  const primaryErrorTrace = `primary[${primaryFrom}]: ${firstAttempt.error}`;

  if (fallbackAttempt.success) {
    return {
      ...fallbackAttempt,
      fromUsed: FALLBACK_FROM,
      fallbackUsed: true,
      primaryError: firstAttempt.error,
    };
  }
  return {
    ...fallbackAttempt,
    error: `${fallbackAttempt.error} | ${primaryErrorTrace}`,
    fromUsed: FALLBACK_FROM,
    fallbackUsed: true,
    primaryError: firstAttempt.error,
  };
}

async function callResend({ apiKey, from, to, subject, html, replyTo, tags }) {
  try {
    const body = { from, to: [to], subject, html };
    if (replyTo) body.reply_to = replyTo;
    // Resend tags : tableau d'objets { name, value } (lettres/chiffres/_ et -)
    // Utilisé pour le routage webhook (campaign_id, user_id…). Doc :
    // https://resend.com/docs/api-reference/emails/send-email#tags
    if (Array.isArray(tags) && tags.length > 0) body.tags = tags;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || data.name || `HTTP ${res.status}`;
      console.error(`[email] Resend error (status ${res.status}, from ${from}):`, data);
      return { success: false, error: errorMsg, status: res.status };
    }

    console.log(`[email] Sent "${subject}" to ${to} via ${from} (id: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[email] Network/fetch error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}
