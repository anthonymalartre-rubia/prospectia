import { getAllSeoUrls } from '@/lib/slugs';
import { getAllCompetitors, getAllPairs } from '@/lib/competitors';
import { getAllPosts } from '@/lib/blog';
import { getAllGlossaryTerms } from '@/lib/glossary';
import { getAllGuides } from '@/lib/guides';
import { getAllResources } from '@/lib/resources';

/**
 * Sitemap multi-fichiers via Next.js generateSitemaps().
 *
 * Avant : sitemap monolithique de 5.49 MB / ~28 500 URLs. Sous la limite
 * Google 50 MB / 50k URLs mais Bing limite à 10 MB, et la moindre nouvelle
 * catégorie/ville aurait fait sauter le seuil.
 *
 * Maintenant : Next.js génère automatiquement /sitemap.xml (index) qui
 * pointe vers /sitemap/0.xml, /sitemap/1.xml, etc. Chaque sous-sitemap
 * tient sous 10 MB. Indexation plus rapide + immunité à la croissance.
 *
 * Index :
 *   0  →  pages statiques + comparaison concurrents + blog + glossaire + guides (~150 URLs)
 *   1+ →  pages programmatiques SEO (chunks de 5000 URLs)
 */

const baseUrl = 'https://volia.fr';
const CHUNK_SIZE = 5000;

// Caches mémoire pour éviter de recalculer entre sub-sitemaps lors du build
let _seoUrlsCache = null;
function getSeoUrls() {
  if (!_seoUrlsCache) _seoUrlsCache = getAllSeoUrls(baseUrl);
  return _seoUrlsCache;
}

export async function generateSitemaps() {
  const seoUrls = getSeoUrls();
  const seoChunks = Math.ceil(seoUrls.length / CHUNK_SIZE);
  // id 0 = pages "manuelles" (statiques + vs + blog + glossaire + guides)
  // ids 1..N = chunks SEO programmatiques
  const ids = [{ id: 0 }];
  for (let i = 1; i <= seoChunks; i++) ids.push({ id: i });
  return ids;
}

export default async function sitemap({ id }) {
  const now = new Date();

  if (id === 0) {
    // ─── Pages "manuelles" (peu nombreuses, mises à jour fréquentes) ────
    const staticPages = [
      { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'weekly', lastModified: now },
      { url: `${baseUrl}/signup`, priority: 0.9, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/login`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/produits/prospection`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/produits/campagnes`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/produits/crm`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/comparatif-outils-prospection-b2b-france`, priority: 0.9, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/etude/prospection-b2b-france-2026`, priority: 1.0, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/api`, priority: 0.6, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/cgu`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
      { url: `${baseUrl}/confidentialite`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
      { url: `${baseUrl}/rgpd`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    ];

    const vsUrls = getAllCompetitors().flatMap((c) => [
      { url: `${baseUrl}/vs/${c.slug}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/alternative/${c.slug}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
      { url: `${baseUrl}/outils/${c.slug}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    ]);

    // Hub /outils (index des 14 outils) + hub des 91 comparatifs 1-vs-1
    const outilsHub = [
      { url: `${baseUrl}/outils`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
      { url: `${baseUrl}/outils/comparatif`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
    ];

    // 91 pages de comparatif 1-vs-1 entre les 14 outils (priority 0.6, plus
    // élevée que les pages SEO programmatiques car contenu unique fort).
    const pairsUrls = getAllPairs().map((p) => ({
      url: `${baseUrl}/outils/comparatif/${p.slug}`,
      priority: 0.6,
      changeFrequency: 'monthly',
      lastModified: now,
    }));

    const blog = [
      { url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: 'weekly', lastModified: now },
      ...getAllPosts().map((p) => ({
        url: `${baseUrl}/blog/${p.slug}`,
        priority: 0.6,
        changeFrequency: 'monthly',
        lastModified: new Date(p.publishedAt),
      })),
    ];

    const glossary = [
      { url: `${baseUrl}/glossaire`, priority: 0.7, changeFrequency: 'weekly', lastModified: now },
      ...getAllGlossaryTerms().map((t) => ({
        url: `${baseUrl}/glossaire/${t.slug}`,
        priority: 0.5,
        changeFrequency: 'monthly',
        lastModified: now,
      })),
    ];

    const guides = [
      { url: `${baseUrl}/guide`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
      ...getAllGuides().map((g) => ({
        url: `${baseUrl}/guide/${g.slug}`,
        priority: 0.7,
        changeFrequency: 'monthly',
        lastModified: new Date(g.publishedAt),
      })),
    ];

    // Ressources : hub + 8 landing pages + 8 pages de contenu/calculateur
    const ressources = [
      { url: `${baseUrl}/ressources`, priority: 0.9, changeFrequency: 'weekly', lastModified: now },
      ...getAllResources().flatMap((r) => {
        const detailSuffix = r.deliveryMode === 'direct' ? 'utiliser' : 'telecharger';
        return [
          // Landing page commerciale
          { url: `${baseUrl}/ressources/${r.slug}`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
          // Page de contenu/calculateur (réelle valeur pour SEO)
          { url: `${baseUrl}/ressources/${r.slug}/${detailSuffix}`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
        ];
      }),
    ];

    return [...staticPages, ...outilsHub, ...vsUrls, ...pairsUrls, ...ressources, ...blog, ...glossary, ...guides];
  }

  // ─── Chunks SEO programmatiques ────────────────────────────────────
  const seoUrls = getSeoUrls();
  const start = (id - 1) * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  return seoUrls.slice(start, end).map((u) => ({
    url: u.loc,
    priority: u.priority,
    changeFrequency: u.changefreq,
    lastModified: now,
  }));
}
