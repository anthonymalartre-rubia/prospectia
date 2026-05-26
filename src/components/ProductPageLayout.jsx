'use client';

// ─────────────────────────────────────────────────────────────────────
// ProductPageLayout — layout réutilisable pour les pages produit
// ─────────────────────────────────────────────────────────────────────
//
// Utilisé par :
//   /produits/prospection (LIVE   — accent violet/indigo)
//   /produits/campagnes   (BETA   — accent blue/cyan)
//   /produits/crm         (BIENTÔT — accent emerald/teal)
//
// Pattern HubSpot/Linear : chaque module a sa couleur accent + son
// statut. La nav + le footer sont rendus dans la page (pas dans
// layout.js) pour rester cohérent avec le reste du site et garder un
// breadcrumb spécifique "Volia · Produits · {Module}".
//
// Le layout se contente d'orchestrer 9 sections : top nav, hero,
// features bento, how it works, cross-sell vers les autres modules,
// pricing reminder, FAQ, CTA final, footer.
//
// Toutes les sections sont wrappées en <MotionInView> pour les
// animations scroll-triggered.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, ChevronDown,
  // Icons utilisables dans les features/howItWorks via leur nom string
  Search, Mail, MessageSquare, Layers, Brain, BarChart3, Database, Globe, Download,
  Shield, Sparkles, Send, Settings, Play, Zap, FileText, Tag, Users, KanbanSquare,
  Smartphone, TrendingUp, Rocket, Flame,
  Repeat, MousePointerClick, Workflow, BookOpen, Inbox,
} from 'lucide-react';
import { NavAuth } from '@/components/AuthCTA';
import { LogoIcon } from '@/components/ui';
import MotionInView from '@/components/MotionInView';
import BookDemoButton from '@/components/BookDemoButton';
import { useForceLightTheme } from '@/lib/use-force-light-theme';

// Map nom string → composant Lucide. Permet de passer les icônes depuis
// les pages server components (qui ne peuvent pas passer de fonctions
// au-travers de la frontière serveur→client).
const ICONS = {
  Search, Mail, MessageSquare, Layers, Brain, BarChart3, Database, Globe, Download,
  Shield, Sparkles, Send, Settings, Play, Zap, FileText, Tag, Users,
  Trello: KanbanSquare,        // alias rétrocompat — Trello n'existe plus dans lucide-react
  KanbanSquare,
  Smartphone, TrendingUp, Rocket, Flame,
  Repeat, MousePointerClick, Workflow, BookOpen, Inbox,
};
function resolveIcon(name) {
  return ICONS[name] || Search;
}

// ─────────────────────────────────────────────────────────────────────
// Palettes par module — chaque clé centralise toutes les variantes
// Tailwind nécessaires (gradient, border, text, bg, ring) parce que
// Tailwind ne purge pas les classes composées dynamiquement.
// ─────────────────────────────────────────────────────────────────────
export const MODULE_THEMES = {
  prospection: {
    accent: 'violet',
    label: 'Prospection',
    iconName: 'Search',
    statusBadge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    heroGradient: 'from-violet-200/40 via-indigo-100/30 to-pink-100/20',
    heroBlob1: 'bg-violet-300/20',
    heroBlob2: 'bg-indigo-200/30',
    pill: 'bg-violet-100 border-violet-200 text-violet-700',
    titleGradient: 'from-violet-600 via-indigo-600 to-violet-700',
    ctaGradient: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
    ctaShadow: 'shadow-violet-500/30 hover:shadow-violet-500/40',
    iconBg: 'from-violet-500 to-indigo-600',
    sectionTint: 'from-violet-50/40 via-indigo-50/20 to-white',
    cardBorder: 'border-violet-200',
    cardBg: 'from-violet-50 via-white to-violet-50/50',
    checkIcon: 'text-violet-600',
    linkText: 'text-violet-700',
    connector: 'from-violet-300 via-indigo-300 to-cyan-300',
    secondaryHover: 'hover:border-violet-400 hover:bg-violet-50',
  },
  campagnes: {
    accent: 'blue',
    label: 'Campagnes',
    iconName: 'Mail',
    statusBadge: 'bg-blue-100 text-blue-700 border-blue-300',
    heroGradient: 'from-blue-200/40 via-cyan-100/30 to-sky-100/20',
    heroBlob1: 'bg-blue-300/20',
    heroBlob2: 'bg-cyan-200/30',
    pill: 'bg-blue-100 border-blue-200 text-blue-700',
    titleGradient: 'from-blue-600 via-cyan-600 to-blue-700',
    ctaGradient: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    ctaShadow: 'shadow-blue-500/30 hover:shadow-blue-500/40',
    iconBg: 'from-blue-500 to-cyan-600',
    sectionTint: 'from-blue-50/40 via-cyan-50/20 to-white',
    cardBorder: 'border-blue-200',
    cardBg: 'from-blue-50 via-white to-cyan-50/50',
    checkIcon: 'text-blue-600',
    linkText: 'text-blue-700',
    connector: 'from-blue-300 via-cyan-300 to-sky-300',
    secondaryHover: 'hover:border-blue-400 hover:bg-blue-50',
  },
  crm: {
    accent: 'emerald',
    label: 'CRM',
    iconName: 'Layers',
    statusBadge: 'bg-amber-100 text-amber-700 border-amber-300',
    heroGradient: 'from-emerald-200/40 via-teal-100/30 to-green-100/20',
    heroBlob1: 'bg-emerald-300/20',
    heroBlob2: 'bg-teal-200/30',
    pill: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    titleGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    ctaGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    ctaShadow: 'shadow-emerald-500/30 hover:shadow-emerald-500/40',
    iconBg: 'from-emerald-500 to-teal-600',
    sectionTint: 'from-emerald-50/40 via-teal-50/20 to-white',
    cardBorder: 'border-emerald-200',
    cardBg: 'from-emerald-50 via-white to-teal-50/50',
    checkIcon: 'text-emerald-600',
    linkText: 'text-emerald-700',
    connector: 'from-emerald-300 via-teal-300 to-green-300',
    secondaryHover: 'hover:border-emerald-400 hover:bg-emerald-50',
  },
};

const STATUS_BADGES = {
  LIVE: { label: 'LIVE', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  BETA: { label: 'BETA', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  COMING_SOON: { label: 'BIENTÔT', className: 'bg-amber-100 text-amber-700 border-amber-300' },
};

// Labels par défaut (FR) — surchargés par le prop `labels` pour EN.
const DEFAULT_LABELS_FR = {
  products: 'Produits',
  features: 'Fonctionnalités',
  pricing: 'Tarifs',
  blog: 'Blog',
  faq: 'FAQ',
  breadcrumbProducts: 'Produits',
  featuresPill: 'Fonctionnalités',
  featuresTitlePrefix: 'Tout pour',
  featuresTitleDefault: 'réussir avec Volia',
  howItWorksPill: 'Comment ça marche',
  howItWorksTitle: "3 étapes, c'est tout",
  suitePill: 'Suite Volia',
  suiteTitle: 'Connecté aux autres modules Volia',
  suiteSubtitleDefault: "Vos données circulent entre Prospection, Campagnes et CRM. Pas de copier-coller, pas d'export/import.",
  suiteSource: 'Source',
  suiteDestination: 'Destination',
  suiteCtaDefault: 'Découvrir',
  pricingPill: 'Tarification',
  pricingCtaDefault: 'Voir les tarifs complets',
  faqPill: 'FAQ',
  faqTitle: 'Questions fréquentes',
  bookDemoHero: 'Ou réserver 15 min avec le founder',
  bookDemoFinal: 'Voir si Volia est fait pour vous',
  breadcrumbAria: "Fil d'Ariane",
};

// ─────────────────────────────────────────────────────────────────────
// Sous-composant : nav top (clone simplifié de LandingContent)
// ─────────────────────────────────────────────────────────────────────
function ProductTopNav({ labels = DEFAULT_LABELS_FR, locale = 'fr' }) {
  const isEn = locale === 'en';
  const home = isEn ? '/en' : '/';
  const productsLink = isEn ? '/en/products/prospection' : '/produits/prospection';
  return (
    <header>
      <nav className="fixed top-0 w-full z-50 bg-surface-base/70 backdrop-blur-2xl border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href={home} className="flex items-center gap-1.5">
            <LogoIcon size="sm" />
            <span className="text-lg font-bold tracking-tight ml-1">Volia</span>
            <span className="text-violet-400 text-xs font-semibold">.fr</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href={productsLink} className="text-sm text-content-tertiary hover:text-content-primary transition">{labels.products}</Link>
            <Link href={`${home}#features`} className="text-sm text-content-tertiary hover:text-content-primary transition">{labels.features}</Link>
            <Link href={isEn ? '/en/pricing' : '/#pricing'} className="text-sm text-content-tertiary hover:text-content-primary transition">{labels.pricing}</Link>
            <Link href="/blog" className="text-sm text-content-tertiary hover:text-content-primary transition">{labels.blog}</Link>
            <Link href={`${home}#faq`} className="text-sm text-content-tertiary hover:text-content-primary transition">{labels.faq}</Link>
          </div>
          <div className="flex items-center gap-3">
            <NavAuth />
          </div>
        </div>
      </nav>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sous-composant : breadcrumb sous la nav
// ─────────────────────────────────────────────────────────────────────
function Breadcrumb({ moduleLabel, labels = DEFAULT_LABELS_FR, locale = 'fr' }) {
  const isEn = locale === 'en';
  return (
    <div className="pt-20 pb-2 px-4 sm:px-6">
      <nav className="max-w-6xl mx-auto text-xs text-content-tertiary" aria-label={labels.breadcrumbAria}>
        <ol className="flex items-center gap-2">
          <li><Link href={isEn ? '/en' : '/'} className="hover:text-content-primary transition">Volia</Link></li>
          <li aria-hidden="true">·</li>
          <li><Link href={isEn ? '/en/products/prospection' : '/produits/prospection'} className="hover:text-content-primary transition">{labels.breadcrumbProducts}</Link></li>
          <li aria-hidden="true">·</li>
          <li className="font-semibold text-content-primary">{moduleLabel}</li>
        </ol>
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sous-composant : FAQ accordéon
// ─────────────────────────────────────────────────────────────────────
function FAQAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `product-faq-panel-${idx}`;
        const buttonId = `product-faq-button-${idx}`;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-line bg-surface-card overflow-hidden transition-colors hover:border-line-hover"
          >
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-inset"
            >
              <span className="text-sm sm:text-base font-medium text-content-primary">{item.q}</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`text-content-tertiary flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-6 pb-5 pt-0">
                <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sous-composant : footer (clone simplifié de LandingContent)
// ─────────────────────────────────────────────────────────────────────
function ProductFooter({ locale = 'fr' }) {
  const isEn = locale === 'en';
  if (isEn) {
    return (
      <footer className="border-t border-line py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 pb-10 border-b border-line">
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Products</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/en/products/prospection" className="text-content-tertiary hover:text-violet-400 transition">Prospecting</Link></li>
                <li><Link href="/en/products/campaigns" className="text-content-tertiary hover:text-blue-500 transition">Campaigns</Link></li>
                <li><Link href="/en/products/crm" className="text-content-tertiary hover:text-emerald-500 transition">CRM</Link></li>
                <li><Link href="/en/pricing" className="text-content-tertiary hover:text-violet-400 transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="text-content-tertiary hover:text-violet-400 transition">Blog</Link></li>
                <li><Link href="/en" className="text-content-tertiary hover:text-violet-400 transition">Home</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Language</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-content-tertiary hover:text-violet-400 transition">FR Francais</Link></li>
                <li><Link href="/en" className="text-content-tertiary hover:text-violet-400 transition font-semibold">EN English</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <LogoIcon size="xs" />
              <span className="text-sm font-bold tracking-tight ml-1">Volia</span>
              <span className="text-violet-400 text-[10px] font-semibold">.fr</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-content-tertiary">
              <Link href="/cgu" className="hover:text-content-secondary transition">Terms</Link>
              <Link href="/cgv" className="hover:text-content-secondary transition">CGV</Link>
              <Link href="/dpa" className="hover:text-content-secondary transition">DPA</Link>
              <Link href="/confidentialite" className="hover:text-content-secondary transition">Privacy</Link>
              <Link href="/rgpd" className="hover:text-content-secondary transition">GDPR</Link>
              <Link href="/opt-out" className="hover:text-content-secondary transition">Opt-out</Link>
            </div>
            <p className="text-[11px] text-content-muted">&copy; 2026 Volia.fr - Built in France</p>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="border-t border-line py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-line">
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Produits</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/produits/prospection" className="text-content-tertiary hover:text-violet-400 transition">Prospection</Link></li>
              <li><Link href="/produits/campagnes" className="text-content-tertiary hover:text-blue-500 transition">Campagnes</Link></li>
              <li><Link href="/produits/crm" className="text-content-tertiary hover:text-emerald-500 transition">CRM</Link></li>
              <li><Link href="/#pricing" className="text-content-tertiary hover:text-violet-400 transition">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Comparatifs</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vs/apollo" className="text-content-tertiary hover:text-violet-400 transition">vs Apollo.io</Link></li>
              <li><Link href="/vs/hunter" className="text-content-tertiary hover:text-violet-400 transition">vs Hunter.io</Link></li>
              <li><Link href="/vs/lusha" className="text-content-tertiary hover:text-violet-400 transition">vs Lusha</Link></li>
              <li><Link href="/vs/snov" className="text-content-tertiary hover:text-violet-400 transition">vs Snov.io</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Prospection</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/prospection" className="text-content-tertiary hover:text-violet-400 transition">Tous secteurs</Link></li>
              <li><Link href="/prospection/restaurant" className="text-content-tertiary hover:text-violet-400 transition">Restaurants</Link></li>
              <li><Link href="/prospection/hotel" className="text-content-tertiary hover:text-violet-400 transition">Hôtels</Link></li>
              <li><Link href="/prospection/avocat" className="text-content-tertiary hover:text-violet-400 transition">Avocats</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Ressources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="text-content-tertiary hover:text-violet-400 transition">Blog</Link></li>
              <li><Link href="/guide" className="text-content-tertiary hover:text-violet-400 transition">Guides sectoriels</Link></li>
              <li><Link href="/glossaire" className="text-content-tertiary hover:text-violet-400 transition">Glossaire B2B</Link></li>
              <li><Link href="/blog/rgpd-prospection-b2b" className="text-content-tertiary hover:text-violet-400 transition">Guide RGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <LogoIcon size="xs" />
            <span className="text-sm font-bold tracking-tight ml-1">Volia</span>
            <span className="text-violet-400 text-[10px] font-semibold">.fr</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-content-tertiary">
            <Link href="/cgu" className="hover:text-content-secondary transition">CGU</Link>
            <Link href="/cgv" className="hover:text-content-secondary transition">CGV</Link>
            <Link href="/dpa" className="hover:text-content-secondary transition">DPA</Link>
            <Link href="/confidentialite" className="hover:text-content-secondary transition">Confidentialité</Link>
            <Link href="/rgpd" className="hover:text-content-secondary transition">RGPD</Link>
            <Link href="/opt-out" className="hover:text-content-secondary transition">Opt-out</Link>
          </div>
          <p className="text-[11px] text-content-muted">&copy; 2026 Volia.fr</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Component principal exporté
// ─────────────────────────────────────────────────────────────────────
//
// Props :
//   module       : 'prospection' | 'campagnes' | 'crm'
//   status       : 'LIVE' | 'BETA' | 'COMING_SOON'
//   hero         : { eyebrow?, h1, h1Highlight?, subtitle, ctaPrimary, ctaSecondary, mockup }
//                   - h1Highlight optionnel = portion du h1 stylée en gradient (insérée)
//                   - mockup = ReactNode rendu dans la colonne droite
//   features     : [{ icon, title, desc, featured? }, ...] — 5-6 items
//   howItWorks   : [{ icon, title, desc }, ...] — exactement 3 items
//   crossSell    : { otherModules: [{ module, title, desc, direction }] } — direction = 'in' (←) ou 'out' (→)
//   pricing      : { label, cta, ctaHref }
//   pricingBanner: optional ReactNode (utilisé pour CRM "Beta privée Q4 2026")
//   faq          : [{ q, a }, ...] — 4-5 items
//   finalCta     : { title, subtitle, primary: {label, href}, secondary: {label, href}, customForm? }
//                   - customForm = ReactNode (utilisé pour CRM waitlist)
// ─────────────────────────────────────────────────────────────────────

export default function ProductPageLayout({
  module,
  status,
  hero,
  features,
  howItWorks,
  crossSell,
  pricing,
  pricingBanner,
  faq,
  finalCta,
  // Slots optionnels pour insérer des sections custom dans le flow
  afterHero,       // ReactNode rendu juste après le hero (ex: stats banner)
  afterFeatures,   // ReactNode rendu après les features bento (ex: use cases)
  beforeFaq,       // ReactNode rendu juste avant la FAQ (ex: before/after compare)
  // i18n : labels override + locale ('fr' | 'en'). EN bascule la nav, le
  // breadcrumb, le footer et tous les titres de sections en anglais.
  locale = 'fr',
  labels: labelsOverride,
  moduleLabelOverride, // override le nom du module dans le breadcrumb (ex: "Prospecting" en EN)
}) {
  const theme = MODULE_THEMES[module];
  const statusBadge = STATUS_BADGES[status];
  const labels = { ...DEFAULT_LABELS_FR, ...(labelsOverride || {}) };

  // Force light mode sur les pages produit (marketing = toujours light)
  useForceLightTheme();

  return (
    <div className="min-h-screen bg-surface-base text-content-primary overflow-hidden">
      <ProductTopNav labels={labels} locale={locale} />
      <Breadcrumb moduleLabel={moduleLabelOverride || theme.label} labels={labels} locale={locale} />

      <main>
        {/* ───────────────────────────────────────────────────────────
            HERO — 2-col : copy left, mockup right
         */}
        <section className="relative pt-6 sm:pt-10 pb-20 px-4 sm:px-6 overflow-hidden">
          {/* Background mesh */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-br ${theme.heroGradient} rounded-full blur-3xl pointer-events-none -z-0`} />
          <div className={`absolute top-40 right-[5%] w-96 h-96 ${theme.heroBlob1} rounded-full blur-3xl pointer-events-none -z-0 animate-pulse`} style={{ animationDuration: '6s' }} />
          <div className={`absolute top-60 left-[5%] w-80 h-80 ${theme.heroBlob2} rounded-full blur-3xl pointer-events-none -z-0 animate-pulse`} style={{ animationDuration: '8s' }} />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Colonne gauche : copy */}
              <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Eyebrow : nom module + status badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-xs font-semibold uppercase tracking-wider`}>
                    Volia {theme.label}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {hero.eyebrow && (
                  <p className="text-sm font-medium text-content-secondary mb-4">{hero.eyebrow}</p>
                )}

                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-bold tracking-tight leading-[1.02] mb-6">
                  {hero.h1Before && <span className="text-content-primary">{hero.h1Before} </span>}
                  {hero.h1Highlight && (
                    <span className={`bg-gradient-to-br ${theme.titleGradient} bg-clip-text text-transparent`}>
                      {hero.h1Highlight}
                    </span>
                  )}
                  {hero.h1After && <span className="text-content-primary"> {hero.h1After}</span>}
                </h1>

                <p className="text-lg sm:text-xl text-content-secondary mb-8 leading-relaxed max-w-xl">
                  {hero.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  {hero.ctaPrimary && (
                    <Link
                      href={hero.ctaPrimary.href}
                      className={`group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r ${theme.ctaGradient} text-white font-semibold shadow-lg ${theme.ctaShadow} hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                    >
                      {hero.ctaPrimary.label}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                  {hero.ctaSecondary && (
                    hero.ctaSecondary.custom ? (
                      hero.ctaSecondary.custom
                    ) : (
                      <Link
                        href={hero.ctaSecondary.href}
                        className={`inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border-2 border-line-hover ${theme.secondaryHover} text-content-primary font-semibold transition-all`}
                      >
                        {hero.ctaSecondary.label}
                      </Link>
                    )
                  )}
                </div>

                {/* CTA tertiaire — booking démo perso (ghost discret) */}
                <div className="mb-8">
                  <BookDemoButton
                    label={labels.bookDemoHero}
                    variant="ghost"
                    size="sm"
                    source={`produit_${module}_hero`}
                  />
                </div>

                {/* Trust line */}
                {hero.trust && (
                  <div className="flex items-center gap-4 text-xs text-content-tertiary flex-wrap">
                    {hero.trust.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span aria-hidden="true">·</span>}
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Colonne droite : mockup (ReactNode passé en prop) */}
              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
                {hero.mockup}
              </div>
            </div>
          </div>
        </section>

        {/* Slot : juste après le hero (ex: live stats banner) */}
        {afterHero}

        {/* ───────────────────────────────────────────────────────────
            FEATURES — bento layout
         */}
        <section id="features" className="py-24 px-4 sm:px-6 border-t border-line">
          <div className="max-w-6xl mx-auto">
            <MotionInView>
              <div className="text-center mb-16">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-[11px] font-bold uppercase tracking-wider mb-4`}>
                  {labels.featuresPill}
                </span>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                  {labels.featuresTitlePrefix} {features.headline || `${labels.featuresTitleDefault} ${theme.label}`}
                </h2>
                <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                  {features.subline || ''}
                </p>
              </div>
            </MotionInView>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(features.items || features).map((f, i) => {
                const Icon = resolveIcon(f.icon);
                const isWide = f.featured || f.wide;
                return (
                  <MotionInView
                    key={f.title}
                    delay={i * 100}
                    className={isWide ? 'lg:col-span-2' : ''}
                  >
                    <div className={`group h-full p-7 rounded-2xl border-2 ${theme.cardBorder} bg-gradient-to-br ${theme.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-content-primary">{f.title}</h3>
                      <p className="text-sm text-content-secondary leading-relaxed">{f.desc}</p>
                    </div>
                  </MotionInView>
                );
              })}
            </div>
          </div>
        </section>

        {/* Slot : après les features bento (ex: use cases personas) */}
        {afterFeatures}

        {/* ───────────────────────────────────────────────────────────
            HOW IT WORKS — 3 steps avec connector
         */}
        <section className={`py-28 px-4 sm:px-6 border-t border-line bg-gradient-to-b ${theme.sectionTint}`}>
          <div className="max-w-6xl mx-auto">
            <MotionInView>
              <div className="text-center mb-20">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-[11px] font-bold uppercase tracking-wider mb-4`}>
                  {labels.howItWorksPill}
                </span>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                  {labels.howItWorksTitle}
                </h2>
              </div>
            </MotionInView>

            <div className="relative">
              <div className={`hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r ${theme.connector} -z-0`} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
                {howItWorks.map((item, i) => {
                  const Icon = resolveIcon(item.icon);
                  const step = String(i + 1).padStart(2, '0');
                  return (
                    <MotionInView key={item.title} delay={i * 150}>
                      <div className="text-center group">
                        <div className={`relative w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-xl ring-8 ring-zinc-100/50 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                          <Icon size={32} className="text-white" />
                          <div className={`absolute -top-2 -right-2 w-9 h-9 rounded-full bg-white border-2 ${theme.cardBorder} flex items-center justify-center shadow-md`}>
                            <span className={`text-sm font-bold font-mono ${theme.linkText}`}>{step}</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-content-primary">{item.title}</h3>
                        <p className="text-base text-content-secondary leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                      </div>
                    </MotionInView>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────
            CROSS-SELL — intégration avec les autres modules
         */}
        {crossSell?.otherModules?.length > 0 && (
          <section className="py-24 px-4 sm:px-6 border-t border-line">
            <div className="max-w-6xl mx-auto">
              <MotionInView>
                <div className="text-center mb-12">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-[11px] font-bold uppercase tracking-wider mb-4`}>
                    {labels.suitePill}
                  </span>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                    {labels.suiteTitle}
                  </h2>
                  <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                    {crossSell.subtitle || labels.suiteSubtitleDefault}
                  </p>
                </div>
              </MotionInView>

              <div className={`grid grid-cols-1 ${crossSell.otherModules.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-5 max-w-4xl mx-auto`}>
                {crossSell.otherModules.map((m, i) => {
                  const otherTheme = MODULE_THEMES[m.module];
                  const OtherIcon = resolveIcon(otherTheme.iconName);
                  const arrow = m.direction === 'in' ? '←' : '→';
                  return (
                    <MotionInView key={m.module} delay={i * 120}>
                      <Link
                        href={locale === 'en' ? `/en/products/${m.module === 'campagnes' ? 'campaigns' : m.module}` : `/produits/${m.module}`}
                        className={`group block h-full p-7 rounded-2xl border-2 ${otherTheme.cardBorder} bg-gradient-to-br ${otherTheme.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${otherTheme.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <OtherIcon size={22} className="text-white" />
                          </div>
                          <span className={`text-xs font-bold ${otherTheme.linkText}`}>{arrow} {m.direction === 'in' ? labels.suiteSource : labels.suiteDestination}</span>
                        </div>
                        <div className="text-xs text-content-tertiary uppercase tracking-wider mb-1">Volia</div>
                        <h3 className="text-xl font-bold text-content-primary mb-2">{otherTheme.label}</h3>
                        <p className="text-sm text-content-secondary leading-relaxed mb-5">{m.desc}</p>
                        <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${otherTheme.linkText} group-hover:gap-2 transition-all`}>
                          {m.cta || labels.suiteCtaDefault}
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </MotionInView>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ───────────────────────────────────────────────────────────
            PRICING REMINDER
         */}
        <section className={`py-20 px-4 sm:px-6 border-t border-line bg-gradient-to-b ${theme.sectionTint}`}>
          <div className="max-w-4xl mx-auto">
            <MotionInView>
              {pricingBanner ? (
                <div className="mb-8">{pricingBanner}</div>
              ) : null}
              <div className={`rounded-2xl border-2 ${theme.cardBorder} bg-gradient-to-br ${theme.cardBg} p-8 sm:p-10 text-center shadow-lg`}>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-[11px] font-bold uppercase tracking-wider mb-4`}>
                  {labels.pricingPill}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-content-primary tracking-tight">
                  {pricing.label}
                </h2>
                {pricing.subtext && (
                  <p className="text-content-secondary mb-6 max-w-xl mx-auto">{pricing.subtext}</p>
                )}
                <Link
                  href={pricing.ctaHref || (locale === 'en' ? '/en/pricing' : '/#pricing')}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${theme.ctaGradient} text-white font-semibold shadow-lg ${theme.ctaShadow} hover:-translate-y-0.5 transition-all`}
                >
                  {pricing.cta || labels.pricingCtaDefault}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </MotionInView>
          </div>
        </section>

        {/* Slot : juste avant la FAQ (ex: before/after comparison) */}
        {beforeFaq}

        {/* ───────────────────────────────────────────────────────────
            FAQ
         */}
        {faq?.length > 0 && (
          <section className="py-24 px-4 sm:px-6 border-t border-line">
            <div className="max-w-3xl mx-auto">
              <MotionInView>
                <div className="text-center mb-12">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.pill} text-[11px] font-bold uppercase tracking-wider mb-4`}>
                    {labels.faqPill}
                  </span>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                    {labels.faqTitle}
                  </h2>
                </div>
              </MotionInView>
              <FAQAccordion items={faq} />
            </div>
          </section>
        )}

        {/* ───────────────────────────────────────────────────────────
            FINAL CTA — gradient mesh
         */}
        <section className="relative py-32 px-4 sm:px-6 border-t border-line overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.heroGradient} pointer-events-none`} />
          <div className={`absolute top-0 left-1/4 w-96 h-96 ${theme.heroBlob1} rounded-full blur-3xl pointer-events-none animate-pulse`} style={{ animationDuration: '6s' }} />
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${theme.heroBlob2} rounded-full blur-3xl pointer-events-none animate-pulse`} style={{ animationDuration: '8s' }} />

          <MotionInView className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight text-content-primary">
              {finalCta.title}
            </h2>
            <p className="text-content-secondary text-lg sm:text-xl mb-10 max-w-xl mx-auto">
              {finalCta.subtitle}
            </p>

            {finalCta.customForm ? (
              <div className="max-w-md mx-auto mb-8">{finalCta.customForm}</div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                {finalCta.primary && (
                  <Link
                    href={finalCta.primary.href}
                    className={`group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r ${theme.ctaGradient} text-white font-semibold shadow-xl ${theme.ctaShadow} hover:shadow-2xl hover:-translate-y-0.5 transition-all text-base`}
                  >
                    {finalCta.primary.label}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {finalCta.secondary && (
                  <Link
                    href={finalCta.secondary.href}
                    className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white ${theme.secondaryHover} border-2 border-line-hover text-content-primary font-semibold transition-all text-base`}
                  >
                    {finalCta.secondary.label}
                  </Link>
                )}
                <BookDemoButton
                  label={labels.bookDemoFinal}
                  variant="secondary"
                  size="lg"
                  source={`produit_${module}_final_cta`}
                />
              </div>
            )}

            {finalCta.trust && (
              <p className="text-xs text-content-tertiary">{finalCta.trust}</p>
            )}
          </MotionInView>
        </section>
      </main>

      <ProductFooter locale={locale} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helper checklist : exporte un bullet de feature stylé selon le thème.
// Utile pour les mockups dans les heros.
// ─────────────────────────────────────────────────────────────────────
export function ThemedCheck({ children, module }) {
  const theme = MODULE_THEMES[module];
  return (
    <div className="flex items-start gap-2">
      <Check size={14} className={`flex-shrink-0 mt-0.5 ${theme.checkIcon}`} />
      <span className="text-sm text-content-secondary leading-relaxed">{children}</span>
    </div>
  );
}
