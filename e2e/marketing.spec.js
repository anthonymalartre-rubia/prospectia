// ─────────────────────────────────────────────────────────────────────
// Marketing pages — flows critiques landing / pricing / produits / comparatif
// ─────────────────────────────────────────────────────────────────────
// Ces tests valident que les pages marketing publiques chargent et
// affichent leurs elements cles. Pas de DB requise → ils tournent en CI
// avec un build Next standard sans secret runtime.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

test.describe('Marketing pages', () => {
  test('Landing : hero h1 + CTA "Demarrer gratuitement" visibles', async ({ page }) => {
    await page.goto('/');
    // h1 hero "Trouvez. Contactez. Convertissez. Tout dans Volia."
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // CTA primaire du hero (Link vers /signup)
    await expect(page.getByRole('link', { name: /D.marrer gratuitement/i }).first()).toBeVisible();
  });

  test('Pricing : 4 plans (Starter, Solo, Pro, Business) listes', async ({ page }) => {
    await page.goto('/pricing');
    // Les 4 plans apparaissent au moins une fois (h3 dans les cards)
    // .first() car les noms peuvent reapparaitre dans le tableau comparatif
    await expect(page.getByRole('heading', { name: 'Starter', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Solo', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Business', level: 3 })).toBeVisible();
  });

  test('Pricing : toggle Mensuel/Annuel bascule les prix', async ({ page }) => {
    await page.goto('/pricing');
    // Le toggle Mensuel/Annuel — exact match pour eviter de matcher le
    // bouton FAQ "Comment fonctionne la facturation annuelle ?"
    const annuelBtn = page.getByRole('button', { name: 'Annuel -2 MOIS' });
    await expect(annuelBtn).toBeVisible();
    await annuelBtn.click();
    // En annuel le badge "/an" apparait sur les cards payantes.
    await expect(page.locator('text=/\\/an/').first()).toBeVisible();
    // Le prix 190 € (Solo annuel) apparait dans le sous-texte de la card Solo.
    await expect(page.locator('text=/190/').first()).toBeVisible();
  });

  test('Produits : les 3 modules chargent (prospection, campagnes, crm)', async ({ page }) => {
    for (const slug of ['prospection', 'campagnes', 'crm']) {
      const res = await page.goto(`/produits/${slug}`);
      expect(res?.status(), `/produits/${slug} doit renvoyer 200`).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('Comparatif : pages 1-vs-Volia chargent', async ({ page }) => {
    for (const slug of ['apollo-vs-volia', 'lemlist-vs-volia', 'hubspot-vs-volia']) {
      const res = await page.goto(`/comparatif/${slug}`);
      expect(res?.status(), `/comparatif/${slug} doit renvoyer 200`).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
