// ─────────────────────────────────────────────────────────────────────
// inbound-domain.js — Helper centralisé pour le sous-domaine inbound Volia
// ─────────────────────────────────────────────────────────────────────
//
// Architecture inbound :
//   - On utilise UN seul sous-domaine `reply.volia.fr` (Resend Inbound)
//     pour collecter les réponses de toutes les campagnes de tous les
//     clients. Modèle "Mailchimp" : domaine centralisé, dispatching
//     côté webhook via parsing du local-part.
//   - Chaque email envoyé par une campagne porte un reply_to unique :
//       reply_to: c-{campaign_id_hex}@reply.volia.fr
//     Le prospect répond → l'email arrive sur Resend Inbound → webhook
//     /api/webhooks/resend/inbound parse le `to` pour retrouver la
//     campagne, puis le webhook lookup l'owner_id pour auto-create
//     le contact + deal CRM.
//
//   - Pour les clients qui ont leur propre domaine d'envoi
//     (send.cabinet-dupont.fr), les replies passent QUAND MÊME par
//     reply.volia.fr — pas reply.cabinet-dupont.fr. Avantage : aucun
//     setup MX additionnel côté client. Inconvénient : le `reply-to`
//     affiche un domaine Volia (mais ça reste un détail UX rarement
//     remarqué par les destinataires).
//
//   - Si le client a explicitement défini campaign.reply_to (champ
//     custom dans le formulaire de création), on respecte ce choix
//     plutôt que d'imposer notre adresse inbound. Sortie : on perd
//     l'auto-create CRM pour cette campagne (les replies arrivent
//     directement chez le client, pas chez nous).
//
// Configuration :
//   - INBOUND_REPLY_DOMAIN env var pour override (ex: en staging
//     `reply.staging.volia.fr`). Fallback hardcodé `reply.volia.fr`.
// ─────────────────────────────────────────────────────────────────────

/**
 * Le sous-domaine inbound Volia. Fallback `reply.volia.fr` si pas
 * d'env var. Côté serveur uniquement (pas exposé client).
 */
export function getInboundReplyDomain() {
  return (process.env.INBOUND_REPLY_DOMAIN || 'reply.volia.fr').trim().toLowerCase();
}

/**
 * Construit une adresse reply-to unique par campagne.
 *
 * Format : c-{campaign_id_sans_tirets}@reply.volia.fr
 *
 * On retire les tirets de l'UUID pour rester sous 64 chars de local-part
 * (limite SMTP RFC 5321) et avoir une adresse plus propre.
 *
 * @param {string} campaignId UUID de la campagne email
 * @returns {string|null} L'adresse reply-to, ou null si campaignId invalide
 */
export function buildCampaignReplyAddress(campaignId) {
  if (!campaignId || typeof campaignId !== 'string') return null;
  const clean = campaignId.replace(/-/g, '').toLowerCase();
  // UUID hex = 32 chars + prefix `c-` = 34 chars < 64. OK.
  if (!/^[0-9a-f]{32}$/.test(clean)) return null;
  return `c-${clean}@${getInboundReplyDomain()}`;
}

/**
 * Parse une adresse reply-to inbound pour récupérer le campaign_id.
 *
 * Accepte les formats :
 *   - c-{32hex}@reply.volia.fr
 *   - "Name <c-{32hex}@reply.volia.fr>"
 *   - c-{32hex}@n'importe-quel-domaine (utile si l'utilisateur fait
 *     suivre le mail à une autre adresse — on récupère quand même
 *     l'ID si le local-part matche).
 *
 * @param {string} addressLike L'adresse `to` reçue par le webhook inbound
 * @returns {string|null} UUID au format standard (avec tirets) ou null
 */
export function parseCampaignReplyAddress(addressLike) {
  if (!addressLike) return null;
  // Extrait l'email même si format "Name <foo@bar>"
  const match = String(addressLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = match?.[1] || String(addressLike);
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return null;
  const localPart = email.slice(0, atIdx).toLowerCase().trim();
  // Match `c-{32hex}` (on autorise du suffixe optionnel après pour
  // accepter d'éventuels variantes futures genre `c-{32hex}-{rcpt_hash}`)
  const m = localPart.match(/^c-([0-9a-f]{32})/);
  if (!m) return null;
  const hex = m[1];
  // Reformate en UUID standard avec tirets : 8-4-4-4-12
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Vérifie qu'un domaine `to` correspond bien à notre inbound Volia.
 * Utile côté webhook pour s'assurer qu'on traite un vrai reply de
 * campagne et pas un email perdu envoyé à reply.volia.fr par erreur.
 *
 * @param {string} domain Le domaine extrait du `to` (ex: 'reply.volia.fr')
 * @returns {boolean}
 */
export function isInboundDomain(domain) {
  if (!domain) return false;
  return String(domain).toLowerCase().trim() === getInboundReplyDomain();
}

/**
 * Construit une adresse reply-to unique par enrollment de séquence.
 * Format : s-{enrollment_id_sans_tirets}@reply.volia.fr
 *
 * Permet de matcher un reply à un enrollment précis (donc à un contact
 * + une séquence) pour stopper les follow-ups (stop-on-reply).
 *
 * @param {string} enrollmentId UUID de la row sequence_enrollments
 * @returns {string|null}
 */
export function buildSequenceReplyAddress(enrollmentId) {
  if (!enrollmentId || typeof enrollmentId !== 'string') return null;
  const clean = enrollmentId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(clean)) return null;
  return `s-${clean}@${getInboundReplyDomain()}`;
}

/**
 * Parse une adresse reply-to inbound de séquence pour récupérer l'enrollment_id.
 * @param {string} addressLike
 * @returns {string|null} UUID au format standard (avec tirets) ou null
 */
export function parseSequenceReplyAddress(addressLike) {
  if (!addressLike) return null;
  const match = String(addressLike).match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = match?.[1] || String(addressLike);
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return null;
  const localPart = email.slice(0, atIdx).toLowerCase().trim();
  const m = localPart.match(/^s-([0-9a-f]{32})/);
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
