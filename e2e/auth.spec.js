// ─────────────────────────────────────────────────────────────────────
// Auth — validation client signup + presence form login
// ─────────────────────────────────────────────────────────────────────
// Note : on ne fait PAS de vrai signup pour eviter de polluer la BDD
// Supabase. On valide juste les comportements client (validation onBlur,
// affichage des champs).
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

test.describe('Signup', () => {
  test('Form rendu avec email + password', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    // Bouton submit principal (texte traduit FR)
    await expect(page.getByRole('button', { name: /Cr.er.*compte|S'inscrire|Continuer/i }).first()).toBeVisible();
  });

  test('Email invalide → message d\'erreur inline', async ({ page }) => {
    await page.goto('/signup');
    const emailInput = page.locator('input#email');
    await emailInput.fill('pas-un-email');
    // Validation onBlur
    await emailInput.blur();
    await expect(page.getByText(/Format email invalide/i)).toBeVisible();
  });

  test('Password trop court → message d\'erreur inline', async ({ page }) => {
    await page.goto('/signup');
    const pwInput = page.locator('input#password');
    await pwInput.fill('abc');
    await pwInput.blur();
    await expect(page.getByText(/Minimum 6 caract.res/i)).toBeVisible();
  });
});

test.describe('Login', () => {
  test('Form rendu avec email + password', async ({ page }) => {
    await page.goto('/login');
    // Le formulaire login utilise les memes IDs (email/password)
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('Lien vers signup present', async ({ page }) => {
    await page.goto('/login');
    // Le footer du form login contient un lien "Pas de compte" / "S'inscrire"
    await expect(page.getByRole('link', { name: /signup|s'inscrire|cr.er.*compte/i }).first()).toBeVisible();
  });
});
