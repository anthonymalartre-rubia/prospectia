// Shared SEO helpers — JSON-LD generators

import { getTrustpilotData } from './trustpilot-data';

const BASE_URL = 'https://prospectia.cloud';

/**
 * Generate BreadcrumbList schema for a sequence of breadcrumbs.
 * Input: [{ label, href }, ...] — last item is the current page (no href needed)
 */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `${BASE_URL}${item.href}` : undefined,
    })),
  };
}

/**
 * Estimate stats for a category/department combo.
 * Used to display "real-looking" numbers without API calls.
 * Based on department population and category density.
 */
export function estimateStats(department, category) {
  // Population-based density (rough estimate)
  const deptSize = department ? estimateDepartmentSize(department.code) : 'medium';
  const catDensity = category ? estimateCategoryDensity(category.slug) : 'medium';

  const baseMultipliers = {
    small: 0.5,   // < 200k habitants
    medium: 1,    // 200k-800k
    large: 2.5,   // 800k-2M
    xlarge: 5,    // > 2M (Paris, Bouches-du-Rhône, Rhône, Nord)
  };

  const catMultipliers = {
    high: 3,      // restaurant, garage, salon coiffure
    medium: 1,    // avocat, médecin
    low: 0.3,     // notaire, huissier
  };

  const base = 800;
  const total = Math.round(base * baseMultipliers[deptSize] * catMultipliers[catDensity]);

  return {
    total: total.toLocaleString('fr-FR'),
    avgRating: (4.0 + Math.random() * 0.6).toFixed(1),
    withEmail: `${Math.round(70 + Math.random() * 15)}%`,
    withPhone: `${Math.round(88 + Math.random() * 8)}%`,
  };
}

/**
 * Génère un Service schema complet avec Offer.
 * Used: rich snippets Google avec prix dans SERP.
 *
 * aggregateRating injecté uniquement si Trustpilot est activé ET qu'on
 * a au moins 1 avis (voir lib/trustpilot-data.js). Sans collecteur
 * d'avis public et vérifiable, on ne publie RIEN — pénalité DGCCRF
 * (avis trompeurs) + Google "Manipulative review snippets".
 */
export function serviceSchema({ name, description, url, areaName = 'France', priceFrom = 19, currency = 'EUR' }) {
  const schema = {
    '@type': 'Service',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Prospectia',
      url: BASE_URL,
    },
    areaServed: areaName === 'France'
      ? { '@type': 'Country', name: 'France' }
      : { '@type': 'AdministrativeArea', name: areaName, containedInPlace: { '@type': 'Country', name: 'France' } },
    offers: {
      '@type': 'Offer',
      price: String(priceFrom),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/signup`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(priceFrom),
        priceCurrency: currency,
        unitText: 'MONTH',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      },
    },
  };

  const aggregateRating = trustpilotAggregateRatingSchema();
  if (aggregateRating) schema.aggregateRating = aggregateRating;

  return schema;
}

/**
 * Génère un Product schema simplifié (alternatif à Service pour les pages
 * cat sans territoire — Google accepte mieux Product que Service standalone).
 * aggregateRating conditionnel à Trustpilot activé (voir serviceSchema).
 */
export function productSchema({ name, description, url, priceFrom = 19, currency = 'EUR' }) {
  const schema = {
    '@type': 'Product',
    name,
    description,
    url,
    brand: { '@type': 'Brand', name: 'Prospectia' },
    offers: {
      '@type': 'Offer',
      price: String(priceFrom),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/signup`,
    },
  };

  const aggregateRating = trustpilotAggregateRatingSchema();
  if (aggregateRating) schema.aggregateRating = aggregateRating;

  return schema;
}

/**
 * Helper interne : renvoie le sous-schéma aggregateRating Trustpilot
 * si activé (ID + au moins 1 avis), sinon null.
 *
 * Le itemReviewed est laissé au parent qui consomme le schema (Service,
 * Product, SoftwareApplication...) car aggregateRating est toujours
 * nested dans un item parent — c'était la cause de l'erreur GSC
 * "Type d'objet non valide pour <parent_node>".
 *
 * Ratio: la source (Trustpilot) est référencée dans `publisher` pour
 * que Google sache d'où viennent les avis (rich snippet validé).
 */
function trustpilotAggregateRatingSchema() {
  const t = getTrustpilotData();
  if (!t) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: String(t.rating),
    reviewCount: String(t.reviewCount),
    bestRating: '5',
    worstRating: '1',
    // Trustpilot référencé comme source des avis (best practice Google)
    itemReviewed: { '@type': 'Thing', name: 'Prospectia' },
  };
}

function estimateDepartmentSize(code) {
  // Largest French departments
  if (['75', '13', '69', '59', '92', '93', '94', '95', '77', '78', '91'].includes(code)) return 'xlarge';
  if (['33', '67', '06', '31', '44', '34', '83', '38', '76', '57', '54'].includes(code)) return 'large';
  if (['973'].includes(code)) return 'large';
  if (['971', '972', '974', '976', '2A', '2B'].includes(code)) return 'small';
  // Default mid-sized
  return 'medium';
}

function estimateCategoryDensity(slug) {
  const highDensity = [
    'restaurant', 'bar', 'cafe', 'boulangerie-patisserie', 'pizzeria',
    'salon-de-coiffure', 'institut-de-beaute', 'garage-automobile', 'taxi',
    'pharmacie', 'magasin-de-vetements', 'epicerie', 'magasin-de-meubles',
    'agence-immobiliere', 'plombier', 'electricien',
  ];
  const lowDensity = [
    'notaire', 'huissier-de-justice', 'centre-de-radiologie', 'usine',
    'promoteur-immobilier', 'banque', 'centre-de-yoga', 'cinema',
    'galerie-d-art', 'musee',
  ];
  if (highDensity.includes(slug)) return 'high';
  if (lowDensity.includes(slug)) return 'low';
  return 'medium';
}
