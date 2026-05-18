import { notFound } from 'next/navigation';
import ProspectionSeoPage from '@/components/ProspectionSeoPage';
import {
  getAllCategories,
  getAllDepartments,
  getCategoryBySlug,
  getDepartmentBySlug,
} from '@/lib/slugs';
import { breadcrumbSchema, estimateStats } from '@/lib/seo-helpers';

// IMPORTANT: This generates 150 × 101 = ~15 000 static pages at build time.
// To keep build times reasonable, we use Next.js ISR (dynamicParams + revalidate)
// for less popular combinations.
export const dynamicParams = true; // allow on-demand generation
export const revalidate = 86400;   // revalidate every 24h

export async function generateStaticParams() {
  // Pre-build only the most popular category × dept combinations at build time.
  // Other combinations will be generated on first request (ISR).
  const popularCats = [
    'restaurant', 'hotel', 'boulangerie-patisserie', 'pharmacie', 'avocat',
    'garage-automobile', 'agence-immobiliere', 'salon-de-coiffure',
    'plombier', 'electricien', 'expert-comptable', 'concessionnaire-automobile',
  ];
  const popularDepts = [
    '75-paris', '13-bouches-du-rhone', '69-rhone', '31-haute-garonne',
    '06-alpes-maritimes', '33-gironde', '59-nord', '44-loire-atlantique',
    '67-bas-rhin', '38-isere', '34-herault', '92-hauts-de-seine',
  ];

  const params = [];
  for (const cat of popularCats) {
    for (const dept of popularDepts) {
      params.push({ category: cat, department: dept });
    }
  }
  return params; // ~144 pages prebuilt, others ISR
}

export async function generateMetadata({ params }) {
  const { category: catSlug, department: deptSlug } = await params;
  const category = getCategoryBySlug(catSlug);
  const dept = getDepartmentBySlug(deptSlug);
  if (!category || !dept) return {};

  const title = `Email des ${category.labelPlural} dans le ${dept.name} (${dept.code}) — Prospectia`;
  const description = `Trouvez l'email professionnel de tous les ${category.labelPlural} situés dans le ${dept.name} (${dept.code}). Scraping intelligent + recherche Google. À partir de 49€/mois.`;

  return {
    title,
    description,
    alternates: { canonical: `https://prospectia.cloud/prospection/${catSlug}/${deptSlug}` },
    openGraph: {
      title,
      description,
      url: `https://prospectia.cloud/prospection/${catSlug}/${deptSlug}`,
    },
  };
}

export default async function CategoryDepartmentPage({ params }) {
  const { category: catSlug, department: deptSlug } = await params;
  const category = getCategoryBySlug(catSlug);
  const dept = getDepartmentBySlug(deptSlug);
  if (!category || !dept) notFound();

  const allCats = getAllCategories();
  const allDepts = getAllDepartments();

  // Same category in other departments
  const popularDepts = [
    '75-paris', '13-bouches-du-rhone', '69-rhone', '31-haute-garonne',
    '06-alpes-maritimes', '33-gironde', '59-nord', '44-loire-atlantique',
    '67-bas-rhin', '38-isere', '34-herault', '92-hauts-de-seine',
  ];
  const relatedDepartments = allDepts
    .filter((d) => popularDepts.includes(d.slug) && d.slug !== deptSlug)
    .slice(0, 12)
    .map((d) => ({
      label: `${category.labelCapitalized} ${d.name}`,
      href: `/prospection/${catSlug}/${d.slug}`,
    }));

  // Other categories in same department
  const relatedCategories = allCats
    .filter((c) => c.group === category.group && c.slug !== catSlug)
    .slice(0, 12)
    .map((c) => ({
      label: `${c.labelCapitalized} ${dept.name}`,
      href: `/prospection/${c.slug}/${deptSlug}`,
    }));

  const title = `Email des ${category.labelPlural} dans le ${dept.name} (${dept.code})`;
  const intro = `Vous cherchez à contacter les ${category.labelPlural} situés dans le département ${dept.name} (${dept.code}) ? Prospectia identifie automatiquement tous les ${category.labelPlural} géolocalisés dans le ${dept.name} via Google Places, puis trouve leur email professionnel grâce à notre moteur de scraping et recherche Google. Exportez la liste complète en CSV en moins de 5 minutes, avec nom, adresse, téléphone, email vérifié, site web et note Google.`;

  const faq = [
    {
      question: `Combien de ${category.labelPlural} y a-t-il dans le ${dept.name} ?`,
      answer: `Le département ${dept.name} (${dept.code}) regroupe plusieurs centaines à plusieurs milliers de ${category.labelPlural} selon sa taille. Prospectia couvre toutes les entreprises géolocalisées par Google Places.`,
    },
    {
      question: `Comment trouver l'email d'un ${category.label} dans le ${dept.name} ?`,
      answer: `Sur Prospectia, sélectionnez la catégorie "${category.label}" et le département ${dept.code} (${dept.name}). Notre IA scrape ensuite le site web de chaque entreprise et complète avec une recherche Google ciblée. Vous récupérez en quelques secondes tous les emails professionnels disponibles.`,
    },
    {
      question: `Les emails des ${category.labelPlural} du ${dept.name} sont-ils vérifiés ?`,
      answer: `Oui. Chaque email reçoit un score de confiance basé sur sa source : "Vérifié" (trouvé sur le site officiel), "Google" (trouvé via recherche), ou "Pattern" (généré). Une vérification SMTP supplémentaire est disponible via MillionVerifier.`,
    },
    {
      question: `Puis-je exporter les ${category.labelPlural} du ${dept.name} en CSV ?`,
      answer: `Oui, exports illimités en CSV standard ou format Zoho CRM (Last Name, Company, Email, Phone). Inclus dans tous les plans Prospectia.`,
    },
    {
      question: `Le démarchage des ${category.labelPlural} du ${dept.name} est-il légal ?`,
      answer: `Oui, dans le cadre du RGPD (article 6 - intérêt légitime). Prospectia filtre automatiquement les emails personnels, respecte les opt-out, et ne collecte que des données professionnelles publiques. Vous restez responsable de l'usage des données collectées.`,
    },
    {
      question: `Combien coûte la prospection des ${category.labelPlural} dans le ${dept.name} ?`,
      answer: `49€/mois pour le plan Pro avec prospects illimités dans le ${dept.name} et tous les autres départements. Aucun crédit caché, aucun supplément par catégorie ou département.`,
    },
  ];

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Prospection B2B', href: '/prospection' },
    { label: category.labelCapitalized, href: `/prospection/${catSlug}` },
    { label: dept.name },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'WebPage',
        name: title,
        description: intro,
        url: `https://prospectia.cloud/prospection/${catSlug}/${deptSlug}`,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': 'https://prospectia.cloud/#website' },
      },
      {
        '@type': 'Service',
        name: `Recherche email ${category.labelPlural} ${dept.name}`,
        provider: {
          '@type': 'Organization',
          name: 'Prospectia',
          url: 'https://prospectia.cloud',
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: dept.name,
          containedInPlace: { '@type': 'Country', name: 'France' },
        },
        offers: {
          '@type': 'Offer',
          price: '49',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
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

  // Real-looking stats based on dept size + category density
  const stats = estimateStats(dept, category);

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
        department={dept}
        stats={stats}
        faq={faq}
        relatedCategories={relatedCategories}
        relatedDepartments={relatedDepartments}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
