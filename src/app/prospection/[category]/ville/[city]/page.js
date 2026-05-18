import { notFound } from 'next/navigation';
import ProspectionSeoPage from '@/components/ProspectionSeoPage';
import { getAllCategories, getCategoryBySlug, getAllDepartments } from '@/lib/slugs';
import { getAllCities, getCityBySlug, getCitiesByDept } from '@/lib/cities';
import { breadcrumbSchema, estimateStats } from '@/lib/seo-helpers';
import { DEPTS } from '@/lib/constants';

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  // Pre-build popular cat × popular city combinations
  const popularCats = [
    'restaurant', 'hotel', 'boulangerie-patisserie', 'pharmacie', 'avocat',
    'garage-automobile', 'agence-immobiliere', 'salon-de-coiffure',
    'plombier', 'electricien', 'expert-comptable',
  ];
  const popularCities = [
    'paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes',
    'montpellier', 'strasbourg', 'bordeaux', 'lille',
  ];
  const params = [];
  for (const cat of popularCats) {
    for (const city of popularCities) {
      params.push({ category: cat, city });
    }
  }
  return params; // 110 prebuilt, rest ISR on demand
}

export async function generateMetadata({ params }) {
  const { category: catSlug, city: citySlug } = await params;
  const category = getCategoryBySlug(catSlug);
  const city = getCityBySlug(citySlug);
  if (!category || !city) return {};

  const title = `Email des ${category.labelPlural} à ${city.name} — Prospectia`;
  const description = `Trouvez l'email professionnel de tous les ${category.labelPlural} à ${city.name}. Scraping intelligent + recherche Google. À partir de 49€/mois, illimité.`;

  return {
    title,
    description,
    alternates: { canonical: `https://prospectia.cloud/prospection/${catSlug}/ville/${citySlug}` },
    openGraph: {
      title,
      description,
      url: `https://prospectia.cloud/prospection/${catSlug}/ville/${citySlug}`,
    },
  };
}

export default async function CategoryCityPage({ params }) {
  const { category: catSlug, city: citySlug } = await params;
  const category = getCategoryBySlug(catSlug);
  const city = getCityBySlug(citySlug);
  if (!category || !city) notFound();

  const deptInfo = DEPTS[city.dept];
  if (!deptInfo) notFound();

  const allCats = getAllCategories();
  const allCities = getAllCities();

  // Other categories in same city (popular ones)
  const popularCats = ['restaurant', 'hotel', 'boulangerie-patisserie', 'pharmacie', 'avocat', 'garage-automobile', 'agence-immobiliere', 'salon-de-coiffure', 'plombier', 'electricien', 'expert-comptable', 'concessionnaire-automobile'];
  const relatedCategories = allCats
    .filter((c) => popularCats.includes(c.slug) && c.slug !== catSlug)
    .slice(0, 12)
    .map((c) => ({
      label: `${c.labelCapitalized} ${city.name}`,
      href: `/prospection/${c.slug}/ville/${citySlug}`,
    }));

  // Same category in other cities (top 12 popular)
  const popularCities = ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'montpellier', 'strasbourg', 'bordeaux', 'lille', 'rennes', 'reims'];
  const relatedDepartments = allCities
    .filter((c) => popularCities.includes(c.slug) && c.slug !== citySlug)
    .slice(0, 12)
    .map((c) => ({
      label: `${category.labelCapitalized} ${c.name}`,
      href: `/prospection/${catSlug}/ville/${c.slug}`,
    }));

  const title = `Trouver l'email des ${category.labelPlural} à ${city.name}`;
  const intro = `Vous cherchez à contacter les ${category.labelPlural} à ${city.name} (${city.dept}, ${deptInfo.name}) ? Prospectia identifie automatiquement tous les ${category.labelPlural} géolocalisés à ${city.name} via Google Places, puis trouve leur email professionnel grâce à notre moteur de scraping et recherche Google. Avec ${city.pop > 100000 ? `plus de ${Math.round(city.pop / 1000)} 000 habitants` : `${Math.round(city.pop / 1000)} 000 habitants`}, ${city.name} concentre des centaines voire des milliers de ${category.labelPlural}. Exportez la liste complète en CSV en quelques minutes, avec nom, adresse, téléphone, email vérifié, site web et note Google.`;

  const faq = [
    {
      question: `Combien de ${category.labelPlural} y a-t-il à ${city.name} ?`,
      answer: `${city.name} compte environ ${city.pop > 200000 ? 'plusieurs centaines' : 'plusieurs dizaines'} de ${category.labelPlural} référencés sur Google Places. Prospectia accède à tous les ${category.labelPlural} géolocalisés dans un rayon autour de ${city.name}.`,
    },
    {
      question: `Comment trouver l'email d'un ${category.label} à ${city.name} ?`,
      answer: `Sur Prospectia, vous filtrez par catégorie "${category.label}" et zone "${city.name}". Notre moteur scrape ensuite chaque site web et complète avec une recherche Google. En 5 minutes, vous récupérez tous les emails disponibles.`,
    },
    {
      question: `Les emails des ${category.labelPlural} de ${city.name} sont-ils à jour ?`,
      answer: `Oui. Les emails sont récupérés en temps réel à chaque recherche (pas de base statique vieillissante). Source : sites web officiels + Google + recherche dédiée pour les entreprises sans site.`,
    },
    {
      question: `Puis-je exporter en CSV les ${category.labelPlural} de ${city.name} ?`,
      answer: `Oui, exports illimités en CSV. Inclus dans tous les plans.`,
    },
    {
      question: `Le démarchage des ${category.labelPlural} à ${city.name} est-il légal ?`,
      answer: `Oui, en B2B et dans le cadre du RGPD (intérêt légitime). Tous les emails collectés sont professionnels et publics. Prospectia respecte automatiquement les opt-out.`,
    },
  ];

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Prospection B2B', href: '/prospection' },
    { label: category.labelCapitalized, href: `/prospection/${catSlug}` },
    { label: city.name },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'WebPage',
        name: title,
        description: intro,
        url: `https://prospectia.cloud/prospection/${catSlug}/ville/${citySlug}`,
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'Service',
        name: `Recherche email ${category.labelPlural} ${city.name}`,
        provider: { '@type': 'Organization', name: 'Prospectia', url: 'https://prospectia.cloud' },
        areaServed: {
          '@type': 'City',
          name: city.name,
          containedInPlace: { '@type': 'Country', name: 'France' },
          geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
        },
        offers: { '@type': 'Offer', price: '49', priceCurrency: 'EUR' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  // Stats : population-aware
  const baseStats = estimateStats({ code: city.dept }, category);
  const cityRatio = Math.max(0.3, Math.min(2, city.pop / 500000));
  const cityTotal = Math.round(parseInt(baseStats.total.replace(/\s/g, ''), 10) * cityRatio);
  const stats = { ...baseStats, total: cityTotal.toLocaleString('fr-FR') };

  // Cast city as "department" shape for compatibility with ProspectionSeoPage
  const cityAsDept = {
    code: city.dept,
    name: city.name,
    region: deptInfo.name,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProspectionSeoPage
        title={title}
        intro={intro}
        category={category}
        department={cityAsDept}
        stats={stats}
        faq={faq}
        relatedCategories={relatedCategories}
        relatedDepartments={relatedDepartments}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
