// ─────────────────────────────────────────────────────────────────────
// API health — verifie les statuts HTTP des routes critiques
// ─────────────────────────────────────────────────────────────────────
// - Endpoints publics → 200
// - Endpoints proteges (qui exigent un user authentifie) → 401
//
// On utilise `request` (pas `page`) car pas besoin de browser.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

test.describe('API publiques', () => {
  test('GET /api/status → 200 + JSON valide', async ({ request }) => {
    const res = await request.get('/api/status');
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Le status renvoie un summary avec checks (Supabase, Stripe, etc.)
    expect(body).toBeTruthy();
  });

  test('GET /robots.txt → 200', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toContain('user-agent');
  });

  test('GET /sitemap.xml → 200 (XML)', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBeLessThan(400);
  });
});

test.describe('API protegees (401 sans auth)', () => {
  test('POST /api/places sans token → 401', async ({ request }) => {
    const res = await request.post('/api/places', {
      data: { query: 'test', department: '75' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/crm/deals sans token → 401', async ({ request }) => {
    const res = await request.get('/api/crm/deals');
    // 401 ou 403 selon implementation
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/email-senders sans token → 401', async ({ request }) => {
    const res = await request.get('/api/email-senders');
    expect([401, 403]).toContain(res.status());
  });
});
