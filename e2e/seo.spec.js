// ─────────────────────────────────────────────────────────────────────
// SEO — verifie les meta tags critiques sur les pages marketing
// ─────────────────────────────────────────────────────────────────────
// On valide la presence de :
//   - <title> non vide
//   - <meta name="description"> non vide
//   - <link rel="canonical">
//   - <meta property="og:image"> (uniquement sur les pages flag ogImage:true)
//
// og:image n'est pas garantie sur toutes les pages : Pricing + Produits +
// Comparatif n'exportent pas encore d'opengraph-image.js. Pour ces pages
// on verifie uniquement title/description/canonical et on flag og:image
// comme un TODO produit (a corriger en ajoutant un opengraph-image.js
// dans chaque dossier de route, cf docs/TESTING.md).
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/', name: 'Landing', ogImage: true },
  { path: '/pricing', name: 'Pricing', ogImage: false },
  { path: '/produits/prospection', name: 'Produit Prospection', ogImage: false },
  { path: '/produits/campagnes', name: 'Produit Campagnes', ogImage: false },
  { path: '/produits/crm', name: 'Produit CRM', ogImage: false },
  { path: '/comparatif/apollo-vs-volia', name: 'Comparatif Apollo', ogImage: false },
  { path: '/comparatif/lemlist-vs-volia', name: 'Comparatif Lemlist', ogImage: false },
  { path: '/comparatif/hubspot-vs-volia', name: 'Comparatif HubSpot', ogImage: false },
];

test.describe('SEO meta tags', () => {
  for (const { path, name, ogImage } of PAGES) {
    test(`${name} (${path}) — title + description + canonical${ogImage ? ' + og:image' : ''}`, async ({ page }) => {
      await page.goto(path);

      // <title>
      const title = await page.title();
      expect(title, `title vide sur ${path}`).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);

      // <meta name="description">
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description, `description vide sur ${path}`).toBeTruthy();
      expect(description.length).toBeGreaterThan(20);

      // <link rel="canonical">
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `canonical absente sur ${path}`).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//);

      // <meta property="og:image"> (uniquement si on l'attend sur cette page)
      if (ogImage) {
        const og = await page.locator('meta[property="og:image"]').first().getAttribute('content');
        expect(og, `og:image absente sur ${path}`).toBeTruthy();
      }
    });
  }
});
