// ─────────────────────────────────────────────────────────────────────
// Playwright config — tests E2E Volia
// ─────────────────────────────────────────────────────────────────────
// Lance les tests Playwright avec :
//   - `npm run test:e2e` (CLI, headless)
//   - `npm run test:e2e:ui` (UI mode, debug visuel)
//   - `npm run test:e2e:debug` (Inspector pas-a-pas)
//
// Variables d'environnement :
//   - E2E_BASE_URL : URL cible (defaut http://localhost:3000)
//   - CI : true en GitHub Actions (active retries, forbidOnly, reporter github)
//
// En local : Playwright demarre `npm run dev` automatiquement et reutilise
// un serveur deja en ecoute. En CI : on demarre le serveur dans le workflow
// avant Playwright pour pouvoir injecter les env vars Supabase.
// ─────────────────────────────────────────────────────────────────────

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  // Ignorer les smoke tests prod par defaut (run manuel ou job dedie)
  testIgnore: process.env.E2E_INCLUDE_SMOKE ? [] : ['**/smoke-prod.spec.js'],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  // Timeout global par test (30s par defaut, suffisant pour Next dev)
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Locale FR — Volia est une app francaise
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // En local on demarre `next dev` ; en CI le workflow s'en charge (pour
  // injecter les env vars). reuseExistingServer evite de tuer un serveur
  // deja lance par le dev.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
