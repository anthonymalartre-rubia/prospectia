// ─────────────────────────────────────────────────────────────────────
// /comparatif/[slug] — Pages comparatif détaillées 1-vs-Volia
// ─────────────────────────────────────────────────────────────────────
// 3 pages SEO long-form (~2000-3000 mots) :
//   - /comparatif/apollo-vs-volia
//   - /comparatif/lemlist-vs-volia
//   - /comparatif/hubspot-vs-volia
//
// Pattern : route dynamique avec generateStaticParams (3 entrées),
// data centralisée dans lib/comparatifs.js, rendu via composant
// partagé ComparatifPage.jsx (avec force light theme).
// ─────────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation';
import ComparatifPage from '@/components/ComparatifPage';
import { getComparatif, getAllComparatifSlugs } from '@/lib/comparatifs';
import { breadcrumbSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';

export async function generateStaticParams() {
  return getAllComparatifSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getComparatif(slug);
  if (!c) return {};

  const url = `${SITE_URL}/comparatif/${slug}`;
  const title = `${c.competitor.name} vs Volia 2026 : comparatif détaillé, prix, fonctionnalités`;
  const description = c.hero.subtitle.length > 160
    ? c.hero.subtitle.slice(0, 157).trim() + '...'
    : c.hero.subtitle;

  return {
    title,
    description,
    keywords: c.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${c.competitor.name} vs Volia — Comparatif 2026`,
      description,
      url,
      type: 'article',
      // Fallback automatique sur src/app/opengraph-image.js (asset
      // /og-comparatif.png absent de /public — référence cassée).
    },
    twitter: {
      card: 'summary_large_image',
      title: `${c.competitor.name} vs Volia 2026`,
      description,
    },
  };
}

export default async function ComparatifSlugPage({ params }) {
  const { slug } = await params;
  const c = getComparatif(slug);
  if (!c) notFound();

  const url = `${SITE_URL}/comparatif/${slug}`;

  // ─── JSON-LD Article schema (pour SEO long-form) ─────────────────
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${c.competitor.name} vs Volia : lequel choisir en 2026 ?`,
    description: c.hero.subtitle,
    url,
    author: { '@type': 'Organization', name: 'Volia', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Volia',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    datePublished: '2026-05-01',
    dateModified: '2026-05-26',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'fr-FR',
    about: [
      { '@type': 'Thing', name: c.competitor.name },
      { '@type': 'Organization', name: 'Volia' },
    ],
  };

  // ─── JSON-LD FAQPage schema (pour rich snippets FAQ) ─────────────
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  };

  // ─── JSON-LD Breadcrumb schema ────────────────────────────────────
  const breadcrumbs = breadcrumbSchema([
    { label: 'Accueil', href: '/' },
    { label: 'Comparatifs', href: '/comparatif/apollo-vs-volia' },
    { label: `${c.competitor.name} vs Volia` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ComparatifPage data={c} />
    </>
  );
}
