// ─────────────────────────────────────────────────────────────────────
// Campagnes — creer liste, creer campagne, error message sans sender
// ─────────────────────────────────────────────────────────────────────
// Comme crm.spec.js : requires auth. Skipped par defaut.
//
// Pour activer en local : E2E_AUTH=1 + E2E_TEST_USER_EMAIL/PASSWORD.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

const E2E_AUTH = !!process.env.E2E_AUTH && !!process.env.E2E_TEST_USER_EMAIL;

test.describe('Campagnes', () => {
  test.skip(!E2E_AUTH, 'Requires E2E_AUTH=1 + E2E_TEST_USER_EMAIL/PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(process.env.E2E_TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(process.env.E2E_TEST_USER_PASSWORD);
    await page.getByRole('button', { name: /Se connecter|Connexion|Continuer/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('Creer une liste de prospects', async ({ page }) => {
    await page.goto('/dashboard?view=campagnes');
    await page.getByRole('button', { name: /Nouvelle liste|Cr.er.*liste/i }).first().click();
    await page.getByLabel(/Nom|Titre/i).first().fill('Liste E2E test');
    await page.getByRole('button', { name: /Cr.er|Enregistrer/i }).first().click();
    await expect(page.getByText('Liste E2E test')).toBeVisible();
  });

  test('Creer une campagne sans sender → message d\'erreur explicite', async ({ page }) => {
    await page.goto('/dashboard?view=campagnes');
    await page.getByRole('button', { name: /Nouvelle campagne|Cr.er.*campagne/i }).first().click();
    await page.getByLabel(/Nom|Titre/i).first().fill('Campagne sans sender');
    // Tenter de valider sans configurer de sender
    await page.getByRole('button', { name: /Lancer|Cr.er|Enregistrer/i }).first().click();
    // L'app doit afficher un message d'erreur clair
    await expect(
      page.getByText(/sender.*requis|aucun.*sender|configurer.*sender|email.*exp.diteur/i)
    ).toBeVisible();
  });
});
