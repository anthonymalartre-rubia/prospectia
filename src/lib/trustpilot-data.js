// ─────────────────────────────────────────────────────────────────────
// Trustpilot — configuration centralisée + données affichées
// ─────────────────────────────────────────────────────────────────────
//
// COMMENT ACTIVER LES ÉTOILES TRUSTPILOT SUR LE SITE :
//
// 1) Créer un compte Trustpilot Business (gratuit) sur :
//    https://business.trustpilot.com/signup
//    → Domaine : prospectia.cloud
//    → Récupérer le "Business Unit ID" (ex: 6500abc1234defghi5678901)
//
// 2) Ajouter sur Vercel (Settings > Environment Variables) :
//    NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=ton_business_unit_id
//    → Production + Preview + Development
//
// 3) Collecter au moins 3-5 vrais avis (sinon Google ignore le snippet) :
//    - Email aux power users
//    - Encart dashboard "ReviewSolicitationBanner" (apparaît après 1er
//      export CSV — voir src/components/ReviewSolicitationBanner.jsx)
//    - Footer mails transactionnels avec lien
//
// 4) Quand les avis arrivent, mettre à jour MANUELLEMENT les chiffres
//    ci-dessous (TRUSTPILOT_RATING + TRUSTPILOT_REVIEW_COUNT). Le plan
//    Free Trustpilot ne donne pas accès à l'API : on lit les chiffres
//    visibles sur le dashboard Trustpilot et on les inscrit ici.
//    → Update typique : 1× par semaine au début, 1× par mois ensuite.
//
// 5) Déployer. Les étoiles apparaîtront dans Google SERP sous 1-4 semaines
//    (le temps que Googlebot recrawle). Pour accélérer : Search Console >
//    Inspection d'URL > "Demander une indexation" sur la landing.
//
// ─────────────────────────────────────────────────────────────────────

// Lu depuis env var. Si absent → Trustpilot désactivé partout, aucun
// composant ne s'affiche, le JSON-LD aggregateRating n'est pas injecté.
export const TRUSTPILOT_BUSINESS_UNIT_ID =
  process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || '';

// Note moyenne et nombre d'avis actuels — à updater MANUELLEMENT.
// Sources : dashboard Trustpilot business.trustpilot.com → Reviews.
// IMPORTANT : ces valeurs DOIVENT correspondre exactement à ce qui est
// visible publiquement sur Trustpilot, sinon Google flag "discrepancy".
export const TRUSTPILOT_RATING = 0;       // Ex: 4.7 — laissé à 0 tant que pas d'avis
export const TRUSTPILOT_REVIEW_COUNT = 0; // Ex: 23

// Slug Trustpilot public — utilisé pour les liens "Voir les avis" et
// le lien Trustpilot dans le JSON-LD `sameAs`.
export const TRUSTPILOT_PROFILE_SLUG = 'prospectia.cloud';

// URL publique du profil Trustpilot
export const TRUSTPILOT_PROFILE_URL = `https://fr.trustpilot.com/review/${TRUSTPILOT_PROFILE_SLUG}`;

// URL pour inviter à laisser un avis (ouvre directement le formulaire)
export const TRUSTPILOT_REVIEW_URL = `https://fr.trustpilot.com/evaluate/${TRUSTPILOT_PROFILE_SLUG}`;

/**
 * Renvoie true si Trustpilot est entièrement opérationnel :
 * - Business Unit ID configuré (env var)
 * - Au moins 1 avis (TRUSTPILOT_REVIEW_COUNT > 0)
 *
 * Les composants Badge/Block doivent retourner null si false.
 */
export function isTrustpilotEnabled() {
  return Boolean(TRUSTPILOT_BUSINESS_UNIT_ID) && TRUSTPILOT_REVIEW_COUNT > 0;
}

/**
 * Renvoie true si Trustpilot est configuré mais sans avis encore.
 * Utile pour afficher des CTAs de sollicitation au lieu du widget.
 */
export function isTrustpilotConfiguredWaitingForReviews() {
  return Boolean(TRUSTPILOT_BUSINESS_UNIT_ID) && TRUSTPILOT_REVIEW_COUNT === 0;
}

/**
 * Données Trustpilot consolidées pour les composants.
 * Retourne null si pas activé (pour rendre conditionnel facilement).
 */
export function getTrustpilotData() {
  if (!isTrustpilotEnabled()) return null;
  return {
    rating: TRUSTPILOT_RATING,
    reviewCount: TRUSTPILOT_REVIEW_COUNT,
    profileUrl: TRUSTPILOT_PROFILE_URL,
    reviewUrl: TRUSTPILOT_REVIEW_URL,
    businessUnitId: TRUSTPILOT_BUSINESS_UNIT_ID,
  };
}
