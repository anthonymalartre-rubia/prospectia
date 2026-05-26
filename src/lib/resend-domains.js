// src/lib/resend-domains.js
//
// Lightweight wrapper around the Resend Domains REST API.
// Used by the Email Senders feature where each Volia customer connects their
// own sending domain (Mailchimp-style multi-tenant). The Volia Resend account
// hosts N customer domains.
//
// Doc : https://resend.com/docs/api-reference/domains
//
// Notes :
//   - Région forcée à `eu-west-1` (Dublin) pour la conformité RGPD :
//     les emails partent depuis l'Europe, alignés sur Supabase EU.
//   - Pas de SDK : fetch natif, zéro dépendance supplémentaire.
//   - Null-safe : si RESEND_API_KEY manque, on throw une erreur explicite
//     pour ne pas masquer un problème de configuration.

import { cleanEnv } from './envClean';

const RESEND_API_BASE = 'https://api.resend.com';
const RESEND_REGION = 'eu-west-1';

function getApiKey() {
  const key = cleanEnv(process.env.RESEND_API_KEY);
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return key;
}

/**
 * Map d'erreur Resend → message lisible côté UI.
 * On expose un code stable (`code`) pour que l'API route puisse choisir
 * le status HTTP à renvoyer au client.
 */
function buildResendError(status, payload) {
  const message =
    (payload && (payload.message || payload.error)) ||
    `Resend API error (HTTP ${status})`;

  const err = new Error(message);
  err.status = status;

  if (status === 401) err.code = 'resend_unauthorized';
  else if (status === 403) err.code = 'resend_forbidden';
  else if (status === 422) err.code = 'resend_validation';
  else if (status === 429) err.code = 'resend_rate_limited';
  else if (status === 404) err.code = 'resend_not_found';
  else err.code = 'resend_error';

  return err;
}

async function resendFetch(path, init = {}) {
  const apiKey = getApiKey();

  const res = await fetch(`${RESEND_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  // DELETE renvoie souvent un body vide / 200 sans JSON. On gère.
  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!res.ok) {
    throw buildResendError(res.status, payload);
  }

  return payload || {};
}

/**
 * Crée un domaine côté Resend.
 * @param {string} domain  ex: 'send.cabinet-dupont.fr'
 * @returns {Promise<{ id: string, name: string, status: string, records: Array }>}
 */
export async function createResendDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    throw new Error('domain is required');
  }
  const data = await resendFetch('/domains', {
    method: 'POST',
    body: JSON.stringify({ name: domain, region: RESEND_REGION }),
  });
  return {
    id: data.id,
    name: data.name,
    status: data.status || 'not_started',
    records: Array.isArray(data.records) ? data.records : [],
  };
}

/**
 * Récupère un domaine côté Resend (status + records actualisés).
 * @param {string} resendDomainId
 * @returns {Promise<{ id, name, status, records }>}
 */
export async function getResendDomain(resendDomainId) {
  if (!resendDomainId) {
    throw new Error('resendDomainId is required');
  }
  const data = await resendFetch(`/domains/${encodeURIComponent(resendDomainId)}`, {
    method: 'GET',
  });
  return {
    id: data.id,
    name: data.name,
    status: data.status || 'pending',
    records: Array.isArray(data.records) ? data.records : [],
  };
}

/**
 * Supprime un domaine côté Resend.
 * Idempotent côté Volia : si Resend renvoie 404 (déjà supprimé), on traite
 * comme un succès pour ne pas bloquer la suppression de la row Supabase.
 *
 * @param {string} resendDomainId
 * @returns {Promise<{ deleted: true }>}
 */
export async function deleteResendDomain(resendDomainId) {
  if (!resendDomainId) {
    throw new Error('resendDomainId is required');
  }
  try {
    await resendFetch(`/domains/${encodeURIComponent(resendDomainId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (err && err.status === 404) {
      return { deleted: true, alreadyGone: true };
    }
    throw err;
  }
  return { deleted: true };
}

/**
 * Valide le format d'un domaine d'envoi.
 *   - hostname FQDN (lettres, chiffres, tirets, points)
 *   - 2+ labels (pas de TLD seul, pas de localhost)
 *   - pas d'IP
 *   - bloque les sous-domaines de volia.fr (réservé à la plateforme)
 *
 * @param {string} input
 * @returns {{ valid: true, domain: string } | { valid: false, error: string }}
 */
export function validateSenderDomain(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Domaine requis' };
  }
  const domain = input.trim().toLowerCase();

  if (domain.length > 253) {
    return { valid: false, error: 'Domaine trop long (max 253 caractères)' };
  }

  // Bloque IPs (v4 simple)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return { valid: false, error: 'Les adresses IP ne sont pas autorisées' };
  }

  // Bloque localhost et noms réservés
  if (
    domain === 'localhost' ||
    domain.endsWith('.localhost') ||
    domain.endsWith('.local') ||
    domain.endsWith('.internal')
  ) {
    return { valid: false, error: 'Hostname interne non autorisé' };
  }

  // Format FQDN strict : labels alphanum (+ tirets), 2+ labels, TLD ≥ 2 lettres.
  const fqdnRe = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,63}$/;
  if (!fqdnRe.test(domain)) {
    return { valid: false, error: 'Format de domaine invalide (ex: send.exemple.fr)' };
  }

  // Bloque les sous-domaines de volia.fr (réservé à la plateforme)
  if (domain === 'volia.fr' || domain.endsWith('.volia.fr')) {
    return { valid: false, error: 'Les sous-domaines de volia.fr sont réservés' };
  }

  return { valid: true, domain };
}
