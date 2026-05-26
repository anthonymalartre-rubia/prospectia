// ─────────────────────────────────────────────────────────────────────
// Catalogue des events webhooks Volia — client-safe.
// ─────────────────────────────────────────────────────────────────────
// Ce fichier ne dépend QUE de constantes JS pures (zéro import Node), donc
// peut être importé depuis un composant client React (UI picker).
//
// Garder en sync avec la doc /api publique en cas d'ajout.
// L'emitter (server-only) re-export pour la compat des imports existants.
//
// Flag `available` :
//   true (défaut)  → l'event est réellement émis quelque part dans le code.
//                    Sélectionnable dans /settings/webhooks + exposé via
//                    GET /api/v1/webhooks/events + visible dans la doc Zapier.
//   false           → event documenté mais pas encore câblé. Caché des UI
//                    publiques tant qu'il n'est pas implémenté pour éviter de
//                    promettre quelque chose qui n'arrivera jamais côté client.

export const WEBHOOK_EVENTS = [
  { id: '*', label: 'Tous les events', module: 'Global', description: 'Wildcard — recevra TOUS les events Volia.', available: true },

  // Prospection
  { id: 'prospect.created', label: 'Prospect créé', module: 'Prospection', description: 'Un nouveau prospect a été ajouté.', available: true },
  { id: 'prospect.enriched', label: 'Prospect enrichi', module: 'Prospection', description: 'Email ou téléphone trouvé via le waterfall.', available: false },
  { id: 'prospect.opt_out', label: 'Prospect opt-out', module: 'Prospection', description: "Un prospect s'est désinscrit (RGPD).", available: false },
  { id: 'search.completed', label: 'Recherche terminée', module: 'Prospection', description: 'Une session de recherche est terminée.', available: false },

  // Campagnes
  { id: 'campaign.sent', label: 'Campagne envoyée', module: 'Campagnes', description: 'Une campagne email/SMS a démarré son envoi.', available: false },
  { id: 'campaign.completed', label: 'Campagne terminée', module: 'Campagnes', description: 'Tous les emails ont été envoyés.', available: true },
  { id: 'email.delivered', label: 'Email délivré', module: 'Campagnes', description: 'Resend confirme la délivrance.', available: true },
  { id: 'email.opened', label: 'Email ouvert', module: 'Campagnes', description: 'Premier tracking pixel chargé.', available: true },
  { id: 'email.clicked', label: 'Email cliqué', module: 'Campagnes', description: 'Un destinataire a cliqué un lien tracké.', available: true },
  { id: 'email.bounced', label: 'Email bounce', module: 'Campagnes', description: 'Email rejeté par le serveur destinataire.', available: false },
  { id: 'email.replied', label: 'Email répondu', module: 'Campagnes', description: 'Un destinataire a répondu (inbound parsing).', available: true },
  { id: 'sms.delivered', label: 'SMS délivré', module: 'Campagnes', description: 'Twilio confirme la délivrance.', available: false },
  { id: 'sms.replied', label: 'SMS répondu', module: 'Campagnes', description: 'Réponse SMS reçue.', available: false },

  // Sequences
  { id: 'sequence.enrolled', label: 'Séquence : inscription', module: 'Séquences', description: 'Un prospect est entré dans une séquence.', available: true },
  { id: 'sequence.completed', label: 'Séquence terminée', module: 'Séquences', description: 'Le prospect a atteint la dernière étape.', available: false },

  // CRM
  { id: 'crm.contact.created', label: 'Contact CRM créé', module: 'CRM', description: 'Auto-créé depuis une réponse email/SMS ou manuel.', available: true },
  { id: 'crm.deal.created', label: 'Deal CRM créé', module: 'CRM', description: 'Nouvelle opportunité.', available: true },
  { id: 'crm.deal.stage_changed', label: 'Deal CRM : étape changée', module: 'CRM', description: 'Un deal a bougé dans le pipeline.', available: true },
  { id: 'crm.deal.won', label: 'Deal CRM gagné', module: 'CRM', description: 'Un deal est passé en stage "won".', available: true },
  { id: 'crm.deal.lost', label: 'Deal CRM perdu', module: 'CRM', description: 'Un deal est passé en stage "lost".', available: true },
];

// Helper : sous-ensemble des events réellement émis (UI/API publiques).
export function getAvailableEvents() {
  return WEBHOOK_EVENTS.filter((e) => e.available !== false);
}

// Groupes module → events (pour le picker UI organisé en sections).
// `availableOnly` (défaut true) cache les events non encore câblés pour
// éviter qu'un user crée une subscription qui ne se déclenchera jamais.
export function groupEventsByModule({ availableOnly = true } = {}) {
  const map = new Map();
  for (const e of WEBHOOK_EVENTS) {
    if (availableOnly && e.available === false) continue;
    const arr = map.get(e.module) || [];
    arr.push(e);
    map.set(e.module, arr);
  }
  return Array.from(map.entries());
}

// Couleur de badge par module (semantic, pas hardcoded marque).
export function moduleColor(module) {
  switch (module) {
    case 'Prospection':
      return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
    case 'Campagnes':
      return 'bg-violet-500/15 text-violet-600 border-violet-500/30';
    case 'Séquences':
      return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
    case 'CRM':
      return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'Global':
    default:
      return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
  }
}
