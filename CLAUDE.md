# Prospectia.ai — Agrégateur de prospection B2B en France

Plateforme SaaS de prospection B2B automatisée couvrant la France entière (101 départements). Combine recherche Google Places + cascade waterfall multi-sources (scraping intelligent du site web → recherche Google via Serper → fallback patterns) avec scoring de confiance.

Tarification : Starter gratuit (100 prospects) · Solo 19€/mois (1k) · Pro 49€/mois (5k) · Business 99€/mois (10k) — facturation mensuelle ou annuelle (-2 mois).

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React 18 + Tailwind CSS 3
- **Backend** : API Routes Next.js (serverless sur Vercel)
- **Base de données** : Supabase (projet `kqrarrrojdtxijkhejhg`)
- **Paiements** : Stripe (3 plans : Free, Pro 49€/mo, Enterprise 149€/mo)
- **IA** : Anthropic SDK (Claude) pour recherche en langage naturel
- **Emails transactionnels** : Resend API
- **Analytics** : Vercel Analytics + Speed Insights
- **Déploiement** : Vercel (auto-deploy sur push `main`)
- **Repo GitHub** : `Anthonyezdrive/scraping-dom-ezdrive`
- **URL production** : https://scraping-dom-ezdrive.vercel.app

## Architecture

```
src/
├── app/
│   ├── layout.js              # Layout racine (ThemeProvider, CookieConsent, Analytics)
│   ├── page.js                # Landing page marketing (typewriter, particules, comparatif)
│   ├── globals.css            # Tailwind + CSS variables (dark/light theme)
│   ├── middleware.js           # Rate limiting auth routes
│   ├── error.js               # Error boundary global
│   ├── not-found.js           # Page 404
│   ├── dashboard/
│   │   ├── page.js            # Dashboard principal (state management, logique métier)
│   │   ├── error.js           # Error boundary dashboard
│   │   └── loading.js         # Skeleton loading
│   ├── settings/
│   │   └── page.js            # Paramètres (profil, mot de passe, plan, usage, filtre RGPD)
│   ├── login/page.js          # Connexion (email + Google OAuth)
│   ├── signup/page.js         # Inscription (email + Google OAuth)
│   ├── forgot-password/page.js
│   ├── reset-password/page.js
│   ├── opt-out/page.js        # Page opt-out publique RGPD
│   ├── cgu/page.js            # Conditions générales d'utilisation
│   ├── confidentialite/page.js # Politique de confidentialité
│   ├── rgpd/page.js           # Page droits RGPD
│   └── api/
│       ├── places/route.js        # Proxy Google Places API (New)
│       ├── enrich/route.js        # Enrichissement email simple (scraping)
│       ├── enrich-waterfall/route.js # Cascade scraping + Serper + fallback patterns
│       ├── enrich-deep/route.js   # Enrichissement deep
│       ├── parse-search/route.js  # LLM parsing recherche naturelle (Anthropic)
│       ├── opt-out/route.js       # API opt-out RGPD (service role)
│       ├── report-error/route.js  # Error reporting
│       ├── stripe/
│       │   ├── checkout/route.js  # Création session Stripe
│       │   ├── portal/route.js    # Portail client Stripe
│       │   └── webhook/route.js   # Webhook Stripe (paiements, annulations)
│       └── auth/
│           └── callback/route.js  # OAuth callback (Google)
├── components/
│   ├── Sidebar.jsx            # Navigation latérale + historique recherches
│   ├── SearchPanel.jsx        # Panneau recherche (régions, départements, catégories, NL)
│   ├── ResultsPanel.jsx       # Panneau résultats (stats, tableau, filtres, exports)
│   ├── TopBar.jsx             # Barre de navigation sticky
│   ├── ThemeToggle.jsx        # Bouton bascule clair/sombre
│   ├── OnboardingOverlay.jsx  # Overlay d'accueil 5 étapes
│   ├── CookieConsent.jsx      # Bandeau cookies
│   ├── UpgradeBanner.jsx      # CTA upgrade contextuel (80%/100% usage)
│   ├── AuthCTA.jsx            # Composants CTA auth (NavAuth, HeroCTA, FooterCTA)
│   ├── LimitReachedModal.jsx  # Modale 429 (limite mensuelle atteinte → upgrade Pro)
│   ├── HeroSearchWidget.jsx   # Widget recherche interactif hero landing
│   ├── ReaderHeader.jsx       # Header partagé des pages lecture (blog/guide/glossaire)
│   ├── ReaderFooter.jsx       # Footer adaptatif des pages lecture
│   └── FAQSection.jsx         # FAQ accordion
└── lib/
    ├── constants.js           # DEPTS (101), REGIONS (14), B2B_GROUPS (12), COPRO_GROUPS (3)
    ├── plans.js               # Définition plans (Free, Pro, Enterprise) avec limites
    ├── theme.js               # ThemeProvider context (dark/light + localStorage)
    ├── supabase.js            # Client Supabase (lazy-init)
    ├── auth.js                # getAuthenticatedUser() helper
    ├── usage.js               # checkLimit(), incrementUsage(), alertes email seuils
    ├── email.js               # sendEmail() via Resend
    ├── emailTemplates.js      # Templates HTML (welcome, usage warning, payment, etc.)
    ├── rateLimit.js           # Rate limiting in-memory (5 tentatives/15min)
    ├── errorReporting.js      # reportError() utility
    └── url-validation.js      # validateUrl() anti-SSRF
```

## Base de données Supabase

### Table `prospects`
Colonnes : id (UUID), place_id (TEXT UNIQUE), nom, adresse, telephone, email, email_method ('scrape'|'guess'|'waterfall'|'apollo'|'deep'|'manual'), site_web, note (NUMERIC), nb_avis (INT), type ('b2b'|'copro'|'custom'), departement (TEXT — regex `^(0[1-9]|[1-8][0-9]|9[0-5]|2[AB]|97[1-6])$`), search_session_id (FK), created_at, updated_at.

### Table `search_sessions`
Colonnes : id (UUID), created_at, departments (TEXT[]), categories (JSONB), query_count, results_count, status ('running'|'completed'|'stopped').

### Table `user_profiles`
Colonnes : id (UUID, FK auth.users), plan ('free'|'pro'|'enterprise'), stripe_customer_id, stripe_subscription_id, filter_personal_emails (BOOL, default true), is_admin (BOOL), created_at, updated_at.

### Table `usage_tracking`
Colonnes : user_id, month (TEXT 'YYYY-MM'), searches, enrichments, exports.

### Table `opt_out_list`
Colonnes : id (UUID), email (TEXT UNIQUE), company, reason, requested_at.

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=        # URL projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Clé anon publique
SUPABASE_SERVICE_ROLE_KEY=       # Clé service role (opt-out API)
GOOGLE_PLACES_API_KEY=           # API Google Places (New)
ANTHROPIC_API_KEY=               # Claude API (parse-search)
STRIPE_SECRET_KEY=               # Stripe secret key
STRIPE_WEBHOOK_SECRET=           # Stripe webhook signing secret
STRIPE_PRO_PRICE_ID=             # ID prix Stripe plan Pro
STRIPE_ENTERPRISE_PRICE_ID=      # ID prix Stripe plan Enterprise
SERPER_API_KEY=                  # Serper.dev (recherche Google)
APOLLO_API_KEY=                  # Apollo.io (enrichissement)
ENRICHLY_API_KEY=                # Enrichly
ANYMAIL_API_KEY=                 # Anymail Finder
FINDYMAIL_API_KEY=               # Findymail
RESEND_API_KEY=                  # Resend (emails transactionnels)
```

## Fonctionnalités

- **101 départements** : métropole (96) + outre-mer (5), organisés en 14 régions
- **150+ catégories B2B** : 12 secteurs (B2B_GROUPS) + 3 groupes copropriété (COPRO_GROUPS)
- **Recherche en langage naturel** : via Anthropic Claude, convertit une description en termes Google Places
- **Enrichissement waterfall multi-sources** : Scraping intelligent du site → recherche Google via Serper → fallback patterns (contact@, info@…). S'arrête dès qu'un email est trouvé.
- **Scoring de confiance** : Vérifié (trouvé sur le site), Google (extrait d'une recherche), Probable (pattern deviné)
- **Filtrage RGPD emails personnels** : 28 domaines bloqués (@gmail, @hotmail, etc.), activable/désactivable par utilisateur avec avertissement juridique
- **Opt-out RGPD** : page publique /opt-out, suppression automatique + blocklist permanente
- **Export CSV** : format standard ou Zoho CRM
- **Stripe billing** : 3 plans avec limites, portail client, webhooks
- **Emails transactionnels** : welcome, usage warning (80%), limit reached (100%), payment, cancellation
- **Landing page** : typewriter effect, particules interactives, comparatif concurrents, FAQ

## Conventions de code

- Composants React en JSX avec `'use client'` directive
- Tailwind pour le styling — thème dark/light via CSS custom properties (semantic tokens: `surface-*`, `content-*`, `line-*`)
- Pas de TypeScript (JS uniquement)
- Fonctions async/await pour les appels API
- Client Supabase via `getSupabase()` (null-safe, lazy-init)
- Landing page toujours en mode sombre (pas de theme toggle)

## Commandes

```bash
npm install      # Installer les dépendances
npm run dev      # Serveur de développement (localhost:3000)
npm run build    # Build de production
npm run lint     # Linting ESLint
```

## Déploiement

Push sur `main` → GitHub → Vercel auto-deploy. Toutes les env vars sont configurées sur Vercel (Production + Development).
