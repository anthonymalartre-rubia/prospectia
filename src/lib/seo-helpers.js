// Shared SEO helpers — JSON-LD generators

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
 * aggregateRating volontairement omis : sans collecteur d'avis public et
 * vérifiable (Trustpilot, G2, Capterra…), publier une note moyenne expose
 * à 2 risques :
 *  1) DGCCRF — code de la consommation art. L.121-2, avis trompeurs.
 *  2) Google "Manipulative review snippets" → désindexation.
 * À réactiver dès qu'un collecteur tiers est branché.
 */
export function serviceSchema({ name, description, url, areaName = 'France', priceFrom = 19, currency = 'EUR' }) {
  return {
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
}

/**
 * Génère un Product schema simplifié (alternatif à Service pour les pages
 * cat sans territoire — Google accepte mieux Product que Service standalone).
 * aggregateRating omis volontairement (voir commentaire serviceSchema).
 */
export function productSchema({ name, description, url, priceFrom = 19, currency = 'EUR' }) {
  return {
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
