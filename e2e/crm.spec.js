// ─────────────────────────────────────────────────────────────────────
// CRM — creer/drag-drop/supprimer un deal
// ─────────────────────────────────────────────────────────────────────
// Ces tests necessitent un user authentifie (cookie Supabase) avec un
// abonnement qui debloque le module CRM. Pour eviter de polluer la BDD
// avec des tests automatises, ils sont skipped par defaut.
//
// Pour activer en local :
//   1. Creer un compte de test dans Supabase
//   2. Exporter E2E_TEST_USER_EMAIL + E2E_TEST_USER_PASSWORD
//   3. Lancer : E2E_AUTH=1 npm run test:e2e -- crm.spec.js
//
// TODO post-MVP : implementer un helper auth.setup.js qui se logge une
// fois et exporte storageState.json reutilise par tous les tests.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

const E2E_AUTH = !!process.env.E2E_AUTH && !!process.env.E2E_TEST_USER_EMAIL;

test.describe('CRM — deal management', () => {
  test.skip(!E2E_AUTH, 'Requires E2E_AUTH=1 + E2E_TEST_USER_EMAIL/PASSWORD');

  test.beforeEach(async ({ page }) => {
    // Login via formulaire (a remplacer par storageState pour vitesse)
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(process.env.E2E_TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(process.env.E2E_TEST_USER_PASSWORD);
    await page.getByRole('button', { name: /Se connecter|Connexion|Continuer/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('Creer un deal manuellement', async ({ page }) => {
    await page.goto('/dashboard?view=crm');
    // Bouton "Nouveau deal" / "Ajouter un deal"
    await page.getByRole('button', { name: /Nouveau deal|Ajouter.*deal|Cr.er.*deal/i }).first().click();
    // Remplir le form
    await page.getByLabel(/Nom|Titre/i).first().fill('Deal E2E test');
    await page.getByLabel(/Montant|Valeur/i).first().fill('1000');
    await page.getByRole('button', { name: /Cr.er|Enregistrer|Valider/i }).first().click();
    // Verifier que le deal apparait dans le pipeline
    await expect(page.getByText('Deal E2E test')).toBeVisible();
  });

  test('Drag & drop un deal entre stages', async ({ page }) => {
    await page.goto('/dashboard?view=crm');
    const card = page.locator('[data-deal-id]').filter({ hasText: 'Deal E2E test' }).first();
    const targetColumn = page.locator('[data-stage="qualified"]').first();
    await card.dragTo(targetColumn);
    // Verifier que le deal est dans la nouvelle colonne
    await expect(targetColumn.getByText('Deal E2E test')).toBeVisible();
  });

  test('Supprimer un deal', async ({ page }) => {
    await page.goto('/dashboard?view=crm');
    const card = page.locator('[data-deal-id]').filter({ hasText: 'Deal E2E test' }).first();
    await card.click();
    await page.getByRole('button', { name: /Supprimer|Delete/i }).first().click();
    await page.getByRole('button', { name: /Confirmer|Oui|Supprimer/i }).last().click();
    await expect(page.getByText('Deal E2E test')).not.toBeVisible();
  });
});
