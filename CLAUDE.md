# Prospectia.ai — Prospection B2B automatisée en France

Plateforme de prospection B2B et copropriété couvrant la France entière (101 départements : métropole + outre-mer).

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React 18 + Tailwind CSS 3
- **Backend** : API Routes Next.js (serverless sur Vercel)
- **Base de données** : Supabase (projet EZData `nlnosnymkganuahagytx`)
- **Déploiement** : Vercel (auto-deploy sur push `main`)
- **Repo GitHub** : `Anthonyezdrive/scraping-dom-ezdrive`
- **URL production** : https://scraping-dom-ezdrive.vercel.app

## Architecture

```
src/
├── app/
│   ├── layout.js          # Layout racine (metadata, fonts, ThemeProvider)
│   ├── page.js            # Landing page marketing
│   ├── globals.css         # Tailwind + CSS variables (dark/light theme)
│   ├── dashboard/
│   │   └── page.js        # Dashboard principal (state management, logique métier)
│   └── api/
│       ├── places/route.js # Proxy Google Places API (New) — côté serveur
│       └── enrich/route.js # Enrichissement email — scraping côté serveur
├── components/
│   ├── TopBar.jsx          # Barre de navigation sticky + theme toggle
│   ├── Sidebar.jsx         # Navigation latérale + historique recherches
│   ├── SearchPanel.jsx     # Panneau recherche (régions, départements, catégories)
│   ├── ResultsPanel.jsx    # Panneau résultats (stats, tableau, filtres, exports)
│   ├── ThemeToggle.jsx     # Bouton bascule clair/sombre
│   └── OnboardingOverlay.jsx # Overlay d'accueil nouvel utilisateur
└── lib/
    ├── constants.js        # DEPTS (101), REGIONS (14), B2B_CATS, COPRO_CATS, API URLs
    ├── theme.js            # ThemeProvider context (dark/light + localStorage)
    └── supabase.js         # Client Supabase (lazy-init)
```

## Base de données Supabase

### Table `prospects`
Colonnes : id (UUID), place_id (TEXT UNIQUE), nom, adresse, telephone, email, email_method ('scrape'|'guess'), site_web, note (NUMERIC), nb_avis (INT), type ('b2b'|'copro'|'custom'), departement (TEXT — code INSEE, ex: '75', '33', '971'), search_session_id (FK), created_at, updated_at.

### Table `search_sessions`
Colonnes : id (UUID), created_at, departments (TEXT[]), categories (JSONB), query_count, results_count, status ('running'|'completed'|'stopped').

## Variables d'environnement

```
GOOGLE_PLACES_API_KEY=       # Clé API Google Cloud avec "Places API (New)" activée
NEXT_PUBLIC_SUPABASE_URL=    # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Clé anon publique Supabase
```

Configurées dans Vercel > Project Settings > Environment Variables.

## Fonctionnalités

- **101 départements** : métropole (96) + outre-mer (5), organisés en 14 régions avec sélection par région, recherche par nom/code.
- **Recherche Google Places** : interroge l'API Places (New) REST pour chaque combinaison département × catégorie. Déduplication par `place_id`. LocationBias par cercle (lat/lng/rayon) par département.
- **Catégories B2B** : 150+ catégories organisées en 12 secteurs (Hôtellerie & Restauration, Commerce & Distribution, Automobile & Transport, Santé & Bien-être, BTP & Construction, Services aux entreprises, Immobilier, Industrie & Artisanat, Finance & Assurance, Éducation & Culture, Technologie & Digital, Agriculture & Alimentation).
- **Catégories Copro** : 27 catégories organisées en 3 groupes (Syndics & Gestion, Expertise & Conseil, Entretien & Services).
- **Enrichissement email** : scraping côté serveur (homepage + pages contact/mentions légales), extraction regex + mailto + patterns obfusqués, scoring (domain match=100, contact@=80, pro=60, generic=20), fallback email probable (`contact@domain.com`).
- **Persistance Supabase** : tous les prospects sont sauvegardés et rechargés au lancement.
- **Export CSV** : format standard ou format Zoho CRM (Last Name, Company, Email, Phone, etc.).
- **Filtres** : recherche texte, département, type (B2B/Copro/Custom).
- **Thème clair/sombre** : bascule via CSS variables, persisté en localStorage, détection préférence OS.
- **Multi-sélection** : sélection par lots dans le tableau de leads avec actions groupées.
- **Visibilité colonnes** : choix des colonnes affichées, persisté en localStorage.

## Conventions de code

- Composants React en JSX avec `'use client'` directive
- Tailwind pour le styling — thème dark/light via CSS custom properties (semantic tokens: `surface-*`, `content-*`, `line-*`)
- Pas de TypeScript (JS uniquement)
- Fonctions async/await pour les appels API
- Client Supabase via `getSupabase()` (null-safe, lazy-init)

## Commandes

```bash
npm install      # Installer les dépendances
npm run dev      # Serveur de développement (localhost:3000)
npm run build    # Build de production
npm run lint     # Linting ESLint
```

## Déploiement

Push sur `main` → GitHub → Vercel auto-deploy. Pas de configuration supplémentaire nécessaire.
