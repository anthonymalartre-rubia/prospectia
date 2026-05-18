import { notFound } from 'next/navigation';
import ProspectionSeoPage from '@/components/ProspectionSeoPage';
import { getAllCategories, getAllDepartments, getDepartmentBySlug } from '@/lib/slugs';
import { breadcrumbSchema, estimateStats } from '@/lib/seo-helpers';

export async function generateStaticParams() {
  return getAllDepartments().map((dept) => ({ slug: dept.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dept = getDepartmentBySlug(slug);
  if (!dept) return {};

  const title = `Prospection B2B dans le ${dept.name} (${dept.code}) — Prospectia`;
  const description = `Trouvez les emails B2B de toutes les entreprises du département ${dept.name} (${dept.code}). 150+ secteurs couverts : restaurants, commerces, artisans, services. À partir de 49€/mois.`;

  return {
    title,
    description,
    alternates: { canonical: `https://prospectia.cloud/prospection/dept/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://prospectia.cloud/prospection/dept/${slug}`,
    },
  };
}

export default async function DepartmentPage({ params }) {
  const { slug } = await params;
  const dept = getDepartmentBySlug(slug);
  if (!dept) notFound();

  const allCategories = getAllCategories();

  // Top 12 most popular categories for internal linking
  const popularCats = ['restaurant', 'hotel', 'boulangerie-patisserie', 'avocat', 'garage-automobile', 'pharmacie', 'agence-immobiliere', 'salon-de-coiffure', 'plombier', 'electricien', 'expert-comptable', 'cabinet-de-conseil'];
  const relatedCategories = allCategories
    .filter((c) => popularCats.includes(c.slug))
    .map((c) => ({
      label: `${c.labelCapitalized} ${dept.name}`,
      href: `/prospection/${c.slug}/${slug}`,
    }));

  // Other departments in same region
  const allDepts = getAllDepartments();
  const relatedDepartments = allDepts
    .filter((d) => d.region === dept.region && d.slug !== slug)
    .slice(0, 12)
    .map((d) => ({
      label: `${d.code} · ${d.name}`,
      href: `/prospection/dept/${d.slug}`,
    }));

  const title = `Prospection B2B dans le ${dept.name} (${dept.code})`;
  const intro = `Le département ${dept.name} (${dept.code}) en région ${dept.region} regroupe des milliers d'entreprises B2B : restaurants, commerces, artisans du BTP, professions libérales, services aux entreprises. Prospectia vous permet de trouver leur email professionnel en quelques secondes grâce à notre moteur de scraping et recherche Google. Exportez ensuite vos prospects en CSV.`;

  const faq = [
    {
      question: `Combien d'entreprises sont référencées dans le ${dept.name} ?`,
      answer: `Prospectia couvre toutes les entreprises géolocalisées par Google Places dans le département ${dept.name} (${dept.code}). En moyenne, nous référençons plusieurs dizaines de milliers d'entreprises par département.`,
    },
    {
      question: `Quels secteurs sont disponibles dans le ${dept.name} ?`,
      answer: `Tous les secteurs B2B : hôtellerie, restauration, commerce, automobile, santé, BTP, services aux entreprises, immobilier, industrie, finance, éducation, technologie, agriculture. Plus de 150 catégories disponibles.`,
    },
    {
      question: `Comment fonctionne l'enrichissement email dans le ${dept.name} ?`,
      answer: `Pour chaque entreprise du ${dept.name}, notre IA scrape son site web et cherche son email sur Google. Si l'entreprise n'a pas de site web, nous découvrons son domaine via Google avant d'extraire l'email. Taux de couverture moyen : 70-85%.`,
    },
    {
      question: `La prospection dans le ${dept.name} est-elle conforme au RGPD ?`,
      answer: `Oui. Tous les emails collectés sont des emails professionnels publics (article 6 RGPD - intérêt légitime). Nous filtrons automatiquement les emails personnels et respectons toutes les demandes d'opt-out.`,
    },
    {
      question: `Quel est le prix pour prospecter dans le ${dept.name} ?`,
      answer: `49€/mois pour le plan Pro avec prospects illimités (toutes catégories, tous départements). Aucun crédit caché, aucune limite par département.`,
    },
  ];

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Prospection B2B', href: '/prospection' },
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
        url: `https://prospectia.cloud/prospection/dept/${slug}`,
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'Place',
        name: dept.name,
        address: {
          '@type': 'PostalAddress',
          addressRegion: dept.region,
          addressCountry: 'FR',
          postalCode: dept.code.length === 2 ? `${dept.code}000` : dept.code,
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

  const stats = estimateStats(dept, null);
  // Inflate for dept view (all categories combined)
  const inflatedStats = {
    ...stats,
    total: (parseInt(stats.total.replace(/\s/g, ''), 10) * 30).toLocaleString('fr-FR'),
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
        category={null}
        department={dept}
        stats={inflatedStats}
        faq={faq}
        relatedCategories={relatedCategories}
        relatedDepartments={relatedDepartments}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
