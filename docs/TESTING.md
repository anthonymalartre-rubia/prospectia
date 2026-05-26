# Tests E2E Volia (Playwright)

Suite de tests end-to-end qui valident les flows critiques de l'app Volia. Tournent sur **Chromium** via Playwright, en local et en CI (GitHub Actions).

## Pourquoi

- **Filet de securite refactor** : changer un composant ou refactorer le layout ne doit pas casser silencieusement le pricing toggle, le signup form, ou les URLs publiques.
- **Smoke prod** : verifier post-deploy que `https://volia.fr` repond bien sur les pages critiques.
- **API contracts** : verifier que les endpoints proteges renvoient bien `401` sans token.

## Structure

```
e2e/
├── marketing.spec.js   # Landing, pricing, /produits/*, /comparatif/*
├── auth.spec.js        # Signup/login form rendering + validation client
├── api-health.spec.js  # /api/status, robots, sitemap, 401 sur routes privees
├── seo.spec.js         # title, description, canonical, og:image sur 8 pages
├── crm.spec.js         # (skipped sans auth) creer/drag-drop/supprimer deal
├── campagnes.spec.js   # (skipped sans auth) liste, campagne, erreur sender
└── smoke-prod.spec.js  # (exclu par defaut) hit https://volia.fr
```

## Commandes locales

```bash
# Premiere fois (browsers Chromium)
npx playwright install --with-deps chromium

# Lancer toute la suite (demarre `next dev` automatiquement)
npm run test:e2e

# Mode UI (debug visuel, re-runs au fil des changements)
npm run test:e2e:ui

# Mode debug pas-a-pas (Playwright Inspector)
npm run test:e2e:debug

# Cibler un fichier
npx playwright test marketing.spec.js

# Cibler un test par nom
npx playwright test -g "Landing"

# Smoke tests sur prod (https://volia.fr)
npm run test:e2e:smoke
```

## Ajouter un test

1. Creer un nouveau fichier dans `e2e/` : `e2e/<feature>.spec.js`
2. Utiliser les selectors stables :
   - **Bon** : `getByRole('button', { name: /Cr.er/i })`, `getByLabel('Email')`, `locator('input#email')`
   - **Eviter** : selectors CSS fragiles (`.btn-primary > span:nth-child(2)`)
3. Pour les flows auth-required, suivre le pattern de `crm.spec.js` (skip si `E2E_AUTH` absent)

## Debugger un echec

```bash
# Re-run avec trace + video automatiquement
npx playwright test --retries=1

# Ouvrir le report HTML du dernier run
npx playwright show-report
```

En CI, le `playwright-report/` est uploade en artifact GitHub Actions (download depuis l'onglet "Actions" du PR concerne).

## CI (GitHub Actions)

Workflow : `.github/workflows/e2e.yml`

Trigger : push sur `main` + toutes les PRs.

Etapes :
1. Checkout + Node 20 + `npm ci`
2. Install Chromium
3. `npm run build` (avec env vars Supabase depuis secrets)
4. `npm run start` en arriere-plan + `wait-on http://localhost:3000`
5. `npx playwright test` (reporter `github` annotates failures dans le PR)
6. Upload `playwright-report/` si echec

### Secrets a configurer (Settings > Secrets and variables > Actions)

- `NEXT_PUBLIC_SUPABASE_URL` (publique, deja dans `.env.local`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publique)
- `STRIPE_SECRET_KEY` (optionnel — sinon valeur dummy au build)

## Tests auth-protected (CRM, Campagnes)

`crm.spec.js` et `campagnes.spec.js` sont **skipped par defaut** car ils ecrivent dans la BDD Supabase.

Pour les activer localement :

```bash
export E2E_AUTH=1
export E2E_TEST_USER_EMAIL=test@volia.fr
export E2E_TEST_USER_PASSWORD=...
npm run test:e2e -- crm.spec.js campagnes.spec.js
```

TODO post-MVP : creer un compte de test dedie + utiliser `storageState.json` pour ne se logger qu'une fois (cf. [Playwright auth docs](https://playwright.dev/docs/auth)).

## Performance

Cible : suite complete (hors auth-protected) en **< 3 min** en CI. Si ca depasse, ajouter `test.describe.parallel()` ou augmenter `workers` dans `playwright.config.js`.
