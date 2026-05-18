import { getAllSeoUrls } from '@/lib/slugs';
import { getAllCompetitors } from '@/lib/competitors';
import { getAllPosts } from '@/lib/blog';
import { getAllGlossaryTerms } from '@/lib/glossary';
import { getAllGuides } from '@/lib/guides';

/**
 * Dynamic sitemap generated at build time + ISR.
 * Includes:
 * - Main pages (/, /login, /signup, /cgu, ...)
 * - Programmatic SEO pages (~15 000 URLs)
 */
export default async function sitemap() {
  const baseUrl = 'https://prospectia.cloud';
  const now = new Date();

  // Static pages
  const staticPages = [
    { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'weekly', lastModified: now },
    { url: `${baseUrl}/signup`, priority: 0.9, changeFrequency: 'monthly', lastModified: now },
    { url: `${baseUrl}/login`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    { url: `${baseUrl}/cgu`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${baseUrl}/confidentialite`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${baseUrl}/rgpd`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
  ];

  // Programmatic SEO pages
  const seoUrls = getAllSeoUrls(baseUrl).map((u) => ({
    url: u.loc,
    priority: u.priority,
    changeFrequency: u.changefreq,
    lastModified: now,
  }));

  // Competitor comparison pages (high-intent)
  const competitors = getAllCompetitors();
  const vsUrls = competitors.flatMap((c) => [
    { url: `${baseUrl}/vs/${c.slug}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    { url: `${baseUrl}/alternative/${c.slug}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
  ]);

  // Blog
  const blogIndex = [{ url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: 'weekly', lastModified: now }];
  const blogPosts = getAllPosts().map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly',
    lastModified: new Date(p.publishedAt),
  }));

  // Glossary
  const glossaryIndex = [{ url: `${baseUrl}/glossaire`, priority: 0.7, changeFrequency: 'weekly', lastModified: now }];
  const glossaryTerms = getAllGlossaryTerms().map((t) => ({
    url: `${baseUrl}/glossaire/${t.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly',
    lastModified: now,
  }));

  // Guides (long-form, high-authority)
  const guideIndex = [{ url: `${baseUrl}/guide`, priority: 0.8, changeFrequency: 'weekly', lastModified: now }];
  const guidePages = getAllGuides().map((g) => ({
    url: `${baseUrl}/guide/${g.slug}`,
    priority: 0.7,
    changeFrequency: 'monthly',
    lastModified: new Date(g.publishedAt),
  }));

  return [
    ...staticPages, ...seoUrls, ...vsUrls,
    ...blogIndex, ...blogPosts,
    ...glossaryIndex, ...glossaryTerms,
    ...guideIndex, ...guidePages,
  ];
}
