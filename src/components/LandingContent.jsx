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
        ? 'border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-[#111114]/80'
        : 'border border-white/[0.06] bg-[#111114]/80'
    }`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-semibold rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap ${badgeColors[badge.color] || badgeColors.violet}`}>
          {badge.icon && <badge.icon size={11} />}
          {badge.label}
        </div>
      )}

      <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
      <p className="text-xs text-zinc-500 mb-5 min-h-[32px]">{tagline}</p>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-bold">{formatPrice(price)}<span className="text-2xl text-zinc-400">&euro;</span></span>
        <span className="text-zinc-600 text-sm">{isYearly ? t('landing.pricing.perYear') : t('landing.pricing.perMonth')}</span>
      </div>
      {isYearly && !isFree && (
        <p className="text-[11px] text-emerald-400 font-medium mb-5">
          ~{Math.round(plan.priceYearly / 1200)}&euro;/mois en facturation annuelle
        </p>
      )}
      {!isYearly && !isFree && (
        <p className="text-[11px] text-zinc-500 mb-5">
          ou {formatPrice(plan.priceYearly)}&euro;/an ({t('landing.pricing.savePercent')})
        </p>
      )}
      {isFree && <p className="mb-5">&nbsp;</p>}

      <Link
        href={ctaHref}
        className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition mb-6 ${
          highlighted
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
            : 'border border-white/[0.1] hover:bg-white/[0.05] text-zinc-300'
        }`}
      >
        {cta}{highlighted ? ' →' : ''}
      </Link>

      <div className="space-y-2.5">
        {(Array.isArray(features) ? features : []).map((f) => (
          <div key={f} className="flex items-start gap-2">
            <Check size={15} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-zinc-400 leading-relaxed">{f}</span>
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
    <div className="dark min-h-screen bg-[#08080c] text-white overflow-hidden" style={{'--c-bg-base':'9 9 11','--c-bg-card':'17 17 20','--c-bg-elevated':'30 30 36','--c-bg-alt':'13 13 16','--c-border':'30 30 36','--c-border-hover':'39 39 42','--c-text-primary':'250 250 250','--c-text-secondary':'161 161 170','--c-text-tertiary':'113 113 122','--c-text-muted':'82 82 91','--c-text-faint':'63 63 70'}}>
      {/* Navigation */}
      <header>
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-1.5">
              <span className="text-[11px] font-bold text-white">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Prospectia</span>
            <span className="text-violet-400 text-xs font-semibold">.ai</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="#features" className="text-sm text-zinc-500 hover:text-white transition">{t('landing.nav.features')}</Link>
            <Link href="/prospection" className="text-sm text-zinc-500 hover:text-white transition">Prospection</Link>
            <Link href="#pricing" className="text-sm text-zinc-500 hover:text-white transition">{t('landing.nav.pricing')}</Link>
            <Link href="/blog" className="text-sm text-zinc-500 hover:text-white transition">Blog</Link>
            <Link href="#faq" className="text-sm text-zinc-500 hover:text-white transition">{t('landing.nav.faq')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <NavAuth />
          </div>
        </div>
      </nav>
      </header>

      <main>
      {/* Hero — version simplifiée avec widget interactif */}
      <section className="relative pt-20 sm:pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-[10%] w-72 h-72 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 left-[5%] w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge "Le moins cher" — claim accrocheur */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-violet-500/15 border border-emerald-500/30 text-xs text-emerald-300 mb-6 backdrop-blur-sm font-medium">
            <TrendingDown size={12} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">LE MOINS CHER DU MARCHÉ FRANÇAIS</span>
            <span className="text-zinc-500">·</span>
            <span>À partir de 19 €/mois</span>
          </div>

          {/* H1 simplifié — direct */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">Trouvez l&apos;email de</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              n&apos;importe quelle entreprise
            </span>
          </h1>

          {/* Sous-titre orienté économies — message "le moins cher du marché" */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Scraping intelligent + recherche Google. <strong className="text-white">150+ secteurs, 101 départements.</strong>
          </p>
          {/* Banderole de prix — argument de vente principal */}
          <div className="inline-flex items-center flex-wrap justify-center gap-x-3 gap-y-2 mb-8 text-sm">
            <span className="text-emerald-400 font-semibold">À partir de 19 €/mois</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">vs Hunter 49 €</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">vs Apollo 99 $</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">vs Lemlist 39 €</span>
          </div>

          {/* Widget de recherche fonctionnel */}
          <div className="max-w-3xl mx-auto text-left">
            <HeroSearchWidget />
          </div>

          {/* Social proof rapide */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Aucune carte bancaire requise
            </span>
            <span>·</span>
            <span>7 jours d&apos;essai gratuit</span>
            <span>·</span>
            <span>Conforme RGPD</span>
          </div>
        </div>
      </section>

      {/* Bloc "Pensé pour ces profils" — remplace les anciens chips
          "profils anonymisés". Plus honnête (on ne prétend pas avoir des
          clients qu'on n'a pas), plus utile (lien vers 6 pages persona),
          meilleur SEO (maillage interne /pour/[slug]). */}
      <BuiltForProfilesBlock />

      {/* Why an aggregator */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.why.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.why.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t('landing.why.desc') }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#111114]/80 text-center">
              <div className="text-5xl font-bold font-mono bg-gradient-to-b from-red-400 to-red-600 bg-clip-text text-transparent mb-2">~40%</div>
              <p className="text-sm text-zinc-500" dangerouslySetInnerHTML={{ __html: t('landing.why.stat1Label') }} />
            </div>
            <div className="p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent text-center">
              <div className="text-5xl font-bold font-mono bg-gradient-to-b from-violet-400 to-violet-600 bg-clip-text text-transparent mb-2">~85%</div>
              <p className="text-sm text-zinc-500" dangerouslySetInnerHTML={{ __html: t('landing.why.stat2Label') }} />
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#111114]/80 text-center">
              <div className="text-5xl font-bold font-mono bg-gradient-to-b from-green-400 to-green-600 bg-clip-text text-transparent mb-2">-80%</div>
              <p className="text-sm text-zinc-500" dangerouslySetInnerHTML={{ __html: t('landing.why.stat3Label') }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.features.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              {t('landing.features.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: t('landing.features.waterfall'),
                desc: t('landing.features.waterfallDesc'),
                gradient: 'from-violet-500/20 to-indigo-500/20',
                iconBg: 'from-violet-500 to-indigo-600',
              },
              {
                icon: Brain,
                title: t('landing.features.ai'),
                desc: t('landing.features.aiDesc'),
                gradient: 'from-indigo-500/20 to-blue-500/20',
                iconBg: 'from-indigo-500 to-blue-600',
              },
              {
                icon: BarChart3,
                title: t('landing.features.scoring'),
                desc: t('landing.features.scoringDesc'),
                gradient: 'from-blue-500/20 to-cyan-500/20',
                iconBg: 'from-blue-500 to-cyan-600',
              },
              {
                icon: Database,
                title: t('landing.features.categories'),
                desc: t('landing.features.categoriesDesc'),
                gradient: 'from-cyan-500/20 to-teal-500/20',
                iconBg: 'from-cyan-500 to-teal-600',
              },
              {
                icon: Globe,
                title: t('landing.features.departments'),
                desc: t('landing.features.departmentsDesc'),
                gradient: 'from-teal-500/20 to-green-500/20',
                iconBg: 'from-teal-500 to-green-600',
              },
              {
                icon: Download,
                title: t('landing.features.exportFeature'),
                desc: t('landing.features.exportDesc'),
                gradient: 'from-green-500/20 to-emerald-500/20',
                iconBg: 'from-green-500 to-emerald-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="group relative p-6 rounded-2xl border border-white/[0.06] bg-[#111114]/80 backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.howItWorks.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              {t('landing.howItWorks.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Search,
                title: t('landing.howItWorks.step1'),
                desc: t('landing.howItWorks.step1Desc'),
                gradient: 'from-violet-500 to-indigo-600',
              },
              {
                step: '02',
                icon: Zap,
                title: t('landing.howItWorks.step2'),
                desc: t('landing.howItWorks.step2Desc'),
                gradient: 'from-indigo-500 to-blue-600',
              },
              {
                step: '03',
                icon: Download,
                title: t('landing.howItWorks.step3'),
                desc: t('landing.howItWorks.step3Desc'),
                gradient: 'from-blue-500 to-cyan-600',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <item.icon size={20} className="text-white" />
                  </div>
                  <span className="text-4xl font-bold font-mono text-white/10">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waterfall visual */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.waterfall.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-lg" dangerouslySetInnerHTML={{ __html: t('landing.waterfall.title') }} />
            <p className="text-zinc-500 text-lg max-w-xl" dangerouslySetInnerHTML={{ __html: t('landing.waterfall.desc') }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { name: 'Decouverte domaine', desc: 'Pas de site web ? On le trouve via Google.', tag: 'Auto', score: '100%', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20', dot: 'bg-blue-400' },
              { name: 'Scraping site web', desc: 'Extrait les emails du site, pages contact et mentions legales.', tag: t('landing.waterfall.free'), score: '100%', color: 'from-green-500/20 to-emerald-500/20 border-green-500/20', dot: 'bg-green-400' },
              { name: 'Recherche Google', desc: 'Cherche l\'email sur Google si le scraping ne trouve rien.', tag: 'Inclus', score: '90%', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20', dot: 'bg-yellow-400' },
            ].map((s, i) => (
              <div key={s.name} className={`relative p-5 rounded-xl bg-gradient-to-br ${s.color} border border-white/[0.06]`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-[10px] font-mono text-zinc-500">0{i + 1}</span>
                </div>
                <h4 className="text-base font-semibold mb-1">{s.name}</h4>
                <p className="text-xs text-zinc-500 mb-2">{s.desc}</p>
                <span className="text-[10px] text-zinc-400 font-medium">{s.tag}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-600 mt-6">
            {t('landing.waterfall.stopsFirst')}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '150+', label: t('landing.stats.categories'), sub: t('landing.stats.categoriesSub') },
              { value: '8', label: t('landing.stats.countries'), sub: '\u{1F1EB}\u{1F1F7} \u{1F1E7}\u{1F1EA} \u{1F1E8}\u{1F1ED} \u{1F1F1}\u{1F1FA} \u{1F1E9}\u{1F1EA} \u{1F1EC}\u{1F1E7} \u{1F1EA}\u{1F1F8} \u{1F1EE}\u{1F1F9}' },
              { value: '2', label: t('landing.stats.sources'), sub: t('landing.stats.sourcesSub') },
              { value: '49\u20AC', label: t('landing.stats.vs'), sub: t('landing.stats.vsSub') },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-bold font-mono bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-zinc-400 mt-2">{stat.label}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Verification Feature */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
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
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.emailVerif.desc') }} />

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
                      <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right -- Visual mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c12] p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Mail size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t('landing.emailVerif.mockTitle')}</div>
                      <div className="text-[10px] text-zinc-600">{t('landing.emailVerif.mockImported')}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-600 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">{t('landing.emailVerif.mockCsvDone')}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">{t('landing.emailVerif.progress')}</span>
                    <span className="text-emerald-400 font-mono">100%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{width: '100%'}} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: t('landing.emailVerif.valid'), value: '2 103', pct: '73.8%', color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: t('landing.emailVerif.invalid'), value: '412', pct: '14.5%', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: t('landing.emailVerif.catchAll'), value: '281', pct: '9.9%', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: t('landing.emailVerif.unknown'), value: '51', pct: '1.8%', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} border border-white/[0.04] text-center`}>
                      <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">{stat.label}</div>
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
                    { email: 'contact@hotel-riviera.fr', status: t('landing.emailVerif.catchAll'), color: 'text-amber-400', dot: 'bg-amber-400' },
                  ].map((row) => (
                    <div key={row.email} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-xs text-zinc-400 font-mono">{row.email}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                        <span className={`text-[10px] font-medium ${row.color}`}>{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-zinc-600">{t('landing.emailVerif.cost')}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{t('landing.emailVerif.exportValid')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Competitor Comparison */}
      <section id="vs-concurrence" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.competition.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.competition.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t('landing.competition.desc') }} />
          </div>

          <div className="p-1 rounded-2xl bg-gradient-to-b from-violet-500/20 to-transparent">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0c0c12] border border-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-4 px-4 font-medium text-zinc-600 min-w-[140px]"></th>
                      <th className="text-center py-4 px-4 min-w-[120px]">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <TrendingDown size={10} /> Le moins cher
                        </div>
                        <div className="font-bold text-violet-400 text-base">Prospectia</div>
                        <div className="text-violet-400/60 text-xs mt-0.5">dès 19&euro;/{t('landing.competition.month')}</div>
                      </th>
                      {COMPETITORS.map((c) => (
                        <th key={c.name} className="text-center py-4 px-4 font-medium text-zinc-600 min-w-[100px]">
                          <div>{c.name}</div>
                          <div className="text-zinc-700 text-xs mt-0.5">dès {c.entryPrice}/{t('landing.competition.month')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: t('landing.competition.enrichSources'), prospectia: t('landing.competition.sevenSources'), key: 'enrichments' },
                      { label: t('landing.competition.confidenceScoring'), prospectia: true, key: 'scoring' },
                      { label: t('landing.competition.aiSearch'), prospectia: true, key: 'ai' },
                      { label: t('landing.competition.deptsFR'), prospectia: true, key: 'depts' },
                      { label: t('landing.competition.b2bCategories'), prospectia: '150+', key: 'categories' },
                      { label: t('landing.competition.googlePlaces'), prospectia: true, key: 'google', competitors: [false, false, false, false, false] },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-white/[0.04]">
                        <td className="py-3.5 px-4 text-zinc-400">{row.label}</td>
                        <td className="py-3.5 px-4 text-center">
                          {typeof row.prospectia === 'boolean' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20">
                              <Check size={14} className="text-violet-400" />
                            </span>
                          ) : (
                            <span className="font-semibold text-white">{row.prospectia}</span>
                          )}
                        </td>
                        {COMPETITORS.map((c) => {
                          const val = row.competitors ? row.competitors[COMPETITORS.indexOf(c)] : c[row.key];
                          return (
                            <td key={c.name} className="py-3.5 px-4 text-center">
                              {typeof val === 'boolean' ? (
                                val ? <Check size={14} className="text-zinc-500 mx-auto" /> : <X size={14} className="text-zinc-800 mx-auto" />
                              ) : (
                                <span className="text-zinc-600">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Price rows : Entry tier (Solo) + Pro tier */}
                    <tr className="border-t-2 border-white/[0.08]">
                      <td className="py-4 px-4 text-zinc-300 font-semibold">Ticket d'entrée</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-emerald-400">19&euro;</span>
                        <div className="text-[10px] text-emerald-400/60 mt-0.5 uppercase tracking-wider font-bold">Solo</div>
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-4 px-4 text-center">
                          <span className="text-lg text-zinc-600">{c.entryPrice}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-white/[0.04]">
                      <td className="py-4 px-4 text-zinc-300 font-semibold">Plan Pro</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-violet-400">49&euro;</span>
                        <div className="text-[10px] text-violet-400/60 mt-0.5 uppercase tracking-wider font-bold">Recommandé</div>
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-4 px-4 text-center">
                          <span className="text-lg text-zinc-600">{c.proPrice}</span>
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
                <p className="text-sm text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.competition.calcDesc') }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      {/* Testimonials — rassure avant la décision d'achat */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <TestimonialsBlock />
      </section>

      {/* Lead magnet teaser — capture les hésitants sur le PDF gratuit */}
      <section className="py-12 px-4 sm:px-6">
        <ResourceTeaserBlock
          title="Pas prêt à signer ? Récupérez 20 templates cold email B2B"
          subtitle="PDF 30 pages : intros qui taquinent, lignes d'objet à fort taux d'ouverture, séquences en 3 touches. Testé sur 50 000 envois."
        />
      </section>

      <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.pricing.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto mb-6">
              {t('landing.pricing.desc')}
            </p>
            {/* Banderole économies vs concurrents */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <TrendingDown size={14} />
              Économisez jusqu'à <strong className="font-bold">80 €/mois</strong> vs Apollo, <strong className="font-bold">30 €/mois</strong> vs Hunter
            </div>

            {/* Toggle Monthly / Yearly */}
            <div className="inline-flex items-center gap-2 p-1 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  !isYearly ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  isYearly ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t('landing.pricing.yearly')}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {t('landing.pricing.savePercent')}
                </span>
              </button>
            </div>
          </div>

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
          <p className="mt-10 text-center text-sm text-zinc-500">
            {isYearly ? t('landing.pricing.yearlySave') : (
              <>
                {t('landing.pricing.questions')}{' '}
                <a href="mailto:hello@prospectia.cloud" className="text-violet-400 hover:underline">
                  {t('landing.pricing.contactSupport')}
                </a>
              </>
            )}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section className="relative py-28 px-4 sm:px-6 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.08] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-zinc-500 text-lg mb-3 max-w-xl mx-auto">
            {t('landing.cta.desc')}
          </p>
          <p className="text-sm text-violet-400 font-semibold mb-8">
            {t('landing.cta.sub')}
          </p>
          <FooterCTA />
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* SEO link clusters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-white/[0.06]">
            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Produit</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-zinc-500 hover:text-violet-400 transition">Accueil</Link></li>
                <li><Link href="/signup" className="text-zinc-500 hover:text-violet-400 transition">Inscription</Link></li>
                <li><Link href="/login" className="text-zinc-500 hover:text-violet-400 transition">Connexion</Link></li>
                <li><Link href="#pricing" className="text-zinc-500 hover:text-violet-400 transition">Tarifs</Link></li>
              </ul>
            </div>

            {/* Comparatifs */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Comparatifs</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/vs/apollo" className="text-zinc-500 hover:text-violet-400 transition">vs Apollo.io</Link></li>
                <li><Link href="/vs/hunter" className="text-zinc-500 hover:text-violet-400 transition">vs Hunter.io</Link></li>
                <li><Link href="/vs/lusha" className="text-zinc-500 hover:text-violet-400 transition">vs Lusha</Link></li>
                <li><Link href="/vs/snov" className="text-zinc-500 hover:text-violet-400 transition">vs Snov.io</Link></li>
              </ul>
            </div>

            {/* Prospection populaires */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Prospection</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/prospection" className="text-zinc-500 hover:text-violet-400 transition">Tous secteurs</Link></li>
                <li><Link href="/prospection/restaurant" className="text-zinc-500 hover:text-violet-400 transition">Restaurants</Link></li>
                <li><Link href="/prospection/hotel" className="text-zinc-500 hover:text-violet-400 transition">Hôtels</Link></li>
                <li><Link href="/prospection/avocat" className="text-zinc-500 hover:text-violet-400 transition">Avocats</Link></li>
                <li><Link href="/prospection/dept/75-paris" className="text-zinc-500 hover:text-violet-400 transition">Paris (75)</Link></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Ressources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="text-zinc-500 hover:text-violet-400 transition">Blog</Link></li>
                <li><Link href="/guide" className="text-zinc-500 hover:text-violet-400 transition">Guides sectoriels</Link></li>
                <li><Link href="/glossaire" className="text-zinc-500 hover:text-violet-400 transition">Glossaire B2B</Link></li>
                <li><Link href="/blog/rgpd-prospection-b2b" className="text-zinc-500 hover:text-violet-400 transition">Guide RGPD</Link></li>
                <li><Link href="/blog/cold-emailing-2026" className="text-zinc-500 hover:text-violet-400 transition">Cold emailing 2026</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom legal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">P</span>
              </div>
              <span className="text-sm font-bold tracking-tight">Prospectia</span>
              <span className="text-violet-400 text-[10px] font-semibold">.cloud</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-600">
              <Link href="/cgu" className="hover:text-zinc-400 transition">{t('landing.footer.cgu')}</Link>
              <Link href="/confidentialite" className="hover:text-zinc-400 transition">{t('landing.footer.privacy')}</Link>
              <Link href="/rgpd" className="hover:text-zinc-400 transition">{t('landing.footer.gdpr')}</Link>
              <Link href="/opt-out" className="hover:text-zinc-400 transition">{t('landing.footer.optOut')}</Link>
            </div>
            <p className="text-[11px] text-zinc-700">
              &copy; 2026 Prospectia.cloud
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
