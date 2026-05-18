'use client';

import { lazy, Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Zap, Search, Mail, MapPin, Shield, Layers, Download, Crown, Star, Tag, Brain, TrendingDown, Database, X, Globe, BarChart3 } from 'lucide-react';
import { NavAuth, HeroCTA, FooterCTA } from '@/components/AuthCTA';
import { PLANS } from '@/lib/plans';
import FAQSection from '@/components/FAQSection';
import TypewriterText from '@/components/TypewriterText';
import { useI18n } from '@/lib/i18n';

// Lazy-load heavy components (canvas + demo)
const MouseParticles = lazy(() => import('@/components/MouseParticles'));
const InteractiveDemo = lazy(() => import('@/components/InteractiveDemo'));

function formatPrice(cents) {
  if (cents === 0) return '0';
  return Math.round(cents / 100).toString();
}

export default function LandingContent() {
  const { t } = useI18n();

  function formatLimit(value) {
    if (value === -1) return t('landing.unlimited');
    return value.toLocaleString('fr-FR');
  }

  const PLAN_FEATURES = {
    free: t('landing.planFeatures.free'),
    pro: t('landing.planFeatures.pro'),
    enterprise: t('landing.planFeatures.enterprise'),
  };

  const COMPETITORS = [
    { name: 'Apollo.io', price: '99', enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '~30' },
    { name: 'Hunter.io', price: '49', enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
    { name: 'Lusha', price: '36', enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
    { name: 'Snov.io', price: '39', enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '~20' },
    { name: 'Dropcontact', price: '24', enrichments: '1 source', scoring: false, ai: false, depts: false, categories: '0' },
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
      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Interactive particle background */}
        <Suspense fallback={null}><MouseParticles /></Suspense>
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-[5%] w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-zinc-400 mb-8 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('landing.hero.badge')}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 sm:mb-8">
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">{t('landing.hero.title')}</span>
            <br />
            <TypewriterText />
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.hero.subtitle') }} />
          <p className="text-sm text-violet-400 font-semibold mb-10">
            {t('landing.hero.price')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <HeroCTA />
            <Link
              href="#vs-concurrence"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1"
            >
              {t('landing.hero.compare')}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Source logos ribbon */}
          <div className="mt-14 flex items-center justify-center gap-6 flex-wrap">
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider">{t('landing.hero.sourcesLabel')}</span>
            {['Google Places', 'Scraping web', 'Recherche Google'].map((s) => (
              <span key={s} className="text-xs text-zinc-500 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <Suspense fallback={null}><InteractiveDemo /></Suspense>

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
                        <div className="font-bold text-violet-400 text-base">Prospectia</div>
                        <div className="text-violet-400/60 text-xs mt-0.5">49&euro;/{t('landing.competition.month')}</div>
                      </th>
                      {COMPETITORS.map((c) => (
                        <th key={c.name} className="text-center py-4 px-4 font-medium text-zinc-600 min-w-[100px]">
                          <div>{c.name}</div>
                          <div className="text-zinc-700 text-xs mt-0.5">{c.price}&euro;/{t('landing.competition.month')}</div>
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
                      { label: t('landing.competition.exportZoho'), prospectia: true, key: 'zoho', competitors: [false, false, false, false, false] },
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
                    {/* Price row highlighted */}
                    <tr className="border-t-2 border-white/[0.08]">
                      <td className="py-4 px-4 text-zinc-300 font-semibold">{t('landing.competition.monthlyPrice')}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-violet-400">49&euro;</span>
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c.name} className="py-4 px-4 text-center">
                          <span className="text-lg text-zinc-600">{c.price}&euro;</span>
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
      <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-400 mb-3">{t('landing.pricing.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              {t('landing.pricing.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#111114]/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-1">{PLANS.free.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">{t('landing.pricing.starterDesc')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{formatPrice(PLANS.free.price)}&euro;</span>
                <span className="text-zinc-600 text-sm">{t('landing.pricing.perMonth')}</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl border border-white/[0.1] hover:bg-white/[0.05] transition mb-8 text-zinc-300"
              >
                {t('landing.pricing.startFree')}
              </Link>
              <div className="space-y-3">
                {(Array.isArray(PLAN_FEATURES.free) ? PLAN_FEATURES.free : []).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro -- Recommended */}
            <div className="relative p-8 rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-[#111114]/80 backdrop-blur-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-violet-500/20 flex items-center gap-1.5">
                <Crown size={12} />
                {t('landing.pricing.popular')}
              </div>
              <h3 className="text-lg font-semibold mb-1">{PLANS.pro.name}</h3>
              <p className="text-sm text-zinc-500 mb-2">{t('landing.pricing.proDesc')}</p>
              <p className="text-xs text-green-400 font-medium mb-4">{t('landing.pricing.proCheaper')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{formatPrice(PLANS.pro.price)}&euro;</span>
                <span className="text-zinc-600 text-sm">{t('landing.pricing.perMonth')}</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-500/20 mb-8"
              >
                {t('landing.pricing.choosePro')} &rarr;
              </Link>
              <div className="space-y-3">
                {(Array.isArray(PLAN_FEATURES.pro) ? PLAN_FEATURES.pro : []).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#111114]/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-1">{PLANS.enterprise.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">{t('landing.pricing.enterpriseDesc')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{formatPrice(PLANS.enterprise.price)}&euro;</span>
                <span className="text-zinc-600 text-sm">{t('landing.pricing.perMonth')}</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl border border-white/[0.1] hover:bg-white/[0.05] transition mb-8 text-zinc-300"
              >
                {t('landing.pricing.contactTeam')}
              </Link>
              <div className="space-y-3">
                {(Array.isArray(PLAN_FEATURES.enterprise) ? PLAN_FEATURES.enterprise : []).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
