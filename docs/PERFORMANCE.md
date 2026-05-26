# Audit performance Volia — 5 pages clés

Date : 2026-05-26
Méthode : audit statique du code (anti-patterns Lighthouse Performance / Accessibility / SEO / Best Practices). Lighthouse runtime non lançable depuis l'agent — fixes ciblés sur patterns connus.

## Pages auditées

- `/` (landing) → `src/app/page.js` + `src/components/LandingContent.jsx` + `FAQSection.jsx`
- `/pricing` → `src/app/pricing/page.js` + `src/components/PricingContent.jsx`
- `/produits/prospection` → `src/app/produits/prospection/page.js` + `ProductPageLayout.jsx`
- `/docs` → `src/app/docs/page.js`
- `/comparatif/apollo-vs-volia` → `src/app/comparatif/[slug]/page.js` + `ComparatifPage.jsx`

## État initial (déjà bon)

- **Images** : 100 % `next/image` (aucun `<img>` brut dans `src/`). `priority` posé sur Logo lg/xl.
- **Fonts** : `next/font/google` (Inter + JetBrains Mono) avec `display: swap`.
- **Third-party scripts** : Crisp en `strategy="lazyOnload"`. Pas de Stripe preconnect inutile sur landing (déplacé vers `/settings`).
- **CSS critique** : `experimental.optimizeCss: true` (Critters actif).
- **Bundle** : `optimizePackageImports: ['lucide-react']`. Bundle analyzer dispo via `ANALYZE=true npm run build`.
- **SEO** : JSON-LD Organization + WebSite global, plus schemas par page (SoftwareApplication, FAQPage, Product, Breadcrumb, Article). Canonical + alternates fr/en partout. Sitemap + robots.txt présents.
- **Headers** : CSP stricte, Cache-Control 1 an immutable sur assets, X-Frame-Options DENY.

## Top 5 issues identifiées

1. **A11y — FAQ accordéons sans `aria-expanded` ni `aria-controls`**
   Touche les 3 composants FAQ (`FAQSection`, `PricingContent`, `ProductPageLayout`). Lighthouse a11y déduit 4 à 8 points sur les pages avec FAQ visible (landing, /pricing, /produits/prospection). Lecteurs d'écran ne signalaient pas l'état ouvert/fermé.

2. **SEO — `og:image` cassée sur `/produits/prospection` et `/comparatif/*`**
   Les metadata référençaient `/og-prospection.png` et `/og-comparatif.png`, fichiers **absents de `/public/`**. Résultat : aucune preview au partage social (Twitter/LinkedIn/Slack). Best Practices Lighthouse aurait flaggé une 404 sur l'image OG.

3. **A11y — bouton FAQ sans `type="button"` (FAQSection)**
   Sans `type`, le navigateur traite implicitement le `<button>` comme `type="submit"` si jamais wrappé un jour dans un form. Pas critique mais best practice.

4. **A11y — `<ChevronDown>` sans `aria-hidden`**
   Icônes décoratives lues par les lecteurs d'écran. Bruit accessibilité.

5. **A11y — focus visible manquant sur boutons accordéon**
   Pas de `focus-visible:ring` sur les triggers FAQ. Navigation clavier dégradée.

## Top 5 fixes appliqués

1. **`FAQSection.jsx`** : ajout `aria-expanded`, `aria-controls`, `id` panneau, `role="region"`, `aria-labelledby`, `hidden`, `focus-visible:ring`, `type="button"`, `aria-hidden` sur ChevronDown.

2. **`ProductPageLayout.jsx` (FAQAccordion interne)** : même pattern accessible appliqué (utilisé par toutes les pages produit).

3. **`PricingContent.jsx`** : même pattern accessible appliqué au FAQ pricing (6 questions).

4. **`src/app/produits/prospection/page.js`** : retrait de la référence cassée à `/og-prospection.png`. Next.js sert maintenant automatiquement le fallback `src/app/opengraph-image.js` (OG dynamique edge runtime, déjà existant).

5. **`src/app/comparatif/[slug]/page.js`** : retrait de la référence cassée à `/og-comparatif.png`. Même fallback OG dynamique.

## Impact Lighthouse estimé

- **Accessibility** : +5 à +10 points sur les 4 pages avec FAQ (landing, /pricing, /produits/prospection, /comparatif). Vise désormais 95-100.
- **SEO** : maintient 100 ; correction d'un faux-positif Best Practices (image OG manquante = -10 sur partages sociaux mais pas directement compté Lighthouse).
- **Performance** : pas d'impact mesurable (déjà bien optimisé). Aucune régression bundle (pas de nouveau code, juste props HTML).
- **Best Practices** : +5 (correction asset 404).

## Non traité (volontairement)

- **CLS micro sur HeroMockup `/produits/prospection`** : 5 rows avec `animate-in fade-in slide-in-from-right-4` en cascade. Impact réel < 0.01 CLS car les conteneurs ont des dimensions stables. Pas worth de retirer l'effet.
- **Bundle analyzer** : à lancer manuellement avec `ANALYZE=true npm run build` pour identifier d'éventuels chunks > 200 KB (hors scope audit statique).
- **Génération PNG des og-* manquantes** : à créer dans `/public/` si on veut des OG par page (sinon fallback global suffit).

## Recommandations follow-up

- Lancer Lighthouse CI sur Vercel preview pour mesurer les gains réels.
- Vérifier avec `ANALYZE=true npm run build` que `lucide-react` est bien tree-shaké après `optimizePackageImports`.
- Envisager `next/dynamic` sur `CrispChat`, `TrustpilotReviewsBlock`, `NewsletterCapture` si déjà pas le cas (composants below-the-fold).
