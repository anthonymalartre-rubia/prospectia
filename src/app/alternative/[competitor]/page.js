import { notFound, redirect } from 'next/navigation';
import { getCompetitor, getAllCompetitors } from '@/lib/competitors';
import CompetitorVsPage from '@/components/CompetitorVsPage';

export async function generateStaticParams() {
  return getAllCompetitors().map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }) {
  const { competitor: slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return {};

  return {
    title: `Meilleure alternative à ${c.name} en 2026 — Prospectia (49€/mois)`,
    description: `Cherche une alternative à ${c.name} ? Prospectia est l'alternative française : prospects illimités, scraping intelligent, ${Math.round((c.pricing - 49) / c.pricing * 100)}% moins cher. Conforme RGPD.`,
    alternates: { canonical: `https://prospectia.cloud/alternative/${slug}` },
    openGraph: {
      title: `Alternative à ${c.name} en 2026 — Prospectia`,
      description: `L'alternative française à ${c.name} : prospects illimités, 49€/mois, scraping + Google.`,
      url: `https://prospectia.cloud/alternative/${slug}`,
    },
  };
}

export default async function AlternativeCompetitor({ params }) {
  const { competitor: slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();

  // Reuse the comparison component (same content, different keyword target)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Alternative à ${c.name}`,
    description: `Prospectia est l'alternative française à ${c.name} pour la prospection B2B.`,
    url: `https://prospectia.cloud/alternative/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompetitorVsPage competitor={c} />
    </>
  );
}
