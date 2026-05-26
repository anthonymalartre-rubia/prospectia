// ─────────────────────────────────────────────────────────────────────
// Smoke tests prod — hits https://volia.fr post-deploy
// ─────────────────────────────────────────────────────────────────────
// Exclu de la suite par defaut (testIgnore dans playwright.config.js).
// Pour l'inclure :
//   E2E_INCLUDE_SMOKE=1 E2E_BASE_URL=https://volia.fr npm run test:e2e
//
// Ideal pour un job GitHub Actions post-deploy Vercel.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

const URLS = [
  '/',
  '/pricing',
  '/produits/prospection',
  '/produits/campagnes',
  '/produits/crm',
  '/comparatif/apollo-vs-volia',
  '/login',
  '/signup',
  '/cgu',
  '/confidentialite',
];

test.describe('Smoke prod', () => {
  for (const path of URLS) {
    test(`GET ${path} → 2xx`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status(), `${path} doit renvoyer 2xx`).toBeLessThan(400);
    });
  }
});
