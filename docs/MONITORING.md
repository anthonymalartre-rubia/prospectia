# Monitoring & error tracking — Sentry

Volia utilise [Sentry](https://sentry.io) pour capturer les erreurs prod
côté client (navigateur), serveur (API routes / Server Components) et
edge (middleware). Objectif : voir un crash avant qu'un client ne nous
le signale, avec stack trace lisible (source maps) et contexte
(user, breadcrumbs, release).

---

## 1. Créer un compte Sentry (free tier)

1. Aller sur https://sentry.io/signup/ et créer un compte (free tier =
   5 000 erreurs / 10 000 transactions / mois — large pour démarrer).
2. Créer une **organisation** : `volia` (ou ton nom d'org).
3. Créer un **project** type **Next.js** : `volia-prod`.
4. Récupérer le **DSN** affiché à la fin du wizard
   (format : `https://abc123@o12345.ingest.sentry.io/67890`).

---

## 2. Configurer les env vars sur Vercel

Aller dans **Vercel → Project → Settings → Environment Variables** et
ajouter (Production + Preview) :

| Variable | Valeur | À quoi ça sert |
|----------|--------|----------------|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN du project Sentry | Init côté navigateur (browser) |
| `SENTRY_DSN` | Même DSN (peut être identique) | Init côté serveur (API routes / cron) |
| `SENTRY_AUTH_TOKEN` | Token créé sur sentry.io | Upload des source maps au build |
| `SENTRY_ORG` | `volia` | Slug org Sentry (utilisé par le SDK) |
| `SENTRY_PROJECT` | `volia-prod` | Slug project Sentry |

### Comment obtenir `SENTRY_AUTH_TOKEN`

1. Sentry → **Settings → Account → API → Auth Tokens**.
2. **Create New Token** avec les scopes :
   - `project:releases` (créer des releases)
   - `org:read` (lire l'org)
3. Copier le token et le coller dans Vercel.

> ⚠️ Sans `SENTRY_AUTH_TOKEN`, le build passe quand même (graceful
> degradation) mais les source maps ne sont pas uploadées → stack
> traces minifiées illisibles en prod.

### Source maps : c'est quoi, pourquoi

Le build Next.js minifie tout le JS. Sans source maps, une stack trace
en prod ressemble à `at t (a.js:1:2345)` — inutilisable. Avec source
maps uploadées vers Sentry, on retrouve `at handleCheckout
(src/app/api/stripe/checkout/route.js:42)`.

La conf `hideSourceMaps: true` dans `next.config.js` évite d'exposer
les source maps publiquement (elles ne sont accessibles qu'à Sentry).

---

## 3. Architecture côté code

```
instrumentation.js            → init Node.js + Edge (pattern Next 14+ /
                                 remplace sentry.server.config.js, deprecated)
instrumentation-client.js     → init browser (remplace sentry.client.config.js)
next.config.js                → withSentryConfig() wrap + upload source maps
src/app/global-error.js       → ErrorBoundary racine (catch crash du layout)
src/app/error.js              → ErrorBoundary global enfants
src/app/dashboard/error.js    → ErrorBoundary dashboard
src/lib/errorReporting.js     → reportError() → forward à Sentry.captureException
```

### Points d'instrumentation déjà câblés

- **`src/app/error.js`** (global ErrorBoundary) → `reportError()` →
  Sentry.
- **`src/app/dashboard/error.js`** (dashboard ErrorBoundary) → idem.
- **`/api/cron/process-email-campaigns`** : wrappé par try/catch global
  qui forward à Sentry.
- **`/api/cron/process-sequences`** : idem.
- **`/api/cron/process-warmup-peer`** : idem.
- **`/api/stripe/webhook`** : le catch existant reporte maintenant à
  Sentry avec `eventType` + `eventId` en contexte.
- **`/api/webhooks/resend/inbound`** : wrappé pour Sentry, garde le
  contrat 200-always pour ne pas trigger les retries Resend infinis.

---

## 4. Tunnel `/monitoring` — bypass adblockers

Plusieurs adblockers (uBlock, AdBlock Plus) bloquent les requêtes
vers `*.ingest.sentry.io`. La conf `tunnelRoute: '/monitoring'` dans
`next.config.js` route les events client via une API interne Volia
(`/monitoring`) qui forward au DSN côté serveur. Résultat : les events
arrivent même chez les utilisateurs avec adblocker.

Pas d'action manuelle requise — le SDK gère tout.

---

## 5. Investiguer un crash (workflow)

1. **Notification** : Sentry envoie un email/Slack quand une nouvelle
   erreur apparaît (configurable dans **Alerts**).
2. **Ouvrir l'event** dans le dashboard Sentry → tu vois :
   - **Stack trace** (source-mapped → fichier + ligne réels).
   - **Breadcrumbs** : la séquence d'actions avant le crash (clicks,
     navigations, fetch, console logs).
   - **Tags** : environment, release, browser, OS.
   - **User context** : non-attaché par défaut (à activer si besoin via
     `Sentry.setUser(...)` après login).
   - **Extra** : le contexte passé via `reportError(err, { ... })`
     (ex : `cron`, `webhook`, `eventType`).
3. **Release** : Sentry groupe les events par
   `VERCEL_GIT_COMMIT_SHA`. Un crash sur la version `abc1234` = un
   commit précis identifiable.
4. **Resolve** : marque l'event résolu → si elle revient sur une
   release ultérieure, Sentry le re-notifie automatiquement.

### Astuce : ignorer une erreur récurrente bénigne

Ajouter le pattern dans `sentry.client.config.js` → `ignoreErrors[]`.
Exemple déjà inclus : `ResizeObserver loop limit exceeded` (warning
browser bénin).

---

## 6. Sampling & quota free tier

Conf actuelle (cf. `sentry.*.config.js`) :

- `tracesSampleRate: 0.1` → 10 % des transactions instrumentées
  (performance monitoring). Suffisant pour avoir une vue prod sans
  saturer le quota.
- `replaysSessionSampleRate: 0.0` → pas de session replay par défaut
  (lourd en quota).
- `replaysOnErrorSampleRate: 1.0` → on capture le replay uniquement
  pour les sessions qui ont crashé (utile pour reproduire visuellement).

Si on dépasse le free tier (5k events/mo), Sentry ne crashe pas — il
arrête juste de stocker les events au-delà. Plan Team : 26 $/mo pour
50k events.

---

## 7. Désactiver Sentry localement

Aucune action requise : `sentry.*.config.js` skip `Sentry.init()` si
`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` est absent. Le code applicatif
appelle quand même `Sentry.captureException(...)` mais le SDK no-op
silencieusement.

Le `beforeSend()` dans la conf client/server skip aussi tous les
events en `NODE_ENV === 'development'` même si un DSN traîne dans
`.env.local`.

---

## 8. Checklist avant prod

- [ ] Compte Sentry créé, project `volia-prod`.
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` dans Vercel.
- [ ] `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` dans Vercel
      (Production scope).
- [ ] Push sur `main` → vérifier dans **Sentry → Settings → Releases**
      qu'une release apparaît (= source maps uploadées).
- [ ] Trigger une erreur de test (ex : visiter `/sentry-test` avec un
      `throw` temporaire) → vérifier qu'elle remonte dans **Issues**
      avec stack trace lisible.
- [ ] Configurer une **Alert Rule** : email si nouvelle erreur en prod.
