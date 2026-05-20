import { cleanEnv } from './envClean';

// ─── Plans Prospectia ─────────────────────────────────────────────
// Tarification orientée "le moins cher du marché par tier".
// Solo = ticket d'entrée payant à 19€ (vs Snov.io Starter 39€, Hunter 49€).
// Yearly = -2 mois offerts (paiement annuel).
//
// Hierarchy :
//   Free   → Découverte
//   Solo   → Freelance / consultant
//   Pro    → PME / agence
//   Business → Outbound machine (+ API + multi-users)

export const PLANS = {
  free: {
    id: 'free',
    name: 'Starter',
    price: 0,
    priceYearly: 0,
    tagline: 'Pour découvrir',
    limits: {
      searches_per_month: 100,
      enrichments_per_month: 20,
      folders: 3,
      exports_per_month: 5,
    },
    features: [
      '100 prospects/mois',
      '20 enrichissements/mois',
      '5 exports/mois',
      '3 dossiers',
      'Scraping email gratuit',
      'Export CSV',
      '101 départements (France entière)',
    ],
  },

  // ─── NOUVEAU : ticket d'entrée payant ─────────────────
  solo: {
    id: 'solo',
    name: 'Solo',
    price: 1900,   // 19 €/mois en centimes
    priceYearly: 19000,  // 190 €/an (~ 2 mois offerts)
    tagline: 'Pour freelances et consultants',
    stripePriceId: cleanEnv(process.env.STRIPE_SOLO_PRICE_ID || ''),
    stripePriceIdYearly: cleanEnv(process.env.STRIPE_SOLO_YEARLY_PRICE_ID || ''),
    limits: {
      searches_per_month: 1000,
      enrichments_per_month: 400,
      folders: 10,
      exports_per_month: -1,
      verifications_per_month: 100,
    },
    features: [
      '1 000 prospects/mois',
      '400 enrichissements/mois',
      'Exports illimités',
      '10 dossiers',
      'Cascade waterfall (scraping + Google)',
      'Support email (48 h)',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4900,
    priceYearly: 49000,  // 490 €/an
    tagline: 'Pour PME et agences',
    highlighted: true,   // affiché comme "Recommandé" sur la landing
    stripePriceId: cleanEnv(process.env.STRIPE_PRO_PRICE_ID || ''),
    stripePriceIdYearly: cleanEnv(process.env.STRIPE_PRO_YEARLY_PRICE_ID || ''),
    limits: {
      searches_per_month: 5000,
      enrichments_per_month: 1000,
      folders: -1,
      exports_per_month: -1,
      verifications_per_month: 500,
    },
    features: [
      '5 000 prospects/mois',
      '1 000 enrichissements/mois',
      'Exports illimités',
      'Dossiers illimités',
      'Cascade waterfall complète',
      'Vérification email (MillionVerifier)',
      'Support email (24 h)',
    ],
  },

  business: {
    id: 'business',
    name: 'Business',
    price: 9900,
    priceYearly: 99000,  // 990 €/an
    tagline: 'Pour équipes outbound',
    stripePriceId: cleanEnv(process.env.STRIPE_BUSINESS_PRICE_ID || ''),
    stripePriceIdYearly: cleanEnv(process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || ''),
    limits: {
      searches_per_month: 10000,
      enrichments_per_month: 10000,
      folders: -1,
      exports_per_month: -1,
      verifications_per_month: 5000,
    },
    features: [
      '10 000 prospects/mois',
      '10 000 enrichissements/mois',
      'Exports illimités',
      'Dossiers illimités',
      'Accès API (à venir)',
      'Multi-utilisateurs (à venir)',
      'Onboarding personnalisé',
      'Support prioritaire',
    ],
  },

  // ─── Conservé pour compatibilité — l'ancien plan "enterprise" ───
  // Stripe gardait un mapping price_id → enterprise pour les anciens clients.
  // On le garde en alias de business pour ne casser aucun ancien abonnement.
  enterprise: {
    id: 'enterprise',
    name: 'Business',
    price: 9900,
    priceYearly: 99000,
    tagline: 'Pour équipes outbound',
    stripePriceId: cleanEnv(process.env.STRIPE_ENTERPRISE_PRICE_ID || ''),
    stripePriceIdYearly: cleanEnv(process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || ''),
    limits: {
      searches_per_month: 10000,
      enrichments_per_month: 10000,
      folders: -1,
      exports_per_month: -1,
      verifications_per_month: 5000,
    },
    features: [],
  },
};

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

export function isLimitReached(limit, currentUsage) {
  if (limit === -1) return false;
  if (limit === undefined || limit === null) return true;
  return currentUsage >= limit;
}

/**
 * Retourne le price ID Stripe à utiliser pour un plan donné et une période.
 * @param {string} planId
 * @param {'monthly'|'yearly'} [period='monthly']
 */
export function getStripePriceId(planId, period = 'monthly') {
  const plan = PLANS[planId];
  if (!plan) return null;
  return period === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceId;
}

/**
 * Liste ordonnée des plans visibles sur la landing (pas enterprise alias).
 */
export const VISIBLE_PLANS = ['free', 'solo', 'pro', 'business'];
