// Slug helpers for programmatic SEO pages

import { DEPTS, B2B_GROUPS, B2B_CATS, REGIONS } from './constants';

/**
 * Convert a string to URL-safe slug (lowercase, no accents, dashes)
 * Ex: "Boulangerie pâtisserie" → "boulangerie-patisserie"
 */
export function toSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/['']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a flat list of categories with their slug + group + label
 * Used for static generation and lookups.
 */
export function getAllCategories() {
  const result = [];
  for (const [group, cats] of Object.entries(B2B_GROUPS)) {
    for (const cat of cats) {
      result.push({
        slug: toSlug(cat),
        label: cat,
        labelCapitalized: cat.charAt(0).toUpperCase() + cat.slice(1),
        labelPlural: pluralize(cat),
        group,
      });
    }
  }
  // Deduplicate by slug (some categories appear in multiple groups, like "imprimerie")
  const seen = new Set();
  return result.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });
}

/**
 * Simple French pluralizer for category names.
 */
function pluralize(str) {
  if (!str) return '';
  const lower = str.toLowerCase().trim();
  // Already plural or ends in s/x/z
  if (/[sxz]$/.test(lower)) return str;
  // Words ending in -al → -aux (cheval → chevaux)
  if (lower.endsWith('al')) return str.slice(0, -2) + 'aux';
  // Words ending in -au or -eu → +x
  if (/(au|eu)$/.test(lower)) return str + 'x';
  // Default: +s
  return str + 's';
}

/**
 * Get all department slugs (FR only for v1)
 * Format: "75-paris", "13-bouches-du-rhone"
 */
export function getAllDepartments() {
  return Object.entries(DEPTS).map(([code, info]) => ({
    code,
    slug: `${code}-${toSlug(info.name)}`,
    name: info.name,
    region: getRegionForDept(code),
  }));
}

/**
 * Get region (name + slug + key) for a department code, derived from
 * the REGIONS constant. Returns null if not found.
 */
function getRegionForDept(code) {
  for (const [key, info] of Object.entries(REGIONS)) {
    if (info.depts.includes(code)) {
      return {
        key,
        name: info.name,
        slug: toSlug(info.name),
      };
    }
  }
  return null;
}

/**
 * List all 14 French regions with slug + dept list.
 * Used for /prospection/[category]/region/[region] pages.
 */
export function getAllRegions() {
  return Object.entries(REGIONS).map(([key, info]) => ({
    key,
    name: info.name,
    slug: toSlug(info.name),
    depts: info.depts,
  }));
}

/**
 * Find a region by slug (e.g. "ile-de-france" → { name: 'Île-de-France', depts: [...] })
 */
export function getRegionBySlug(slug) {
  if (!slug) return null;
  return getAllRegions().find((r) => r.slug === slug) || null;
}

/**
 * Find a department by slug (e.g. "75-paris" → DEPTS["75"])
 */
export function getDepartmentBySlug(slug) {
  if (!slug) return null;
  const code = slug.split('-')[0];
  const info = DEPTS[code];
  if (!info) return null;
  return {
    code,
    slug,
    name: info.name,
    region: getRegionForDept(code),
    lat: info.lat,
    lng: info.lng,
  };
}

/**
 * Find a category by slug (e.g. "restaurant" → "restaurant")
 */
export function getCategoryBySlug(slug) {
  if (!slug) return null;
  const all = getAllCategories();
  return all.find((c) => c.slug === slug) || null;
}

/**
 * Build sitemap entries for all programmatic pages
 * Returns array of { loc, priority, changefreq }
 */
export function getAllSeoUrls(baseUrl = 'https://prospectia.cloud') {
  const urls = [];
  const cats = getAllCategories();
  const depts = getAllDepartments();

  // Index page
  urls.push({ loc: `${baseUrl}/prospection`, priority: 0.8, changefreq: 'weekly' });

  // Category pages (1 per cat)
  for (const cat of cats) {
    urls.push({
      loc: `${baseUrl}/prospection/${cat.slug}`,
      priority: 0.6,
      changefreq: 'monthly',
    });
  }

  // Department pages (1 per dept)
  for (const dept of depts) {
    urls.push({
      loc: `${baseUrl}/prospection/dept/${dept.slug}`,
      priority: 0.6,
      changefreq: 'monthly',
    });
  }

  // Combined category × department pages (the bulk)
  for (const cat of cats) {
    for (const dept of depts) {
      urls.push({
        loc: `${baseUrl}/prospection/${cat.slug}/${dept.slug}`,
        priority: 0.4,
        changefreq: 'monthly',
      });
    }
  }

  // Combined category × region pages (14 régions × ~150 cats ≈ 2 100 URLs)
  // Priority intermédiaire entre /[cat] (0.6) et /[cat]/[dept] (0.4) :
  // les pages région agrègent l'information et méritent un signal plus fort.
  const regions = getAllRegions();
  for (const cat of cats) {
    for (const r of regions) {
      urls.push({
        loc: `${baseUrl}/prospection/${cat.slug}/region/${r.slug}`,
        priority: 0.5,
        changefreq: 'monthly',
      });
    }
  }

  // ─── Pages utilitaires publiques ───────────────────────────────
  urls.push({ loc: `${baseUrl}/changelog`, priority: 0.5, changefreq: 'weekly' });
  urls.push({ loc: `${baseUrl}/status`, priority: 0.4, changefreq: 'daily' });
  urls.push({ loc: `${baseUrl}/parrainage`, priority: 0.5, changefreq: 'monthly' });
  urls.push({ loc: `${baseUrl}/newsletter`, priority: 0.6, changefreq: 'monthly' });

  // ─── Pages personas /pour/[persona] ────────────────────────────
  try {
    const { getAllPersonas } = require('./personas');
    for (const p of getAllPersonas()) {
      urls.push({ loc: `${baseUrl}/pour/${p.slug}`, priority: 0.7, changefreq: 'monthly' });
    }
  } catch (e) {
    // personas optionnel — si non présent, on skip
  }

  // ─── Suisse romande (6 cantons francophones) ────────────────────
  try {
    const { getAllCantonsCH } = require('./slugs-ch');
    const cantonsCH = getAllCantonsCH();

    urls.push({ loc: `${baseUrl}/prospection-ch`, priority: 0.7, changefreq: 'weekly' });
    for (const cat of cats) {
      urls.push({ loc: `${baseUrl}/prospection-ch/${cat.slug}`, priority: 0.55, changefreq: 'monthly' });
    }
    for (const c of cantonsCH) {
      urls.push({ loc: `${baseUrl}/prospection-ch/canton/${c.slug}`, priority: 0.55, changefreq: 'monthly' });
    }
    for (const cat of cats) {
      for (const c of cantonsCH) {
        urls.push({ loc: `${baseUrl}/prospection-ch/${cat.slug}/${c.slug}`, priority: 0.4, changefreq: 'monthly' });
      }
    }
  } catch (e) {
    // slugs-ch optionnel
  }

  // ─── Belgique francophone (Wallonie + Bruxelles, 6 provinces) ───
  // Lazy import pour éviter cycle de dépendance
  try {
    const { getAllProvincesBE } = require('./slugs-be');
    const provincesBE = getAllProvincesBE();

    // Hub /prospection-be
    urls.push({ loc: `${baseUrl}/prospection-be`, priority: 0.7, changefreq: 'weekly' });

    // Pages catégorie BE (~150)
    for (const cat of cats) {
      urls.push({ loc: `${baseUrl}/prospection-be/${cat.slug}`, priority: 0.55, changefreq: 'monthly' });
    }

    // Pages province seules (6)
    for (const p of provincesBE) {
      urls.push({ loc: `${baseUrl}/prospection-be/province/${p.slug}`, priority: 0.55, changefreq: 'monthly' });
    }

    // Pages cat × province (150 × 6 = 900)
    for (const cat of cats) {
      for (const p of provincesBE) {
        urls.push({ loc: `${baseUrl}/prospection-be/${cat.slug}/${p.slug}`, priority: 0.4, changefreq: 'monthly' });
      }
    }
  } catch (e) {
    // slugs-be optionnel — si non présent, on skip
  }

  // Combined category × city pages (top 100 French cities)
  // Lazy import to avoid circular dependency
  try {
    const { CITIES_FR } = require('./cities');
    for (const cat of cats) {
      for (const city of CITIES_FR) {
        urls.push({
          loc: `${baseUrl}/prospection/${cat.slug}/ville/${city.slug}`,
          priority: 0.5,
          changefreq: 'monthly',
        });
      }
    }
  } catch {}

  return urls;
}
