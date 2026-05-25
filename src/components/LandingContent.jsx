'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Zap, Search, Mail, MapPin, Shield, Layers, Download, Crown, Star, Tag, Brain, TrendingDown, Database, X, Globe, BarChart3, Sparkles } from 'lucide-react';
import { NavAuth, HeroCTA, FooterCTA } from '@/components/AuthCTA';
import { PLANS } from '@/lib/plans';
import FAQSection from '@/components/FAQSection';
import HeroSearchWidget from '@/components/HeroSearchWidget';
import { useI18n } from '@/lib/i18n';
import { TestimonialsBlock, BuiltForProfilesBlock, ResourceTeaserBlock } from '@/components/MarketingBlocks';
import TrustpilotReviewsBlock from '@/components/TrustpilotReviewsBlock';
import { LogoIcon } from '@/components/ui';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import MotionInView from '@/components/MotionInView';

function formatPrice(cents) {
  if (cents === 0) return '0';
  return Math.round(cents / 100).toString();
}

/**
 * Pricing card pour la landing.
 * Gère monthly/yearly + badge (Recommandé, Le moins cher) + highlighting.
 */
function PricingCard({ plan, tagline, features, cta, ctaHref, badge, highlighted, isYearly, t }) {
  const price = isYearly ? plan.priceYearly : plan.price;
  const isFree = plan.price === 0;

  // Badge colors mapping (Tailwind safe-list ne marche pas avec strings dynamiques)
  const badgeColors = {
    violet: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/20',
    emerald: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-emerald-500/20',
  };

  return (
    <div className={`relative p-7 rounded-2xl backdrop-blur-sm ${
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

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-bold">{formatPrice(price)}<span className="text-2xl text-content-secondary">&euro;</span></span>
        <span className="text-content-tertiary text-sm">{isYearly ? t('landing.pricing.perYear') : t('landing.pricing.perMonth')}</span>
      </div>
      {isYearly && !isFree && (
        <p className="text-[11px] text-emerald-400 font-medium mb-5">
          ~{Math.round(plan.priceYearly / 1200)}&euro;/mois en facturation annuelle
        </p>
      )}
      {!isYearly && !isFree && (
        <p className="text-[11px] text-content-tertiary mb-5">
          ou {formatPrice(plan.priceYearly)}&euro;/an ({t('landing.pricing.savePercent')})
        </p>
      )}
      {isFree && <p className="mb-5">&nbsp;</p>}

      <Link
        href={ctaHref}
        className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition mb-6 ${
          highlighted
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
            : 'border border-line-hover hover:bg-surface-elevated text-content-secondary'
        }`}
      >
        {cta}{highlighted ? ' →' : ''}
      </Link>

      <div className="space-y-2.5">
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
            <Link href="/produits/prospection" className="text-sm text-content-tertiary hover:text-content-primary transition">Produits</Link>
            <Link href="#features" className="text-sm text-content-tertiary hover:text-content-primary transition">{t('landing.nav.features')}</Link>
            <Link href="#pricing" className="text-sm text-content-tertiary hover:text-content-primary transition">{t('landing.nav.pricing')}</Link>
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
          Refonte mai 2026 inspiration Linear/Apollo/Cal.com :
          - Typo massive (text-7xl xl:text-8xl) = "wow" instantané
          - Product mockup à droite = on VOIT le produit, pas que la promesse
          - Avatars stack + social proof = trust visuel
          - Animations CSS fade-in + float = sensation "vivant"
          - HeroSearchWidget descendu en section dédiée plus bas
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
              {/* Badge "Le moins cher" */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-violet-100 border border-emerald-300 text-xs mb-6 font-medium shadow-sm">
                <TrendingDown size={12} className="text-emerald-600" />
                <span className="text-emerald-700 font-bold">LE MOINS CHER DU MARCHÉ FRANÇAIS</span>
              </div>

              {/* H1 MASSIVE */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-bold tracking-tight leading-[1.02] mb-6">
                <span className="text-content-primary">L&apos;email de </span>
                <span className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">toute entreprise</span>
                <span className="text-content-primary"> française.</span>
              </h1>

              {/* Sous-titre */}
              <p className="text-lg sm:text-xl text-content-secondary mb-8 leading-relaxed max-w-xl">
                Scraping intelligent + recherche Google.{' '}
                <strong className="text-content-primary font-semibold">150+ secteurs, 101 départements</strong>.
                À partir de 19 €/mois.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
                >
                  Démarrer gratuitement
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border-2 border-line-hover hover:border-violet-400 hover:bg-violet-50 text-content-primary font-semibold transition-all"
                >
                  Voir les tarifs
                </Link>
              </div>

              {/* Avatars stack + social proof */}
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
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.color} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold shadow-md`}
                    >
                      {a.initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-content-primary">SDR, freelances, fondateurs</div>
                  <div className="text-content-tertiary">utilisent Volia pour prospecter en France</div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 text-xs text-content-tertiary flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sans carte bancaire
                </span>
                <span>·</span>
                <span>Starter gratuit à vie</span>
                <span>·</span>
                <span className="font-medium">Conforme RGPD</span>
              </div>
            </div>

            {/* ─── COLONNE DROITE : Product mockup ─── */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
              {/* Floating "live results" sticker */}
              <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 shadow-md flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">Recherche en direct</span>
              </div>

              {/* The mockup card */}
              <div className="relative rounded-2xl bg-white border border-line shadow-2xl shadow-violet-500/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-gradient-to-r from-violet-50 to-indigo-50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="ml-3 text-xs font-mono text-content-tertiary">volia.fr/dashboard</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-md bg-violet-100 text-violet-700 font-semibold">234 résultats</div>
                </div>

                {/* Search bar mock */}
                <div className="px-5 py-3 border-b border-line flex items-center gap-3">
                  <Search size={14} className="text-violet-500" />
                  <span className="text-sm text-content-secondary font-medium">Restaurants · Paris (75)</span>
                </div>

                {/* Results table */}
                <div className="divide-y divide-line">
                  {[
                    { name: 'La Bonne Table', email: 'contact@labonnetable.fr', score: 'Vérifié', color: 'emerald', avatar: '🍽️' },
                    { name: 'Pasta Roma', email: 'info@pastaroma.fr', score: 'Vérifié', color: 'emerald', avatar: '🍝' },
                    { name: 'Boulangerie Maison', email: 'bonjour@boulangerie-m.fr', score: 'Google', color: 'amber', avatar: '🥖' },
                    { name: 'Le Petit Bistrot', email: 'reservation@petitbistrot.fr', score: 'Vérifié', color: 'emerald', avatar: '🍷' },
                    { name: 'Sushi Lounge Paris', email: 'contact@sushilounge.fr', score: 'Vérifié', color: 'emerald', avatar: '🍱' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/50 transition-colors animate-in fade-in slide-in-from-right-4"
                      style={{ animationDelay: `${300 + i * 100}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                        {row.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-content-primary truncate">{row.name}</div>
                        <div className="text-xs text-content-tertiary font-mono truncate">{row.email}</div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex-shrink-0 ${
                        row.color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {row.score}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-surface-elevated/30">
                  <span className="text-xs text-content-tertiary">+ 229 autres résultats</span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
                    <Download size={12} />
                    Export CSV
                  </div>
                </div>
              </div>

              {/* Floating decorative card "+ 12 found" — visual depth */}
              <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Mail size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-content-tertiary">Emails trouvés</div>
                  <div className="text-lg font-bold text-content-primary tabular-nums">+ 192</div>
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
          Widget interactif — section dédiée propre
          (descendu du hero pour laisser le hero respirer)
       */}
      <section className="relative pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs text-violet-700 font-semibold mb-3">
              <Sparkles size={12} />
              ESSAYEZ EN DIRECT
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-content-primary mb-2">
              Trouvez vos premiers prospects en 10 secondes
            </h2>
            <p className="text-content-tertiary">Aucune inscription requise.</p>
          </div>
          <HeroSearchWidget />
        </div>
      </section>

      {/* Bloc "Pensé pour ces profils" — remplace les anciens chips
          "profils anonymisés". Plus honnête (on ne prétend pas avoir des
          clients qu'on n'a pas), plus utile (lien vers 6 pages persona),
          meilleur SEO (maillage interne /pour/[slug]). */}
      <BuiltForProfilesBlock />

      {/* ──────────────────────────────────────────────────────────────
          LA SUITE VOLIA — 3 modules connectés (positioning hub)
          ─────────────────────────────────────────────────────────────
          Repositionne Volia comme PLATEFORME multi-produits (vs juste
          outil prospection). Pattern HubSpot/Attio. Chaque module a
          sa couleur accent (violet/blue/emerald) + son statut LIVE/
          BETA/SOON pour transparence.
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-zinc-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">La suite Volia</p>
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                3 modules connectés pour automatiser votre growth B2B
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
                Trouvez vos prospects, contactez-les, suivez vos deals.
                Le tout dans une seule plateforme française.
              </p>
            </div>
          </MotionInView>

          {/* 3 product cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
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
                tagline: 'Envoyez vos séquences email & SMS automatisées',
                status: 'BETA',
                statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
                icon: Mail,
                color: 'blue',
                bg: 'from-blue-50 via-white to-cyan-50/50',
                border: 'border-blue-300',
                iconBg: 'from-blue-500 to-cyan-600',
                bullets: [
                  'Email cold + relances auto',
                  'SMS Twilio intégré',
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
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
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
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
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
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-lg" dangerouslySetInnerHTML={{ __html: t('landing.waterfall.title') }} />
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

      {/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
          STATS \u2014 banderole chiffres cl\u00E9s, gros et impactants
       */}
      <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-br from-zinc-50 via-white to-violet-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '150+', label: t('landing.stats.categories'), sub: t('landing.stats.categoriesSub'), color: 'from-violet-600 to-indigo-700' },
              { value: '8', label: t('landing.stats.countries'), sub: '\u{1F1EB}\u{1F1F7} \u{1F1E7}\u{1F1EA} \u{1F1E8}\u{1F1ED} \u{1F1F1}\u{1F1FA} \u{1F1E9}\u{1F1EA} \u{1F1EC}\u{1F1E7} \u{1F1EA}\u{1F1F8} \u{1F1EE}\u{1F1F9}', color: 'from-indigo-600 to-blue-700' },
              { value: '2', label: t('landing.stats.sources'), sub: t('landing.stats.sourcesSub'), color: 'from-blue-600 to-cyan-700' },
              { value: '49\u20AC', label: t('landing.stats.vs'), sub: t('landing.stats.vsSub'), color: 'from-emerald-600 to-teal-700' },
            ].map((stat, i) => (
              <MotionInView key={stat.label} delay={i * 100}>
                <div className="text-5xl sm:text-6xl lg:text-7xl font-bold font-mono bg-gradient-to-br ${stat.color} bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
                  <span className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>{stat.value}</span>
                </div>
                <div className="text-sm font-semibold text-content-primary mt-3">{stat.label}</div>
                <div className="text-[10px] text-content-tertiary mt-1">{stat.sub}</div>
              </MotionInView>
            ))}
          </div>
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
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

      {/* Full Competitor Comparison */}
      <section id="vs-concurrence" className="py-28 px-4 sm:px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">{t('landing.competition.label')}</p>
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                {t('landing.competition.title')}
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t('landing.competition.desc') }} />
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
                      <td className="py-4 px-4 text-content-secondary font-semibold">Ticket d'entrée</td>
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

          {/* Economic argument */}
          <div className="mt-10 p-6 rounded-2xl border border-green-500/20 bg-green-500/[0.04]">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('landing.competition.calcTitle')}</h3>
                <p className="text-sm text-content-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.competition.calcDesc') }} />
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section id="pricing" className="py-28 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-violet-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <MotionInView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-violet-600 mb-3 uppercase tracking-wider">{t('landing.pricing.label')}</p>
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                {t('landing.pricing.title')}
              </h2>
              <p className="text-content-tertiary text-lg max-w-2xl mx-auto mb-6">
                {t('landing.pricing.desc')}
              </p>
            {/* Banderole économies vs concurrents */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <TrendingDown size={14} />
              Économisez jusqu'à <strong className="font-bold">80 €/mois</strong> vs Apollo, <strong className="font-bold">30 €/mois</strong> vs Hunter
            </div>

            {/* Toggle Monthly / Yearly */}
            <div className="inline-flex items-center gap-2 p-1 rounded-xl border border-line bg-surface-elevated/40">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  !isYearly ? 'bg-surface-elevated text-content-primary' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  isYearly ? 'bg-surface-elevated text-content-primary' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                {t('landing.pricing.yearly')}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {t('landing.pricing.savePercent')}
                </span>
              </button>
            </div>
            </div>
          </MotionInView>

          {/* 4 cards : Starter / Solo / Pro (recommended) / Business */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Starter (free) */}
            <PricingCard
              plan={PLANS.free}
              tagline={t('landing.pricing.freeTagline')}
              features={PLAN_FEATURES.free}
              cta={t('landing.pricing.startFree')}
              ctaHref="/signup"
              isYearly={isYearly}
              t={t}
            />

            {/* Solo (cheapest paid) */}
            <PricingCard
              plan={PLANS.solo}
              tagline={t('landing.pricing.soloTagline')}
              features={PLAN_FEATURES.solo}
              cta={t('landing.pricing.chooseSolo')}
              ctaHref={`/signup?plan=solo&period=${pricingPeriod}`}
              badge={{ label: t('landing.pricing.cheapest'), icon: TrendingDown, color: 'emerald' }}
              isYearly={isYearly}
              t={t}
            />

            {/* Pro (recommended) */}
            <PricingCard
              plan={PLANS.pro}
              tagline={t('landing.pricing.proTagline')}
              features={PLAN_FEATURES.pro}
              cta={t('landing.pricing.choosePro')}
              ctaHref={`/signup?plan=pro&period=${pricingPeriod}`}
              highlighted
              badge={{ label: t('landing.pricing.mostPopular'), icon: Crown, color: 'violet' }}
              isYearly={isYearly}
              t={t}
            />

            {/* Business */}
            <PricingCard
              plan={PLANS.business}
              tagline={t('landing.pricing.businessTagline')}
              features={PLAN_FEATURES.business}
              cta={t('landing.pricing.chooseBusiness')}
              ctaHref={`/signup?plan=business&period=${pricingPeriod}`}
              isYearly={isYearly}
              t={t}
            />

          </div>

          {/* Footer note */}
          <p className="mt-10 text-center text-sm text-content-tertiary">
            {isYearly ? t('landing.pricing.yearlySave') : (
              <>
                {t('landing.pricing.questions')}{' '}
                <a href="mailto:hello@volia.fr" className="text-violet-400 hover:underline">
                  {t('landing.pricing.contactSupport')}
                </a>
              </>
            )}
          </p>
        </div>
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

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
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
          </div>

          {/* Trust signal final */}
          <p className="text-xs text-content-tertiary">
            Sans carte bancaire · 100 prospects gratuits · Annulation en 1 clic
          </p>
        </MotionInView>
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
                <li><Link href="#pricing" className="text-content-tertiary hover:text-violet-400 transition">Tarifs</Link></li>
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
            <div className="flex items-center gap-6 text-xs text-content-tertiary">
              <Link href="/cgu" className="hover:text-content-secondary transition">{t('landing.footer.cgu')}</Link>
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
