'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Zap, Search, Mail, MapPin, Shield, Layers, Download, Crown, Star, Tag, Brain, TrendingDown, Database, X, Globe, BarChart3, Sparkles, FormInput } from 'lucide-react';
import { NavAuth, HeroCTA, FooterCTA } from '@/components/AuthCTA';
import BookDemoButton from '@/components/BookDemoButton';
import ProductsMenu from '@/components/ProductsMenu';
import { PLANS } from '@/lib/plans';
import FAQSection from '@/components/FAQSection';
import HeroSearchWidget from '@/components/HeroSearchWidget';
import { useI18n } from '@/lib/i18n';
import { TestimonialsBlock, BuiltForProfilesBlock, ResourceTeaserBlock } from '@/components/MarketingBlocks';
import TrustpilotReviewsBlock from '@/components/TrustpilotReviewsBlock';
import { LogoIcon } from '@/components/ui';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import MotionInView from '@/components/MotionInView';
import { useForceLightTheme } from '@/lib/use-force-light-theme';

function formatPrice(cents) {
  if (cents === 0) return '0';
  return Math.round(cents / 100).toString();
}

/**
 * Pricing card pour la landing.
 * Pattern delta features ("Tout inclus dans X +") + Pro killer (encadré
 * "Débloque la suite complète") + Business promo lancement (prix barré).
 */

// Modules débloqués par plan (CRM + Campagnes + Formulaires).
// Définit ici en local pour éviter de coupler LandingContent avec PricingContent.
// Modules débloqués par plan : SEUL Business débloque les 4 modules.
// Starter/Solo/Pro restent sur Prospection uniquement (Pro = juste plus de
// volume vs Solo). C'est ce qui justifie l'écart Pro 49€ → Business 149€.
const LANDING_PLAN_MODULES = {
  free:     { prospection: 'limitée', campagnes: false, crm: false, formulaires: false },
  solo:     { prospection: true,      campagnes: false, crm: false, formulaires: false },
  pro:      { prospection: true,      campagnes: false, crm: false, formulaires: false },
  business: { prospection: true,      campagnes: true,  crm: true,  formulaires: true },
};

function PricingCard({ plan, tagline, features, cta, ctaHref, badge, highlighted, isYearly, t }) {
  const isFree = plan.price === 0;
  const modules = LANDING_PLAN_MODULES[plan.id] || LANDING_PLAN_MODULES.free;

  // Badge colors mapping (Tailwind safe-list ne marche pas avec strings dynamiques)
  const badgeColors = {
    violet: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/20',
    emerald: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-emerald-500/20',
  };

  // ─── Gestion du prix : cas spécial Business avec promo ─────────────────
  // Sur monthly avec promo : prix promo en gros + prix normal barré
  // Sur yearly Business : displayPriceYearly (179×10=1690€/an)
  // Sinon : comportement standard (price / priceYearly)
  const isBusinessWithPromo = plan.id === 'business' && plan.promo;
  const showBusinessPromoMonthly = isBusinessWithPromo && !isYearly;
  const showBusinessYearly = plan.id === 'business' && isYearly && plan.displayPriceYearly;

  return (
    <div className={`relative p-7 rounded-2xl backdrop-blur-sm flex flex-col ${
      highlighted
        ? 'border border-violet-500/30 bg-gradient-to-b from-violet-50 via-violet-50/50 to-white'
        : 'border border-line bg-surface-card/80'
    }`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-semibold rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap ${badgeColors[badge.color] || badgeColors.violet}`}>
          {badge.icon && <badge.icon size={11} />}
          {badge.label}
        </div>
      )}

      <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
      <p className="text-xs text-content-tertiary mb-5 min-h-[32px]">{tagline}</p>

      {/* PRIX — affichage conditionnel selon plan + period + promo */}
      {showBusinessPromoMonthly ? (
        <>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="text-4xl font-bold">
              {formatPrice(plan.promo.displayPrice)}<span className="text-2xl text-content-secondary">&euro;</span>
            </span>
            <span className="text-content-tertiary text-sm">/mois</span>
            <span className="text-lg text-content-muted line-through font-medium">
              {formatPrice(plan.displayPrice)}&nbsp;&euro;
            </span>
          </div>
          <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">
            🎉 {plan.promo.label}
          </p>
          <p className="text-[11px] text-content-tertiary mb-5">
            {plan.promo.sublabel}
          </p>
        </>
      ) : showBusinessYearly ? (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold">
              {formatPrice(plan.displayPriceYearly)}<span className="text-2xl text-content-secondary">&euro;</span>
            </span>
            <span className="text-content-tertiary text-sm">/an</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mb-5">
            ~{Math.round(plan.displayPriceYearly / 1200)}&euro;/mois &middot; 2&nbsp;mois offerts
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold">
              {formatPrice(isYearly ? plan.priceYearly : plan.price)}<span className="text-2xl text-content-secondary">&euro;</span>
            </span>
            <span className="text-content-tertiary text-sm">{isYearly ? t('landing.pricing.perYear') : t('landing.pricing.perMonth')}</span>
          </div>
          {isYearly && !isFree && (
            <p className="text-[11px] text-emerald-600 font-medium mb-5">
              ~{Math.round(plan.priceYearly / 1200)}&euro;/mois en facturation annuelle
            </p>
          )}
          {!isYearly && !isFree && (
            <p className="text-[11px] text-content-tertiary mb-5">
              ou {formatPrice(plan.priceYearly)}&euro;/an ({t('landing.pricing.savePercent')})
            </p>
          )}
          {isFree && <p className="text-[11px] text-content-tertiary mb-5">Sans carte bancaire</p>}
        </>
      )}

      <Link
        href={ctaHref}
        className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition mb-5 ${
          highlighted
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
            : 'border border-line-hover hover:bg-surface-elevated text-content-secondary'
        }`}
      >
        {cta}{highlighted ? ' →' : ''}
      </Link>

      {/* PRO KILLER — encadré violet "Débloque la suite complète".
          C'est LE message qui doit déclencher l'upgrade Solo→Pro. */}
      {plan.unlocksModules && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-300">
          <p className="text-[11px] font-bold text-violet-900 mb-1 flex items-center gap-1">
            <Star size={11} fill="currentColor" /> Débloque la suite complète
          </p>
          <p className="text-[11px] text-violet-700 leading-snug">
            CRM &middot; Campagnes email &middot; Formulaires — tous inclus
          </p>
        </div>
      )}

      {/* MODULES BADGES — check/croix selon ce qui est inclus */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          modules.prospection === true ? 'bg-violet-100 text-violet-700'
          : modules.prospection === 'limitée' ? 'bg-zinc-100 text-zinc-600'
          : 'bg-zinc-50 text-content-muted'
        }`}>
          ✓ Prospection{modules.prospection === 'limitée' ? ' (limitée)' : ''}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          modules.campagnes ? 'bg-blue-100 text-blue-700' : 'bg-zinc-50 text-content-muted'
        }`}>
          {modules.campagnes ? '✓' : '✗'} Campagnes
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          modules.crm ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-50 text-content-muted'
        }`}>
          {modules.crm ? '✓' : '✗'} CRM
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          modules.formulaires ? 'bg-pink-100 text-pink-700' : 'bg-zinc-50 text-content-muted'
        }`}>
          {modules.formulaires ? '✓' : '✗'} Formulaires
          {modules.formulaires === 'pro' ? ' (5)' : ''}
        </span>
      </div>

      {/* "Tout inclus dans X +" intro avant les delta features.
          Simplifie radicalement la lecture cross-plans. */}
      {plan.inheritsFrom && PLANS[plan.inheritsFrom] && (
        <p className="text-[11px] font-semibold text-content-secondary mb-3 pb-3 border-b border-line">
          ✓ Tout inclus dans {PLANS[plan.inheritsFrom].name} +
        </p>
      )}

      <div className="space-y-2.5 flex-1">
        {(Array.isArray(features) ? features : []).map((f) => (
          <div key={f} className="flex items-start gap-2">
            <Check size={15} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-content-secondary leading-relaxed">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingContent() {
  const { t } = useI18n();
  // Landing marketing = TOUJOURS en light (override user dark preference)
  useForceLightTheme();
  // Pricing toggle Monthly / Yearly (UX 2026 standard)
  const [pricingPeriod, setPricingPeriod] = useState('monthly');
  const isYearly = pricingPeriod === 'yearly';

  function formatLimit(value) {
    if (value === -1) return t('landing.unlimited');
    return value.toLocaleString('fr-FR');
  }

  const PLAN_FEATURES = {
    free: t('landing.planFeatures.free'),
    solo: t('landing.planFeatures.solo'),
    pro: t('landing.planFeatures.pro'),
    business: t('landing.planFeatures.business'),
  };

  // entryPrice = ticket d'entrée payant (pour comparer avec Solo à 19€)
  // proPrice   = leur plan équivalent à Pro (49€)
  const COMPETITORS = [
    { name: 'Apollo.io',   entryPrice: '49 $',  proPrice: '99 $',  enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '~30' },
    { name: 'Hunter.io',   entryPrice: '49 €',  proPrice: '99 €',  enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
    { name: 'Lusha',       entryPrice: '36 $',  proPrice: '79 $',  enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
    { name: 'Snov.io',     entryPrice: '39 €',  proPrice: '69 €',  enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '~20' },
    { name: 'Dropcontact', entryPrice: '24 €',  proPrice: '53 €',  enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-content-primary overflow-hidden">
      {/* Navigation */}
      <header>
      <nav className="fixed top-0 w-full z-50 bg-surface-base/70 backdrop-blur-2xl border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <LogoIcon size="sm" />
            <span className="text-lg font-bold tracking-tight ml-1">Volia</span>
            <span className="text-violet-400 text-xs font-semibold">.fr</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <ProductsMenu label="Produits" locale="fr" />
            <Link href="#features" className="text-sm text-content-tertiary hover:text-content-primary transition">{t('landing.nav.features')}</Link>
            <Link href="/pricing" className="text-sm text-content-tertiary hover:text-content-primary transition">{t('landing.nav.pricing')}</Link>
            <Link href="/blog" className="text-sm text-content-tertiary hover:text-content-primary transition">Blog</Link>
            <Link href="#faq" className="text-sm text-content-tertiary hover:text-content-primary transition">{t('landing.nav.faq')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <NavAuth />
          </div>
        </div>
      </nav>
      </header>

      <main>
      {/* ──────────────────────────────────────────────────────────────
          HERO — 2-col desktop (copy left, product mockup right)
          ─────────────────────────────────────────────────────────────
          Refonte mai 2026 — pivot stratégique focus VALEUR CLIENT (B+C) :
          - On parle DU client (résultat concret + émotion), pas DES concurrents
          - H1 actionnable : "Trouve tes 50 premiers prospects en 30s"
          - Sous-titre = valeur business (modules + prix accessible = bénéfice)
          - Comparatif concurrent DÉPLACÉ en bas de page (consentement visiteur)
       */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background gradient mesh — soft, colorful, moderne 2026 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-br from-violet-200/40 via-indigo-100/30 to-pink-100/20 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-40 right-[5%] w-96 h-96 bg-violet-300/20 rounded-full blur-3xl pointer-events-none -z-0 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-60 left-[5%] w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-0 animate-pulse" style={{ animationDuration: '8s' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ─── COLONNE GAUCHE : Copy ─── */}
            <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Badge "Suite SaaS" — repositionne Volia comme plateforme, pas outil unique */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 via-blue-100 to-emerald-100 border-2 border-violet-300 text-xs mb-6 font-medium shadow-sm shadow-violet-500/10">
                <Layers size={12} className="text-violet-600" />
                <span className="text-violet-700 font-bold">SUITE B2B FRANÇAISE · 4 MODULES · 19 €/MOIS</span>
              </div>

              {/* H1 — focus VALEUR CLIENT : verbes d'action + résultats concrets.
                  C'est ce que TU obtiens, pas ce qu'ON construit. */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-bold tracking-tight leading-[1.05] mb-6">
                <span className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">Trouve tes 50 premiers prospects</span>
                <span className="text-content-primary"> en 30 secondes.</span>
                <br />
                <span className="text-content-primary">Lance ta campagne en 5 minutes.</span>
              </h1>

              {/* Sous-titre — valeur business : suite complète + prix accessible
                  reformulé comme BÉNÉFICE (pas comme attaque concurrent). */}
              <p className="text-lg sm:text-xl text-content-secondary mb-8 leading-relaxed max-w-xl">
                Volia : <strong className="text-violet-700">Prospection</strong> + <strong className="text-blue-700">Campagnes</strong> + <strong className="text-emerald-700">CRM</strong> + <strong className="text-pink-700">Formulaires</strong>.
                Une seule app, un seul login, <strong className="text-content-primary">19&nbsp;€/mois</strong> pour démarrer.
                Sans CB.
              </p>

              {/* CTAs — py-5 (plus de présence), shadow plus prononcé */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all text-base"
                >
                  Démarrer gratuitement
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#try-live"
                  className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-xl border-2 border-line-hover hover:border-violet-400 hover:bg-violet-50 text-content-primary font-semibold transition-all text-base"
                >
                  Voir une démo
                </a>
              </div>

              {/* CTA tertiaire — booking démo perso founder */}
              <div className="mb-8">
                <BookDemoButton
                  label="Tu veux me parler ? 15 min."
                  variant="ghost"
                  size="sm"
                  source="landing_hero"
                />
              </div>

              {/* Trust strip sous hero — 4 signaux factuels (287k = chiffre VRAI).
                  TODO Anthony : remplace l'avatars stack par le compteur MRR/founders
                  quand tu auras les chiffres réels. */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  {[
                    { initials: 'AM', color: 'from-violet-500 to-indigo-500' },
                    { initials: 'JD', color: 'from-emerald-500 to-teal-500' },
                    { initials: 'SL', color: 'from-orange-500 to-rose-500' },
                    { initials: 'CT', color: 'from-blue-500 to-cyan-500' },
                    { initials: 'PR', color: 'from-pink-500 to-fuchsia-500' },
                  ].map((a, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.color} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-110 hover:z-10 transition-transform cursor-default`}
                    >
                      {a.initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  {/* TODO Anthony : remplace "founders" par MRR ou nb clients réels.
                      Formulation flexible — ex: "Rejoins les 47 founders qui automatisent leur prospection avec Volia". */}
                  <div className="font-semibold text-content-primary">Rejoins les founders qui automatisent leur prospection</div>
                  <div className="text-content-tertiary">287 000+ entreprises dans la base · sans CB</div>
                </div>
              </div>

              {/* Trust strip — 4 signaux factuels alignés au pivot focus-client */}
              <div className="flex items-center gap-x-3 gap-y-1.5 text-xs text-content-tertiary flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  287 000+ entreprises
                </span>
                <span>·</span>
                <span>4 modules connectés</span>
                <span>·</span>
                <span>Made in France</span>
                <span>·</span>
                <span className="font-medium">RGPD by default</span>
              </div>
            </div>

            {/* ─── COLONNE DROITE : Product mockup ─── */}
            {/* Refonte : 3 cards empilées montrant le flow Prospection → Campagnes → CRM */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
              {/* Floating "live" sticker */}
              <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 shadow-md flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">Flow en direct · 3 modules</span>
              </div>

              <div className="space-y-3">

                {/* CARD 1 — PROSPECTION (violet) */}
                <div className="relative rounded-2xl bg-white border-2 border-violet-200 shadow-xl shadow-violet-500/10 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Search size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-violet-600 font-bold leading-none">1 · Volia Prospection</div>
                        <div className="text-xs font-semibold text-content-primary mt-0.5">Restaurants · Paris</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-md bg-violet-100 text-violet-700 font-bold">234 résultats</div>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {[
                      { name: 'La Bonne Table', email: 'contact@labonnetable.fr' },
                      { name: 'Pasta Roma', email: 'info@pastaroma.fr' },
                      { name: 'Boulangerie Maison', email: 'bonjour@boulangerie-m.fr' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-content-primary truncate mr-2">{row.name}</span>
                        <span className="text-content-tertiary font-mono text-[10px] truncate">{row.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connector arrow */}
                <div className="flex justify-center -my-1">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-line shadow-sm flex items-center justify-center">
                    <ArrowRight size={12} className="text-content-tertiary rotate-90" />
                  </div>
                </div>

                {/* CARD 2 — CAMPAGNES (blue) */}
                <div className="relative rounded-2xl bg-white border-2 border-blue-200 shadow-xl shadow-blue-500/10 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-sm">
                        <Mail size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold leading-none">2 · Volia Campagnes</div>
                        <div className="text-xs font-semibold text-content-primary mt-0.5">Campagne « Resto-Q4 » envoyée</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-bold">234 envois</div>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-base font-bold text-blue-700 tabular-nums">234</div>
                      <div className="text-[10px] text-content-tertiary uppercase tracking-wider">Envoyés</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-emerald-600 tabular-nums">47</div>
                      <div className="text-[10px] text-content-tertiary uppercase tracking-wider">Ouverts</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-violet-700 tabular-nums">12</div>
                      <div className="text-[10px] text-content-tertiary uppercase tracking-wider">Réponses</div>
                    </div>
                  </div>
                </div>

                {/* Connector arrow */}
                <div className="flex justify-center -my-1">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-line shadow-sm flex items-center justify-center">
                    <ArrowRight size={12} className="text-content-tertiary rotate-90" />
                  </div>
                </div>

                {/* CARD 3 — CRM (emerald) */}
                <div className="relative rounded-2xl bg-white border-2 border-emerald-200 shadow-xl shadow-emerald-500/10 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-700">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                        <Layers size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold leading-none">3 · Volia CRM</div>
                        <div className="text-xs font-semibold text-content-primary mt-0.5">Pipeline · 3 deals auto-créés</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 font-bold">Stage Lead</div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2">
                    {['La Bonne Table', 'Pasta Roma', 'Le Petit Bistrot'].map((deal, i) => (
                      <div key={i} className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 text-center truncate">
                        {deal}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Floating decorative card "100% auto" — visual depth */}
              <div className="hidden lg:flex absolute -bottom-4 -right-4 z-20 px-4 py-2.5 rounded-xl bg-white border border-line shadow-xl items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-emerald-500 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-content-tertiary uppercase tracking-wider font-semibold">0 saisie manuelle</div>
                  <div className="text-xs font-bold text-content-primary">Suite connectée</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Trustpilot — sous le hero si activé */}
          <div className="mt-12 flex items-center justify-center">
            <TrustpilotBadge size="sm" />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          AVANT / APRÈS VOLIA — storytelling visuel (direction C)
          ─────────────────────────────────────────────────────────────
          Split-screen : 2 colonnes côte à côte. Gauche = pain points
          (gris/terne). Droite = bénéfices (violet/lumineux). Pattern
          "before/after" très efficace pour faire ressentir le changement.
       */}
      <section className="relative py-20 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-b from-white via-zinc-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">Avant / après Volia</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                Tu te reconnais&nbsp;?
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Le lundi matin de la plupart des founders ressemble à la colonne de gauche. Avec Volia, c&apos;est la droite.
              </p>
            </div>
          </MotionInView>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* ─── AVANT (gauche, terne) ─── */}
            <MotionInView delay={100}>
              <div className="h-full p-7 sm:p-8 rounded-2xl border-2 border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Avant Volia</div>
                    <h3 className="text-xl font-bold text-content-primary">Ton lundi matin actuellement</h3>
                  </div>
                  <span className="text-2xl" aria-hidden="true">😩</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Ouvrir 3 outils différents (et payer 3 abonnements)',
                    'Copier-coller des emails à la main entre Apollo, Lemlist, Notion',
                    'Perdre 2 h sur la recherche, 30 min sur la rédaction',
                    'Suivre tes relances dans un Google Sheet branlant',
                    'Te demander si tu as déjà contacté tel prospect le mois dernier',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-content-secondary">
                      <span className="inline-flex w-5 h-5 rounded-full bg-zinc-200 items-center justify-center flex-shrink-0 mt-0.5">
                        <X size={11} className="text-zinc-500" />
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionInView>

            {/* ─── APRÈS (droite, lumineux) ─── */}
            <MotionInView delay={250}>
              <div className="relative h-full p-7 sm:p-8 rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-indigo-50/40 shadow-xl shadow-violet-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Avec Volia
                </div>
                <div className="flex items-center justify-between mb-6 mt-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-violet-700 mb-1">Après Volia</div>
                    <h3 className="text-xl font-bold text-content-primary">Ton lundi matin avec Volia</h3>
                  </div>
                  <span className="text-2xl" aria-hidden="true">☕</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Une seule app, un seul login, un seul prix',
                    'Click → 50 prospects qualifiés (email + téléphone + site)',
                    'Click → ta séquence email se lance toute seule',
                    'Click → tes deals atterrissent dans le CRM automatiquement',
                    'Aller boire un café. Revenir. Voir qui a répondu.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-content-primary">
                      <span className="inline-flex w-5 h-5 rounded-full bg-violet-100 items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={11} className="text-violet-700" />
                      </span>
                      <span className="leading-relaxed font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionInView>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          Widget interactif — section dédiée propre
          (descendu du hero pour laisser le hero respirer)
          id="try-live" cible du CTA "Voir une démo" du hero
          Mise en avant claire (titre orienté bénéfice client).
       */}
      <section id="try-live" className="relative pt-4 pb-20 px-4 sm:px-6 overflow-hidden scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs text-violet-700 font-semibold mb-3">
              <Sparkles size={12} />
              TESTE MAINTENANT
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-content-primary mb-2">
              Tape ta recherche, vois 5 vrais prospects en 3 secondes.
            </h2>
            <p className="text-content-tertiary">Aucune inscription, aucune CB. Juste pour que tu voies ce que Volia fait pour toi.</p>
          </div>
          <HeroSearchWidget />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          SOCIAL PROOF BAR — chiffres factuels (subtil, ligne fine).
          Remplace l'ancienne section "Volia, en chiffres" flashy.
          Pattern Linear/Cal.com : 4 stats en ligne, sans gradients
          dominants, juste les chiffres VRAIS pour rassurer.
       */}
      <section className="relative py-14 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-zinc-50/40 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: '287 000+', label: 'entreprises dans la base Volia' },
                { value: '101', label: 'départements France + Belgique + Suisse romande' },
                { value: '150+', label: 'catégories B2B (commerce de proximité aux SaaS)' },
                // TODO Anthony : remplace "founders" par chiffre réel (MRR ou nb clients payants)
                { value: '47', label: 'founders nous font déjà confiance', placeholder: true },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-violet-700 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-content-tertiary leading-snug">
                    {stat.label}
                    {stat.placeholder && (
                      // Marqueur visuel discret pour Anthony — à supprimer une fois chiffre réel
                      <span className="block text-[9px] uppercase tracking-wider text-amber-600 mt-0.5">
                        {/* TODO Anthony : remplace 47 par MRR ou nb clients réels */}
                        chiffre à confirmer
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </MotionInView>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          LA SUITE VOLIA — 3 modules connectés (positioning hub)
          ─────────────────────────────────────────────────────────────
          Repositionne Volia comme PLATEFORME multi-produits (vs juste
          outil prospection). REMONTÉE juste après le widget try-live
          pour que la promesse "suite complète" soit above-the-fold
          du scroll #1. Pattern HubSpot/Attio. Chaque module a sa
          couleur accent (violet/blue/emerald) + son statut LIVE/BETA/
          SOON pour transparence.
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-zinc-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">La suite Volia</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                4 modules. Ils se parlent vraiment.
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Vous trouvez vos prospects, vous les contactez, vous capturez les inbound, vous suivez vos deals.
                Tout au même endroit. Made in France.
              </p>
            </div>
          </MotionInView>

          {/* 4 product cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              {
                name: 'Prospection',
                tagline: 'Trouvez les emails de toute entreprise française',
                status: 'LIVE',
                statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
                icon: Search,
                color: 'violet',
                bg: 'from-violet-50 via-white to-violet-50/50',
                border: 'border-violet-300',
                iconBg: 'from-violet-500 to-indigo-600',
                bullets: [
                  '150+ secteurs · 101 départements',
                  'Scraping + recherche Google',
                  'Scoring de confiance par lead',
                ],
                href: '/produits/prospection',
                cta: 'Découvrir',
              },
              {
                name: 'Campagnes',
                tagline: 'Séquences email automatisées avec warmup intégré',
                status: 'BETA',
                statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
                icon: Mail,
                color: 'blue',
                bg: 'from-blue-50 via-white to-cyan-50/50',
                border: 'border-blue-300',
                iconBg: 'from-blue-500 to-cyan-600',
                bullets: [
                  'Email cold + relances auto',
                  'Warmup domaine automatique',
                  'Templates pré-écrits',
                ],
                href: '/produits/campagnes',
                cta: 'Découvrir',
              },
              {
                name: 'CRM',
                tagline: 'Pipeline et suivi commercial natif Volia',
                status: 'BIENTÔT',
                statusColor: 'bg-amber-100 text-amber-700 border-amber-300',
                icon: Layers,
                color: 'emerald',
                bg: 'from-emerald-50 via-white to-teal-50/50',
                border: 'border-emerald-300',
                iconBg: 'from-emerald-500 to-teal-600',
                bullets: [
                  'Contacts auto depuis Campagnes',
                  'Pipeline Kanban deals',
                  'Reporting closing rate',
                ],
                href: '/produits/crm',
                cta: 'Rejoindre la beta',
              },
              {
                name: 'Formulaires',
                tagline: 'Form builder avec bridges CRM + Campagnes natifs',
                status: 'LIVE',
                statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
                icon: FormInput,
                color: 'pink',
                bg: 'from-pink-50 via-white to-rose-50/50',
                border: 'border-pink-300',
                iconBg: 'from-pink-500 to-rose-600',
                bullets: [
                  'Multi-step + logique conditionnelle',
                  'Submissions → CRM / Campagnes auto',
                  'RGPD by default · QR code · embed',
                ],
                href: '/produits/formulaires',
                cta: 'Découvrir',
              },
            ].map((mod, i) => {
              const Icon = mod.icon;
              return (
                <MotionInView key={mod.name} delay={i * 120}>
                  <Link
                    href={mod.href}
                    className={`group block h-full p-7 rounded-2xl border-2 ${mod.border} bg-gradient-to-br ${mod.bg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                  >
                    {/* Header : icon + status badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${mod.statusColor}`}>
                        {mod.status}
                      </span>
                    </div>

                    {/* Module name */}
                    <div className="text-xs text-content-tertiary uppercase tracking-wider mb-1">Volia</div>
                    <h3 className="text-2xl font-bold text-content-primary mb-2">{mod.name}</h3>
                    <p className="text-sm text-content-secondary mb-5 leading-relaxed">{mod.tagline}</p>

                    {/* Bullets */}
                    <ul className="space-y-2 mb-6">
                      {mod.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-content-secondary">
                          <Check size={14} className={`flex-shrink-0 mt-0.5 text-${mod.color}-600`} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA pseudo-button */}
                    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold text-${mod.color}-700 group-hover:gap-2 transition-all`}>
                      {mod.cta}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </MotionInView>
              );
            })}
          </div>

          {/* Data flow tagline */}
          <MotionInView delay={400}>
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white border border-line shadow-sm text-sm">
                <span className="font-semibold text-violet-700">Prospects</span>
                <ArrowRight size={14} className="text-content-tertiary" />
                <span className="font-semibold text-blue-700">Campagnes</span>
                <ArrowRight size={14} className="text-content-tertiary" />
                <span className="font-semibold text-emerald-700">Deals</span>
                <span className="ml-2 text-content-tertiary">Données partagées entre les 3 modules.</span>
              </div>
            </div>
          </MotionInView>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          SCÉNARIO TYPE — storytelling court (direction C, émotion)
          ─────────────────────────────────────────────────────────────
          3 timecards (9h05 / 9h12 / 9h15) qui racontent une vraie
          journée. Pas de chiffres bidons : juste le flow naturel.
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-violet-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">Scénario type</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                Voici à quoi ressemble une journée avec Volia
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Pas de promesse marketing. Le vrai flow, minute par minute.
              </p>
            </div>
          </MotionInView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                time: '9h05',
                module: 'Prospection',
                moduleColor: 'violet',
                title: 'Tu tapes ta recherche',
                desc: 'Tu ouvres Volia. Tu tapes "restaurants Lyon" dans la barre. 50 prospects qualifiés en 4 secondes — adresse, téléphone, email, site web.',
                emoji: '🔎',
              },
              {
                time: '9h12',
                module: 'Campagnes',
                moduleColor: 'blue',
                title: 'Tu lances ta séquence',
                desc: 'Tu cliques "Lancer une campagne". Tu choisis ton template "Cold email FR", tu remplaces 2 variables. C\'est parti.',
                emoji: '📨',
              },
              {
                time: '9h15+',
                module: 'CRM',
                moduleColor: 'emerald',
                title: 'Tu vas chercher ton café',
                desc: 'Tu reviens, 3 prospects ont déjà ouvert. Un a répondu — il atterrit automatiquement dans ton CRM comme deal au stage Lead. Voilà. C\'est ça, Volia.',
                emoji: '☕',
              },
            ].map((step, i) => (
              <MotionInView key={step.time} delay={i * 150}>
                <div className="group h-full p-7 rounded-2xl border-2 border-line hover:border-violet-300 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">{step.time}</div>
                      <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-${step.moduleColor}-100 text-${step.moduleColor}-700 border border-${step.moduleColor}-200`}>
                        {step.module}
                      </span>
                    </div>
                    <span className="text-3xl" aria-hidden="true">{step.emoji}</span>
                  </div>
                  <h3 className="text-lg font-bold text-content-primary mb-3 leading-tight">{step.title}</h3>
                  <p className="text-sm text-content-secondary leading-relaxed">{step.desc}</p>
                </div>
              </MotionInView>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          POUR QUI ? — 3 personas avec quotes (au lieu de faux témoignages)
          ─────────────────────────────────────────────────────────────
          Tant qu'Anthony n'a pas de vrais témoignages clients chiffrés,
          on montre 3 personas inspirés de src/lib/personas.js avec des
          quotes "esprit produit" qui parlent à l'audience cible.
          TODO Anthony : remplace ces quotes par de vrais témoignages
          quand tu en auras (priorité haute).
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">Pour qui ?</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                Tu te retrouves dans l&apos;un de ces profils&nbsp;?
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                {/* TODO Anthony : remplace par de vrais témoignages clients quand tu en auras */}
                Volia a été pensé pour les pros qui veulent un outil simple, pas une usine à gaz.
              </p>
            </div>
          </MotionInView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                emoji: '💼',
                role: 'Founder solo',
                desc: 'Tu prospectes toi-même, tu veux un outil qui ne te bouffe pas ton après-midi.',
                quote: "J'avais besoin d'un outil simple. Apollo coûtait 99 $/mois pour une UI buggée. Volia me donne tout pour 19 €.",
                color: 'violet',
              },
              {
                emoji: '🚀',
                role: 'SDR débordée',
                desc: 'Tu passes trop de temps à chercher au lieu de pitcher.',
                quote: 'Je passais 60 % de mon temps à chercher au lieu de pitcher. Maintenant je signe.',
                color: 'blue',
              },
              {
                emoji: '📈',
                role: 'Agence growth FR',
                desc: 'Tu factures plusieurs clients et tu veux un outil propre, RGPD, facturable.',
                quote: 'Mes clients comprennent enfin la facture : un seul outil, un seul prix.',
                color: 'emerald',
              },
            ].map((persona, i) => (
              <MotionInView key={persona.role} delay={i * 120}>
                <div className={`group h-full p-7 rounded-2xl border-2 border-${persona.color}-200 bg-gradient-to-br from-${persona.color}-50/40 to-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl" aria-hidden="true">{persona.emoji}</span>
                    <h3 className="text-lg font-bold text-content-primary">{persona.role}</h3>
                  </div>
                  <p className="text-sm text-content-tertiary mb-5 leading-relaxed">{persona.desc}</p>
                  <blockquote className={`mt-auto p-4 rounded-xl bg-white border-l-4 border-${persona.color}-400 text-sm text-content-secondary italic leading-relaxed`}>
                    &laquo;&nbsp;{persona.quote}&nbsp;&raquo;
                  </blockquote>
                  {/* Marqueur explicite "persona" — honnêteté éditoriale */}
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-content-muted">
                    Profil type · pas un témoignage client
                  </p>
                </div>
              </MotionInView>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          COMPARATIF STACK — valeur financière de la suite vs concurrents
          ─────────────────────────────────────────────────────────────
          2 colonnes côte à côte : à gauche stack Apollo + Lemlist +
          HubSpot avec prix cumulés, à droite Volia Business 99€/mo.
          Pattern "before / after" très visuel, conversion ++.
       */}
      <section className="relative py-24 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-rose-100/30 to-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-6xl mx-auto relative z-10">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-emerald-600 mb-3 uppercase tracking-wider">Le calcul</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                1 outil au prix d&apos;1. Pas 3 outils au prix de 3.
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Pour le prix d&apos;Apollo tout seul (~99 $/mo), vous avez les 3 modules Volia.
                Soit <strong className="text-emerald-700">~250 €/mois</strong> dans votre poche. Chaque mois.
              </p>
            </div>
          </MotionInView>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* GAUCHE : Stack concurrente (avant) */}
            <MotionInView delay={100}>
              <div className="h-full p-7 rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-white shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">Avant Volia</div>
                    <h3 className="text-xl font-bold text-content-primary">Stack équivalente</h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">3 abonnements</div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { tool: 'Apollo', desc: 'Prospection', price: '99 $' },
                    { tool: 'Lemlist', desc: 'Campagnes email', price: '99 $' },
                    { tool: 'HubSpot Starter', desc: 'CRM', price: '90 $' },
                  ].map((row) => (
                    <div key={row.tool} className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <X size={14} className="text-rose-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-content-primary">{row.tool}</div>
                          <div className="text-xs text-content-tertiary">{row.desc}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-content-secondary tabular-nums">{row.price}/mo</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-rose-200">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-content-secondary">Total</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold font-mono text-rose-600 tabular-nums">~288 $</span>
                      <span className="text-content-tertiary text-sm">/mois</span>
                    </div>
                  </div>
                  <p className="text-xs text-content-tertiary mt-2">~270 €/mois HT. Plus l&apos;export/import CSV à la main entre les outils.</p>
                </div>
              </div>
            </MotionInView>

            {/* DROITE : Volia (après, mise en valeur) */}
            <MotionInView delay={250}>
              <div className="relative h-full p-7 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-violet-50/50 shadow-xl shadow-emerald-500/10">
                {/* Badge "Recommandé" flottant */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Recommandé · Volia Business
                </div>

                <div className="flex items-center justify-between mb-6 mt-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">Avec Volia</div>
                    <h3 className="text-xl font-bold text-content-primary">Suite unifiée</h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">1 seul abonnement</div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { tool: 'Volia Prospection', desc: '287 000+ entreprises FR', color: 'violet' },
                    { tool: 'Volia Campagnes', desc: 'Séquences email + warmup', color: 'blue' },
                    { tool: 'Volia CRM', desc: 'Pipeline Kanban + deals', color: 'emerald' },
                  ].map((row) => (
                    <div key={row.tool} className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full bg-${row.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <Check size={14} className={`text-${row.color}-600`} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-content-primary">{row.tool}</div>
                          <div className="text-xs text-content-tertiary">{row.desc}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Inclus</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-emerald-200">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-content-secondary">Total Volia Business</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold font-mono bg-gradient-to-br from-emerald-600 to-teal-700 bg-clip-text text-transparent tabular-nums">149 €</span>
                      <span className="text-content-tertiary text-sm">/mois</span>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">🎉 promo 12 mois (puis 179 €)</div>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-2">
                    ~120 €/mois dans la poche. ~1 400 €/an. Les 4 modules partagent les mêmes données, en direct.
                  </p>
                </div>
              </div>
            </MotionInView>
          </div>

          {/* CTA final */}
          <MotionInView delay={400}>
            <div className="mt-10 text-center">
              <Link
                href="/signup?plan=business"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
              >
                Je prends Business à 149&nbsp;€/mois (promo 12 mois)
                <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-content-tertiary mt-3">14 jours pour changer d&apos;avis · Annulation en 1 clic, vraiment</p>
            </div>
          </MotionInView>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          WORKFLOWS CROISÉS — magie inter-modules
          ─────────────────────────────────────────────────────────────
          3 use cases concrets qui montrent la VALEUR de l'intégration
          native vs stack séparée (où les données ne se parlent pas).
          Pattern visuel : 3 cards avec flèches entre modules.
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-violet-50/20 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">Workflows croisés</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                Les modules se parlent. Vous arrêtez de copier-coller.
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Pas d&apos;import/export entre outils. Les leads, campagnes et deals utilisent la même base.
              </p>
            </div>
          </MotionInView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: '01',
                modules: [
                  { name: 'Prospection', color: 'violet' },
                  { name: 'Campagnes', color: 'blue' },
                  { name: 'CRM', color: 'emerald' },
                ],
                title: 'Lead → Campagne → Deal en 1 clic',
                desc: '50 restaurants Paris, bouton « Lancer campagne ». Ils reçoivent votre mail. L\'un répond — un deal apparaît dans le CRM. Vous n\'avez rien touché.',
                badge: 'Le plus utilisé',
                iconBg: 'from-violet-500 via-blue-500 to-emerald-500',
              },
              {
                num: '02',
                modules: [
                  { name: 'CRM', color: 'emerald' },
                  { name: 'Campagnes', color: 'blue' },
                ],
                title: 'CRM → Relance automatique',
                desc: 'Un deal dort en stage Lead depuis 7 jours ? Bouton « Ajouter à séquence ». Relance envoyée. Vous ne touchez plus au CRM.',
                badge: 'Stop aux deals oubliés',
                iconBg: 'from-emerald-500 to-blue-500',
              },
              {
                num: '03',
                modules: [
                  { name: 'Timeline 360°', color: 'violet' },
                ],
                title: '360° par contact',
                desc: 'Chaque contact CRM a sa timeline complète : emails envoyés, ouverts, cliqués, répondus. 100 % auto. Aucune saisie manuelle.',
                badge: 'Vue unifiée',
                iconBg: 'from-violet-500 to-pink-500',
              },
            ].map((wf, i) => (
              <MotionInView key={wf.num} delay={i * 120}>
                <div className="group h-full p-7 rounded-2xl border-2 border-line hover:border-violet-300 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* Header : num + badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wf.iconBg} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold font-mono">{wf.num}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                      {wf.badge}
                    </span>
                  </div>

                  {/* Modules flow visual */}
                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    {wf.modules.map((mod, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-${mod.color}-100 text-${mod.color}-700 border border-${mod.color}-200`}>
                          {mod.name}
                        </span>
                        {idx < wf.modules.length - 1 && (
                          <ArrowRight size={12} className="text-content-tertiary" />
                        )}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-content-primary mb-3 leading-tight">{wf.title}</h3>
                  <p className="text-sm text-content-secondary leading-relaxed">{wf.desc}</p>
                </div>
              </MotionInView>
            ))}
          </div>
        </div>
      </section>

      {/* Note pivot mai 2026 : l'ancienne "LIVE STATS BANNER" (4 chiffres
          gradient flashy avec "5× moins cher qu'Apollo") a été supprimée.
          La social proof bar subtile est désormais en haut de page sous
          le widget try-live. */}

      {/* Bloc "Pensé pour ces profils" — remplace les anciens chips
          "profils anonymisés". Plus honnête (on ne prétend pas avoir des
          clients qu'on n'a pas), plus utile (lien vers 6 pages persona),
          meilleur SEO (maillage interne /pour/[slug]). */}
      <BuiltForProfilesBlock />

      {/* ──────────────────────────────────────────────────────────────
          POWERED BY — stack technique (trust signal moderne)
       */}
      <section className="py-12 px-4 sm:px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <p className="text-center text-xs uppercase tracking-[0.2em] font-semibold text-content-tertiary mb-8">
              Construit avec les outils de référence
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
              {[
                { name: 'Stripe', tag: 'Paiements' },
                { name: 'Supabase', tag: 'Auth & DB' },
                { name: 'Anthropic', tag: 'IA' },
                { name: 'Resend', tag: 'Emails' },
                { name: 'Vercel', tag: 'Hosting' },
                { name: 'Google Places', tag: 'Data' },
              ].map((tech, i) => (
                <MotionInView key={tech.name} delay={i * 60} className="flex items-center gap-2">
                  <span className="text-base font-bold text-content-secondary tracking-tight">{tech.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-content-muted font-mono">{tech.tag}</span>
                </MotionInView>
              ))}
            </div>
          </MotionInView>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          WHY AGGREGATOR — bento layout (center stat highlighted)
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-violet-600 mb-3">{t('landing.why.label')}</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                {t('landing.why.title')}
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t('landing.why.desc') }} />
            </div>
          </MotionInView>

          {/* Bento : carte centrale featured ~85%, 2 cards side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Card gauche — ~40% (problem) */}
            <MotionInView delay={100}>
              <div className="h-full p-7 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-3">Problème</div>
                <div className="text-6xl font-bold font-mono bg-gradient-to-br from-rose-500 to-rose-700 bg-clip-text text-transparent mb-3">~40%</div>
                <p className="text-sm text-content-secondary mt-auto" dangerouslySetInnerHTML={{ __html: t('landing.why.stat1Label') }} />
              </div>
            </MotionInView>

            {/* Card centrale — ~85% (Volia solution, mise en valeur) */}
            <MotionInView delay={200}>
              <div className="relative h-full p-8 rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-100 via-indigo-50 to-white shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-1 transition-all flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">Volia</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-700 mb-3 mt-2">Notre solution</div>
                <div className="text-7xl font-bold font-mono bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent mb-3">~85%</div>
                <p className="text-sm text-content-primary font-medium mt-auto" dangerouslySetInnerHTML={{ __html: t('landing.why.stat2Label') }} />
              </div>
            </MotionInView>

            {/* Card droite — -80% (économies) */}
            <MotionInView delay={300}>
              <div className="h-full p-7 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">Bénéfice</div>
                <div className="text-6xl font-bold font-mono bg-gradient-to-br from-emerald-500 to-emerald-700 bg-clip-text text-transparent mb-3">-80%</div>
                <p className="text-sm text-content-secondary mt-auto" dangerouslySetInnerHTML={{ __html: t('landing.why.stat3Label') }} />
              </div>
            </MotionInView>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          FEATURES — bento layout (1 featured big + 5 medium/small)
          Pattern : variation de tailles = look moderne 2026
       */}
      <section id="features" className="py-24 px-4 sm:px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-violet-600 mb-3">{t('landing.features.label')}</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                {t('landing.features.title')}
              </h2>
              <p className="text-content-tertiary text-lg max-w-xl mx-auto">
                {t('landing.features.desc')}
              </p>
            </div>
          </MotionInView>

          {(() => {
            const features = [
              {
                icon: Layers, featured: true,
                title: t('landing.features.waterfall'),
                desc: t('landing.features.waterfallDesc'),
                iconBg: 'from-violet-500 to-indigo-600',
                cardBg: 'from-violet-50 via-indigo-50 to-white',
                border: 'border-violet-200',
              },
              {
                icon: Brain,
                title: t('landing.features.ai'),
                desc: t('landing.features.aiDesc'),
                iconBg: 'from-indigo-500 to-blue-600',
                cardBg: 'from-indigo-50 to-white',
                border: 'border-indigo-200',
              },
              {
                icon: BarChart3,
                title: t('landing.features.scoring'),
                desc: t('landing.features.scoringDesc'),
                iconBg: 'from-blue-500 to-cyan-600',
                cardBg: 'from-blue-50 to-white',
                border: 'border-blue-200',
              },
              {
                icon: Database,
                title: t('landing.features.categories'),
                desc: t('landing.features.categoriesDesc'),
                iconBg: 'from-cyan-500 to-teal-600',
                cardBg: 'from-cyan-50 to-white',
                border: 'border-cyan-200',
              },
              {
                icon: Globe,
                title: t('landing.features.departments'),
                desc: t('landing.features.departmentsDesc'),
                iconBg: 'from-teal-500 to-emerald-600',
                cardBg: 'from-teal-50 to-white',
                border: 'border-teal-200',
              },
              {
                icon: Download, wide: true,
                title: t('landing.features.exportFeature'),
                desc: t('landing.features.exportDesc'),
                iconBg: 'from-emerald-500 to-green-600',
                cardBg: 'from-emerald-50 to-white',
                border: 'border-emerald-200',
              },
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  const isWide = feature.featured || feature.wide;
                  return (
                    <MotionInView
                      key={feature.title}
                      delay={i * 80}
                      className={isWide ? 'lg:col-span-2' : ''}
                    >
                      <div className={`group h-full p-7 rounded-2xl border-2 ${feature.border} bg-gradient-to-br ${feature.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={22} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-content-primary">{feature.title}</h3>
                        <p className="text-sm text-content-secondary leading-relaxed">{feature.desc}</p>
                        {feature.featured && (
                          <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-violet-700">
                            <Sparkles size={14} />
                            La feature signature de Volia
                          </div>
                        )}
                      </div>
                    </MotionInView>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          HOW IT WORKS — steps avec gros numéros + ligne connectrice
          BG : violet pastel pour rythme visuel vs sections white
       */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-violet-50/40 via-indigo-50/20 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">{t('landing.howItWorks.label')}</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                {t('landing.howItWorks.title')}
              </h2>
              <p className="text-content-tertiary text-lg max-w-xl mx-auto">
                {t('landing.howItWorks.desc')}
              </p>
            </div>
          </MotionInView>

          {/* Steps avec ligne connectrice horizontale (desktop) */}
          <div className="relative">
            {/* Ligne connectrice horizontale au milieu (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-300 -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
              {[
                {
                  step: '01',
                  icon: Search,
                  title: t('landing.howItWorks.step1'),
                  desc: t('landing.howItWorks.step1Desc'),
                  gradient: 'from-violet-500 to-indigo-600',
                  ring: 'ring-violet-100',
                },
                {
                  step: '02',
                  icon: Zap,
                  title: t('landing.howItWorks.step2'),
                  desc: t('landing.howItWorks.step2Desc'),
                  gradient: 'from-indigo-500 to-blue-600',
                  ring: 'ring-indigo-100',
                },
                {
                  step: '03',
                  icon: Download,
                  title: t('landing.howItWorks.step3'),
                  desc: t('landing.howItWorks.step3Desc'),
                  gradient: 'from-blue-500 to-cyan-600',
                  ring: 'ring-blue-100',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <MotionInView key={item.step} delay={i * 150}>
                    <div className="text-center group">
                      {/* Gros cercle numéroté avec icône au centre */}
                      <div className={`relative w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl shadow-violet-500/20 ring-8 ${item.ring} group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                        <Icon size={32} className="text-white" />
                        {/* Badge numéro flottant */}
                        <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold font-mono text-violet-700">{item.step}</span>
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

      {/* Waterfall visual */}
      <section className="py-24 px-4 sm:px-6 border-t border-line">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.waterfall.label')}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 max-w-lg" dangerouslySetInnerHTML={{ __html: t('landing.waterfall.title') }} />
            <p className="text-content-tertiary text-lg max-w-xl" dangerouslySetInnerHTML={{ __html: t('landing.waterfall.desc') }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { name: 'Decouverte domaine', desc: 'Pas de site web ? On le trouve via Google.', tag: 'Auto', score: '100%', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20', dot: 'bg-blue-400' },
              { name: 'Scraping site web', desc: 'Extrait les emails du site, pages contact et mentions legales.', tag: t('landing.waterfall.free'), score: '100%', color: 'from-green-500/20 to-emerald-500/20 border-green-500/20', dot: 'bg-green-400' },
              { name: 'Recherche Google', desc: 'Cherche l\'email sur Google si le scraping ne trouve rien.', tag: 'Inclus', score: '90%', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20', dot: 'bg-yellow-400' },
            ].map((s, i) => (
              <div key={s.name} className={`relative p-5 rounded-xl bg-gradient-to-br ${s.color} border border-line`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-[10px] font-mono text-content-tertiary">0{i + 1}</span>
                </div>
                <h4 className="text-base font-semibold mb-1">{s.name}</h4>
                <p className="text-xs text-content-tertiary mb-2">{s.desc}</p>
                <span className="text-[10px] text-content-secondary font-medium">{s.tag}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-content-tertiary mt-6">
            {t('landing.waterfall.stopsFirst')}
          </p>
        </div>
      </section>

      {/* Email Verification Feature */}
      <section className="py-24 px-4 sm:px-6 border-t border-line">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left -- Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
                <Shield size={12} />
                Enterprise
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {t('landing.emailVerif.title')}
              </h2>
              <p className="text-content-secondary text-lg mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.emailVerif.desc') }} />

              <div className="space-y-4">
                {[
                  {
                    icon: Mail,
                    title: t('landing.emailVerif.smtp'),
                    desc: t('landing.emailVerif.smtpDesc'),
                  },
                  {
                    icon: Download,
                    title: t('landing.emailVerif.csvImport'),
                    desc: t('landing.emailVerif.csvImportDesc'),
                  },
                  {
                    icon: Shield,
                    title: t('landing.emailVerif.reputation'),
                    desc: t('landing.emailVerif.reputationDesc'),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                      <p className="text-xs text-content-tertiary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right -- Visual mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative rounded-2xl border border-line bg-surface-card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Mail size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t('landing.emailVerif.mockTitle')}</div>
                      <div className="text-[10px] text-content-tertiary">{t('landing.emailVerif.mockImported')}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-content-tertiary px-2 py-1 rounded bg-surface-elevated/60 border border-line">{t('landing.emailVerif.mockCsvDone')}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-content-tertiary">{t('landing.emailVerif.progress')}</span>
                    <span className="text-emerald-400 font-mono">100%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{width: '100%'}} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: t('landing.emailVerif.valid'), value: '2 103', pct: '73.8%', color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: t('landing.emailVerif.invalid'), value: '412', pct: '14.5%', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: t('landing.emailVerif.catchAll'), value: '281', pct: '9.9%', color: 'text-amber-600', bg: 'bg-amber-500/10' },
                    { label: t('landing.emailVerif.unknown'), value: '51', pct: '1.8%', color: 'text-content-secondary', bg: 'bg-zinc-500/10' },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} border border-line text-center`}>
                      <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-content-tertiary mt-0.5">{stat.label}</div>
                      <div className={`text-[9px] font-mono mt-0.5 ${stat.color}/60`}>{stat.pct}</div>
                    </div>
                  ))}
                </div>

                {/* Sample rows */}
                <div className="space-y-1.5">
                  {[
                    { email: 'contact@dupont-btp.fr', status: t('landing.emailVerif.valid'), color: 'text-green-400', dot: 'bg-green-400' },
                    { email: 'info@garage-martin.com', status: t('landing.emailVerif.valid'), color: 'text-green-400', dot: 'bg-green-400' },
                    { email: 'direction@inexistant.fr', status: t('landing.emailVerif.invalid'), color: 'text-red-400', dot: 'bg-red-400' },
                    { email: 'contact@hotel-riviera.fr', status: t('landing.emailVerif.catchAll'), color: 'text-amber-600', dot: 'bg-amber-400' },
                  ].map((row) => (
                    <div key={row.email} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated/40 border border-line">
                      <span className="text-xs text-content-secondary font-mono">{row.email}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                        <span className={`text-[10px] font-medium ${row.color}`}>{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <span className="text-[10px] text-content-tertiary">{t('landing.emailVerif.cost')}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{t('landing.emailVerif.exportValid')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Note pivot mai 2026 : le tableau comparatif concurrents
          (id="vs-concurrence") a été DÉPLACÉ tout en bas de page,
          juste après le Final CTA. Le visiteur qui veut comparer y
          va volontairement — on ne lui balance plus dans la figure
          dès l'arrivée. */}

      {/* Pricing */}
      {/* Testimonials — rassure avant la décision d'achat */}
      <section className="py-24 px-4 sm:px-6 border-t border-line">
        <TestimonialsBlock />
        {/* Bloc Trustpilot — affiché uniquement si activé (Business Unit
            ID set + au moins 1 avis dans trustpilot-data.js). En attendant,
            les TestimonialsBlock ci-dessus prennent le relais. */}
        <TrustpilotReviewsBlock />
      </section>

      {/* Lead magnet teaser — capture les hésitants sur le PDF gratuit */}
      <section className="py-12 px-4 sm:px-6">
        <ResourceTeaserBlock
          title="Pas prêt à signer ? Récupérez 20 templates cold email B2B"
          subtitle="PDF 30 pages : intros qui taquinent, lignes d'objet à fort taux d'ouverture, séquences en 3 touches. Testé sur 50 000 envois."
        />
      </section>


      {/* FAQ */}
      <FAQSection />

      {/* ──────────────────────────────────────────────────────────────
          FINAL CTA — gradient mesh hero-like impactant
       */}
      <section className="relative py-32 px-4 sm:px-6 border-t border-line overflow-hidden">
        {/* Gradient mesh background — wow finish */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-indigo-50 to-pink-50 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

        <MotionInView className="max-w-3xl mx-auto text-center relative z-10">
          {/* Badge animé */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-violet-200 shadow-sm text-xs mb-6 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-violet-700">Démarrage en 30 secondes</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
            <span className="text-content-primary">{t('landing.cta.title')}</span>
          </h2>
          <p className="text-content-secondary text-lg sm:text-xl mb-3 max-w-xl mx-auto">
            {t('landing.cta.desc')}
          </p>
          <p className="text-sm text-violet-700 font-semibold mb-10">
            {t('landing.cta.sub')}
          </p>

          {/* CTAs renforcés */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all text-base"
            >
              Démarrer gratuitement
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-violet-50 border-2 border-violet-200 hover:border-violet-400 text-content-primary font-semibold transition-all text-base"
            >
              Voir les tarifs
            </Link>
            <BookDemoButton
              label="Réserver 15 min de démo"
              variant="secondary"
              size="lg"
              source="landing_final_cta"
            />
          </div>

          {/* Trust signal final */}
          <p className="text-xs text-content-tertiary">
            Sans carte bancaire · 100 prospects gratuits · Annulation en 1 clic
          </p>
        </MotionInView>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          COMPARATIF CONCURRENTS — déplacé en bas de page (pivot mai 2026)
          ─────────────────────────────────────────────────────────────
          Avant : section dominante au milieu de la landing ("Apollo
          coûte 99$. Volia 19€. Vous voyez l'idée.").
          Après : section optionnelle juste avant le footer pour les
          visiteurs qui veulent comparer volontairement.
       */}
      <section id="vs-concurrence" className="py-24 px-4 sm:px-6 border-t border-line bg-zinc-50/40">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-content-tertiary mb-3 uppercase tracking-wider">{t('landing.competition.label')}</p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold mb-4 text-content-primary">
                {t('landing.competition.title')}
              </h2>
              <p className="text-content-tertiary text-base max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t('landing.competition.desc') }} />
            </div>
          </MotionInView>

          <div className="p-1 rounded-2xl bg-gradient-to-b from-violet-500/20 to-transparent">
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-line">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-4 px-4 font-medium text-content-tertiary min-w-[140px]"></th>
                      <th className="text-center py-4 px-4 min-w-[120px]">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <TrendingDown size={10} /> Le moins cher
                        </div>
                        <div className="font-bold text-violet-400 text-base">Volia</div>
                        <div className="text-violet-400/60 text-xs mt-0.5">dès 19&euro;/{t('landing.competition.month')}</div>
                      </th>
                      {COMPETITORS.map((c) => (
                        <th key={c.name} className="text-center py-4 px-4 font-medium text-content-tertiary min-w-[100px]">
                          <div>{c.name}</div>
                          <div className="text-content-muted text-xs mt-0.5">dès {c.entryPrice}/{t('landing.competition.month')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: t('landing.competition.enrichSources'), volia: t('landing.competition.sevenSources'), key: 'enrichments' },
                      { label: t('landing.competition.confidenceScoring'), volia: true, key: 'scoring' },
                      { label: t('landing.competition.aiSearch'), volia: true, key: 'ai' },
                      { label: t('landing.competition.deptsFR'), volia: true, key: 'depts' },
                      { label: t('landing.competition.b2bCategories'), volia: '150+', key: 'categories' },
                      { label: t('landing.competition.googlePlaces'), volia: true, key: 'google', competitors: [false, false, false, false, false] },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-line">
                        <td className="py-3.5 px-4 text-content-secondary">{row.label}</td>
                        <td className="py-3.5 px-4 text-center">
                          {typeof row.volia === 'boolean' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20">
                              <Check size={14} className="text-violet-400" />
                            </span>
                          ) : (
                            <span className="font-semibold text-content-primary">{row.volia}</span>
                          )}
                        </td>
                        {COMPETITORS.map((c) => {
                          const val = row.competitors ? row.competitors[COMPETITORS.indexOf(c)] : c[row.key];
                          return (
                            <td key={c.name} className="py-3.5 px-4 text-center">
                              {typeof val === 'boolean' ? (
                                val ? <Check size={14} className="text-content-tertiary mx-auto" /> : <X size={14} className="text-zinc-800 mx-auto" />
                              ) : (
                                <span className="text-content-tertiary">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Price rows : Entry tier (Solo) + Pro tier */}
                    <tr className="border-t-2 border-line">
                      <td className="py-4 px-4 text-content-secondary font-semibold">Ticket d&apos;entrée</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-emerald-400">19&euro;</span>
                        <div className="text-[10px] text-emerald-400/60 mt-0.5 uppercase tracking-wider font-bold">Solo</div>
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-4 px-4 text-center">
                          <span className="text-lg text-content-tertiary">{c.entryPrice}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-line">
                      <td className="py-4 px-4 text-content-secondary font-semibold">Plan Pro</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-violet-400">49&euro;</span>
                        <div className="text-[10px] text-violet-400/60 mt-0.5 uppercase tracking-wider font-bold">Recommandé</div>
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-4 px-4 text-center">
                          <span className="text-lg text-content-tertiary">{c.proPrice}</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-line py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* SEO link clusters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-line">
            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Produit</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-content-tertiary hover:text-violet-400 transition">Accueil</Link></li>
                <li><Link href="/signup" className="text-content-tertiary hover:text-violet-400 transition">Inscription</Link></li>
                <li><Link href="/login" className="text-content-tertiary hover:text-violet-400 transition">Connexion</Link></li>
                <li><Link href="/pricing" className="text-content-tertiary hover:text-violet-400 transition">Tarifs</Link></li>
                <li><Link href="/demo" className="text-content-tertiary hover:text-violet-400 transition">Réserver une démo</Link></li>
              </ul>
            </div>

            {/* Comparatifs */}
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Comparatifs</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/vs/apollo" className="text-content-tertiary hover:text-violet-400 transition">vs Apollo.io</Link></li>
                <li><Link href="/vs/hunter" className="text-content-tertiary hover:text-violet-400 transition">vs Hunter.io</Link></li>
                <li><Link href="/vs/lusha" className="text-content-tertiary hover:text-violet-400 transition">vs Lusha</Link></li>
                <li><Link href="/vs/snov" className="text-content-tertiary hover:text-violet-400 transition">vs Snov.io</Link></li>
              </ul>
            </div>

            {/* Prospection populaires */}
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Prospection</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/prospection" className="text-content-tertiary hover:text-violet-400 transition">Tous secteurs</Link></li>
                <li><Link href="/prospection/restaurant" className="text-content-tertiary hover:text-violet-400 transition">Restaurants</Link></li>
                <li><Link href="/prospection/hotel" className="text-content-tertiary hover:text-violet-400 transition">Hôtels</Link></li>
                <li><Link href="/prospection/avocat" className="text-content-tertiary hover:text-violet-400 transition">Avocats</Link></li>
                <li><Link href="/prospection/dept/75-paris" className="text-content-tertiary hover:text-violet-400 transition">Paris (75)</Link></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Ressources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="text-content-tertiary hover:text-violet-400 transition">Blog</Link></li>
                <li><Link href="/guide" className="text-content-tertiary hover:text-violet-400 transition">Guides sectoriels</Link></li>
                <li><Link href="/glossaire" className="text-content-tertiary hover:text-violet-400 transition">Glossaire B2B</Link></li>
                <li><Link href="/blog/rgpd-prospection-b2b" className="text-content-tertiary hover:text-violet-400 transition">Guide RGPD</Link></li>
                <li><Link href="/blog/cold-emailing-2026" className="text-content-tertiary hover:text-violet-400 transition">Cold emailing 2026</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom legal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <LogoIcon size="xs" />
              <span className="text-sm font-bold tracking-tight ml-1">Volia</span>
              <span className="text-violet-400 text-[10px] font-semibold">.fr</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-content-tertiary">
              <Link href="/cgu" className="hover:text-content-secondary transition">{t('landing.footer.cgu')}</Link>
              <Link href="/cgv" className="hover:text-content-secondary transition">CGV</Link>
              <Link href="/dpa" className="hover:text-content-secondary transition">DPA</Link>
              <Link href="/confidentialite" className="hover:text-content-secondary transition">{t('landing.footer.privacy')}</Link>
              <Link href="/rgpd" className="hover:text-content-secondary transition">{t('landing.footer.gdpr')}</Link>
              <Link href="/opt-out" className="hover:text-content-secondary transition">{t('landing.footer.optOut')}</Link>
            </div>
            <p className="text-[11px] text-content-muted">
              &copy; 2026 Volia.fr
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
