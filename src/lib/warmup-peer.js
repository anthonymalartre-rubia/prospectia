// lib/warmup-peer.js
//
// Helpers pour le warmup peer-to-peer (Phase 3).
//
// ─────────────────────────────────────────────────────────────────────
// CE QUE FAIT LE PEER-TO-PEER
// ─────────────────────────────────────────────────────────────────────
// Le warmup MVP (lib/warmup.js) THROTTLE seulement : il limite le
// volume des vraies campagnes (10 → 200 emails/jour sur 28 jours).
// C'est honnête mais Gmail/Outlook ne reçoivent AUCUN signal positif
// "ce domaine est légit". Si les premiers vrais destinataires ignorent
// nos emails, la réputation domaine reste neutre voire négative.
//
// Le peer-to-peer (style Lemwarm / Mailwarm) génère du signal positif :
//   1. Tous les sender_id Volia verified sont enrôlés dans un pool
//   2. Chaque jour, chaque domaine envoie X emails aux AUTRES domaines du pool
//   3. Les destinataires "lisent" (open), "cliquent" et "répondent"
//   4. Ces engagements positifs sont vus par Gmail/Outlook → reputation+
//
// ─────────────────────────────────────────────────────────────────────
// SIMPLIFICATION MVP — INBOX UNIVERSELLE
// ─────────────────────────────────────────────────────────────────────
// On ne demande PAS aux users de configurer une vraie boîte
// `warmup@{leur_domaine}` (impossible sans MX inbound côté client).
//
// À la place, on utilise reply.volia.fr (notre catch-all Resend Inbound
// déjà déployé) :
//   - peer_email = `warmup-{senderId_hex}@reply.volia.fr`
//   - L'envoi : DEPUIS le domaine client (sender.domain, signé DKIM
//     client) VERS warmup-XXXX@reply.volia.fr
//   - Resend Inbound capte → webhook /api/webhooks/resend/inbound
//   - Le webhook reconnaît le préfixe `warmup-` et update
//     warmup_exchanges.replied_at + bump warmup_peer_pool.total_replied
//
// Limite : techniquement le `to` n'arrive pas sur le domaine client,
// donc Gmail ne voit pas un domaine→domaine "vrai". MAIS l'envoi DEPUIS
// le domaine client est bien signé DKIM/SPF/DMARC → réputation
// d'envoi qui se construit + engagement (open/click/reply) signalé
// par notre tracking Resend → reputation domaine de send qui monte.

import { getInboundReplyDomain } from './inbound-domain';

/**
 * Format de l'adresse peer pour un sender donné.
 * `warmup-{senderId sans tirets}@reply.volia.fr` (sub-domaine universel
 * géré par Volia via Resend Inbound).
 *
 * @param {string} senderId UUID du email_sender
 * @returns {string|null}
 */
export function buildPeerEmailAddress(senderId) {
  if (!senderId || typeof senderId !== 'string') return null;
  const clean = senderId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(clean)) return null;
  return `warmup-${clean}@${getInboundReplyDomain()}`;
}

/**
 * Parse une adresse peer pour récupérer le senderId.
 *
 * @param {string} addressLike `warmup-xxx@reply.volia.fr` ou format `Name <foo>`
 * @returns {string|null} UUID au format standard avec tirets, ou null
 */
export function parsePeerEmailAddress(addressLike) {
  if (!addressLike) return null;
  const match = String(addressLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = match?.[1] || String(addressLike);
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return null;
  const localPart = email.slice(0, atIdx).toLowerCase().trim();
  const m = localPart.match(/^warmup-([0-9a-f]{32})$/);
  if (!m) return null;
  const hex = m[1];
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Détecte si une adresse `to` matche un peer Volia.
 * Utile dans les webhooks pour distinguer un reply client d'un warmup ping.
 *
 * @param {string} addressLike
 * @returns {boolean}
 */
export function isPeerEmailAddress(addressLike) {
  return parsePeerEmailAddress(addressLike) !== null;
}

// ─────────────────────────────────────────────────────────────────────
// SUJETS / BODIES DES PEER-TO-PEER (random pool)
// ─────────────────────────────────────────────────────────────────────
// On varie les sujets/bodies pour ne pas qu'un filtre anti-spam
// repère un pattern trop régulier. Format court, neutre, B2B casual
// — similaire aux replies réels que produisent les commerciaux.

const SUBJECTS = [
  'Re: Suivi rapide',
  'Re: Quick follow-up',
  'Re: Point de la semaine',
  'Re: Notre échange',
  'Re: Pour info',
  'Re: Petit point',
  'Re: Disponibilités',
  'Re: Confirmation',
];

const BODIES = [
  `Bonjour,

Merci pour votre retour, je regarde ça et je reviens vers vous rapidement.

Bonne journée,
L'équipe Volia`,

  `Hi,

Just following up on the topic we discussed. Let me know your thoughts when you have a minute.

Best,
Volia team`,

  `Bonjour,

Bien noté pour votre message — je vous envoie un point détaillé d'ici la fin de semaine.

Cordialement,
Volia`,

  `Hello,

Thanks for the context, that helps a lot. I'll loop back with the next steps shortly.

Best regards,
Volia`,

  `Bonjour,

Je reviens vers vous concernant notre dernier échange. Tout est OK de notre côté.

Bien à vous,
Volia`,
];

/**
 * Pick aléatoire d'un sujet warmup.
 * @returns {string}
 */
export function randomWarmupSubject() {
  return SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
}

/**
 * Pick aléatoire d'un body warmup, déclinable en HTML simple.
 * @returns {{ text: string, html: string }}
 */
export function randomWarmupBody() {
  const text = BODIES[Math.floor(Math.random() * BODIES.length)];
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6;">${text
    .split('\n')
    .map((line) => (line.trim() === '' ? '<br/>' : line))
    .join('<br/>')}</div>`;
  return { text, html };
}

// ─────────────────────────────────────────────────────────────────────
// ENGAGEMENT SIMULATION
// ─────────────────────────────────────────────────────────────────────
// Probas calibrées pour ressembler à un comportement humain B2B :
//   - ~80% des emails sont ouverts
//   - ~30% des emails sont cliqués (sur le lien tracking)
//   - ~10% des emails sont répondus
//
// Ces signaux sont posés directement par notre cron (pas de delay réel)
// — Resend tracking events arriveront aussi via webhook si l'open
// tracking est activé, mais on ne dépend pas de ça pour les stats.

export const OPEN_PROBABILITY = 0.8;
export const CLICK_PROBABILITY = 0.3;
export const REPLY_PROBABILITY = 0.1;

/**
 * Décide si on simule open/click/reply pour cet échange.
 * @returns {{ shouldOpen: boolean, shouldClick: boolean, shouldReply: boolean }}
 */
export function rollEngagement() {
  // On contraint : pas de click sans open, pas de reply sans open
  const shouldOpen = Math.random() < OPEN_PROBABILITY;
  const shouldClick = shouldOpen && Math.random() < CLICK_PROBABILITY;
  const shouldReply = shouldOpen && Math.random() < REPLY_PROBABILITY;
  return { shouldOpen, shouldClick, shouldReply };
}

// Fraction d'envois quotidien réservée au peer-to-peer vs vraies campagnes.
// Ex: WARMUP_PEER_RATIO = 0.8 → 80% du quota jour est consommé en
// peer-to-peer (boost reputation), 20% reste pour les vraies campaigns.
export const WARMUP_PEER_RATIO = 0.8;

/**
 * Combien d'emails peer-to-peer envoyer aujourd'hui pour un sender donné,
 * en fonction de sa phase de warmup et de ce qu'il a déjà envoyé.
 *
 * Logique :
 *   - target = floor(phase.maxPerDay * WARMUP_PEER_RATIO)
 *   - déjà envoyés peer aujourd'hui = passé en argument
 *   - returns max(0, target - alreadySentPeer)
 *
 * @param {{ maxPerDay: number }} phase
 * @param {number} alreadySentPeerToday
 * @returns {number}
 */
export function computePeerSendBudget(phase, alreadySentPeerToday = 0) {
  if (!phase || typeof phase.maxPerDay !== 'number') return 0;
  const target = Math.max(1, Math.floor(phase.maxPerDay * WARMUP_PEER_RATIO));
  return Math.max(0, target - alreadySentPeerToday);
}
