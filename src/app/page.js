import LandingContent from '@/components/LandingContent';
import { FAQ_ITEMS } from '@/lib/faq-data';

const SITE_URL = 'https://prospectia.cloud';

export const metadata = {
  title: 'Prospectia — Prospection B2B France : trouvez emails & entreprises (à partir de 19 €/mois)',
  description: 'Le ticket d\'entrée le moins cher du marché français. Découverte de prospects via Google Places (150+ catégories, 101 départements) + enrichissement email automatique. À partir de 19 €/mois.',
  alternates: {
    canonical: SITE_URL,
    languages: {
      'fr-FR': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    title: 'Prospectia — Prospection B2B France à partir de 19 €/mois',
    description: 'Le moins cher du marché français. Découverte (Google Places) + enrichissement email automatique. 150+ catégories, 101 départements, scoring de confiance.',
    url: SITE_URL,
    siteName: 'Prospectia',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prospectia — Prospection B2B automatisée',
    description: 'À partir de 19 €/mois. Trouvez emails & entreprises en France. 150+ catégories, 101 départements.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for SaaS product (SoftwareApplication + offers + ratings)
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Prospectia',
  alternateName: ['Prospectia.ai', 'Prospectia.cloud'],
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'SalesIntelligence',
  operatingSystem: 'Web',
  description: 'Plateforme française de prospection B2B automatisée. Recherche d\'entreprises via Google Places (150+ catégories, 101 départements) + enrichissement email en cascade (scraping intelligent, recherche Google, fallback patterns) avec scoring de confiance. À partir de 19 €/mois.',
  url: SITE_URL,
  inLanguage: 'fr-FR',
  countriesSupported: 'FR',
  featureList: [
    'Recherche d\'entreprises B2B via Google Places',
    'Couverture des 101 départements français (métropole + DROM)',
    '150+ catégories d\'activité',
    'Enrichissement email en cascade (waterfall)',
    'Scraping intelligent des sites web',
    'Scoring de confiance par email',
    'Export CSV compatible tous CRM',
    'Recherche en langage naturel (IA Claude)',
    'Conformité RGPD (filtre emails personnels, opt-out public)',
    'Pas d\'engagement, annulation à tout moment',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      description: '100 prospects · 20 enrichissements · 5 exports par mois',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/signup`,
    },
    {
      '@type': 'Offer',
      name: 'Solo',
      description: '1 000 prospects · 400 enrichissements par mois',
      price: '19',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/signup`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '19',
        priceCurrency: 'EUR',
        unitText: 'MONTH',
        referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
      },
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      description: '5 000 prospects · 2 000 enrichissements par mois',
      price: '49',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/signup`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '49',
        priceCurrency: 'EUR',
        unitText: 'MONTH',
        referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
      },
    },
    {
      '@type': 'Offer',
      name: 'Business',
      description: '10 000 prospects · 4 000 enrichissements par mois',
      price: '99',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/signup`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '99',
        priceCurrency: 'EUR',
        unitText: 'MONTH',
        referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
      },
    },
  ],
  // aggregateRating retiré : sans système d'avis public et vérifiable
  // (Trustpilot, G2…), publier une note inventée enfreint le code de la
  // consommation (avis trompeurs, DGCCRF) et risque la pénalisation
  // Google "Manipulative review snippets". À réactiver dès qu'on a un
  // collecteur d'avis tiers branché.
  publisher: {
    '@type': 'Organization',
    name: 'Prospectia',
    url: SITE_URL,
  },
};

// FAQPage schema — Google renders Q/R rich snippet in SERP
const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <LandingContent />
    </>
  );
}
