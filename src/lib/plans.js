export const PLANS = {
  free: {
    id: 'free',
    name: 'Starter',
    price: 0,
    limits: {
      searches_per_month: 100,
      enrichments_per_month: 20,
      folders: 3,
      exports_per_month: 5,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4900, // cents
    stripePriceId: (process.env.STRIPE_PRO_PRICE_ID || '').trim(),
    limits: {
      searches_per_month: -1, // unlimited
      enrichments_per_month: 500,
      folders: -1,
      exports_per_month: -1,
      // Plafond explicite : sans ça, isLimitReached(undefined, n) renvoyait false
      // et un user Pro pouvait faire un nombre illimité de vérifs MillionVerifier
      // (facture API qui explose). Ref audit P0 #3.
      verifications_per_month: 1000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 14900, // cents
    stripePriceId: (process.env.STRIPE_ENTERPRISE_PRICE_ID || '').trim(),
    limits: {
      searches_per_month: -1,
      enrichments_per_month: -1,
      folders: -1,
      exports_per_month: -1,
      verifications_per_month: 5000,
    },
  },
};

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

export function isLimitReached(limit, currentUsage) {
  if (limit === -1) return false;
  // Fail-safe : si la limite n'est pas définie pour ce plan, on refuse
  // (au lieu d'autoriser un usage illimité par défaut).
  if (limit === undefined || limit === null) return true;
  return currentUsage >= limit;
}
