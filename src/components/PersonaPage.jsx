import Link from 'next/link';
import { ArrowRight, Check, Zap, AlertTriangle, Target, BarChart3, Shield, Star } from 'lucide-react';
import { TestimonialsBlock, ResourceTeaserBlock, CompetitorMiniBlock } from '@/components/MarketingBlocks';
import { getAllPersonas } from '@/lib/personas';

export default function PersonaPage({ persona }) {
  const otherPersonas = getAllPersonas().filter((p) => p.slug !== persona.slug).slice(0, 5);

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-1.5">
              <span className="text-[11px] font-bold text-white">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Prospectia</span>
            <span className="text-violet-400 text-xs font-semibold">.cloud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">Se connecter</Link>
            <Link href="/signup" className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition">
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
            <Target size={12} />
            {persona.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            {persona.h1}
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mb-8">
            {persona.intro}
          </p>

          {/* Key metric callout */}
          {persona.keyMetric && (
            <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/[0.06] to-indigo-500/[0.06] mb-8">
              <div className="text-4xl font-bold text-violet-300 tabular-nums">{persona.keyMetric.value}</div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">{persona.keyMetric.label}</div>
                <div className="text-xs text-zinc-400">{persona.keyMetric.sub}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20">
              <Zap size={16} />
              {persona.ctaLabel || 'Essayer gratuitement'}
            </Link>
            <Link href="#use-cases" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold transition">
              Voir les cas d&apos;usage
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Pain points */}
        {persona.painPoints?.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle size={22} className="text-amber-400" />
              Les douleurs que vous connaissez
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {persona.painPoints.map((pain, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="text-3xl font-bold text-amber-400 mb-2">{i + 1}.</div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Use cases */}
        {persona.useCases?.length > 0 && (
          <section id="use-cases" className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
              <Target size={22} className="text-violet-400" />
              Comment Prospectia vous aide concrètement
            </h2>
            <p className="text-zinc-400 mb-6 max-w-2xl text-sm">
              4 cas d&apos;usage spécifiques à votre profil — pas du blabla marketing.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {persona.useCases.map((uc, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-violet-300" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-100">{uc.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comparatif inline (réutilisé) */}
        <CompetitorMiniBlock />

        {/* Plan recommandé */}
        {persona.idealPlan && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              Le plan recommandé pour vous
            </h2>
            <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.08] p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-xs font-bold text-white uppercase tracking-wider">
                Recommandé
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Plan {persona.idealPlan.name}</div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold">{persona.idealPlan.price}</span>
                  <span className="text-zinc-400">€/mois</span>
                </div>
                <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">{persona.idealPlan.why}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20">
                    <Zap size={16} />
                    Démarrer ce plan
                  </Link>
                  <Link href="/#pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold transition">
                    Voir les autres plans
                  </Link>
                </div>
                <p className="text-xs text-zinc-500 mt-4">Plan Starter gratuit à vie · sans carte bancaire · 100 prospects/mois</p>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials filtrés sur le secteur de ce persona */}
        <TestimonialsBlock
          sector={persona.testimonialSector}
          limit={3}
          title="Ils vous ressemblent et utilisent Prospectia"
          subtitle="Profils basés sur des feedbacks réels du NPS interne."
        />

        {/* Lead magnet */}
        <ResourceTeaserBlock
          title="20 templates cold email B2B testés sur 50 000 envois"
          subtitle="Téléchargez le PDF gratuit pour démarrer vos campagnes du bon pied (intros, lignes d'objet, séquences en 3 touches)."
        />

        {/* Autres personas — maillage interne */}
        {otherPersonas.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Prospectia, c&apos;est aussi pour…</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {otherPersonas.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pour/${p.slug}`}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/[0.05] p-4 transition"
                >
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{p.badge}</div>
                  <div className="text-sm font-semibold text-zinc-100 group-hover:text-white transition leading-snug">
                    {p.h1.split('—')[0].trim().split('.')[0]}
                  </div>
                  <div className="text-xs text-violet-400 mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    Voir <ArrowRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Prêt à essayer ?</h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              Plan Starter gratuit à vie. 100 prospects offerts chaque mois sans carte bancaire. Démarrez vos campagnes en 5 min.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30">
              <Zap size={16} />
              {persona.ctaLabel || 'Démarrer gratuitement'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>© 2026 Prospectia.cloud</div>
          <div className="flex gap-4">
            <Link href="/cgu" className="hover:text-zinc-300">CGU</Link>
            <Link href="/confidentialite" className="hover:text-zinc-300">Confidentialité</Link>
            <Link href="/rgpd" className="hover:text-zinc-300">RGPD</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
