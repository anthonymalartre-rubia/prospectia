import Link from 'next/link';
import { Check, X, Zap, ArrowRight, TrendingDown, Award, Shield, Globe } from 'lucide-react';

/**
 * Reusable component for /vs/[competitor] comparison pages.
 * High-intent SEO pages targeting users comparing tools.
 */
export default function CompetitorVsPage({ competitor }) {
  // Comparison criteria — fixed list of features
  const comparison = [
    { feature: 'Prix mensuel', prospectia: '49€', competitor: `${competitor.pricing}${competitor.pricingUnit}`, prospectiaWins: true },
    { feature: 'Recherches illimitées', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Pas de crédits cachés', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Couverture PME françaises', prospectia: '85%', competitor: '30%', prospectiaWins: true },
    { feature: 'Google Places intégré', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Scraping intelligent', prospectia: true, competitor: competitor.slug === 'snov', prospectiaWins: competitor.slug !== 'snov' },
    { feature: 'Recherche par catégorie & département', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Découverte automatique de domaine', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Scoring de confiance IA', prospectia: true, competitor: competitor.slug === 'apollo', prospectiaWins: competitor.slug !== 'apollo' },
    { feature: 'Vérification SMTP (MillionVerifier)', prospectia: true, competitor: true, prospectiaWins: null },
    { feature: 'Export CSV illimité', prospectia: true, competitor: competitor.slug === 'snov', prospectiaWins: competitor.slug !== 'snov' },
    { feature: 'Interface 100% en français', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Conforme RGPD (opt-out auto)', prospectia: true, competitor: false, prospectiaWins: true },
    { feature: 'Support client français', prospectia: true, competitor: false, prospectiaWins: true },
  ];

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white overflow-hidden">
      {/* Nav */}
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
            <Award size={12} />
            Comparatif 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Prospectia vs {competitor.name} : lequel choisir ?
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto mb-8">
            {competitor.description} <strong className="text-white">Prospectia est l&apos;alternative française à {competitor.name}</strong> :
            prospects illimités, scraping intelligent, prix 50% moins cher, et meilleure couverture des PME françaises.
          </p>

          {/* Quick verdict */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30 text-sm">
            <TrendingDown size={16} className="text-green-400" />
            <span className="text-zinc-300">
              <strong className="text-green-400">Économisez jusqu&apos;à {Math.round((competitor.pricing - 49) / competitor.pricing * 100)}%</strong> en passant à Prospectia
            </span>
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            Comparatif détaillé
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Critère</th>
                    <th className="text-center p-4 text-sm font-bold text-violet-400">Prospectia</th>
                    <th className="text-center p-4 text-sm font-bold text-zinc-300">{competitor.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      <td className="p-4 text-sm text-zinc-300">{row.feature}</td>
                      <td className="p-4 text-center text-sm">
                        {row.prospectia === true ? (
                          <Check size={18} className="text-green-400 mx-auto" />
                        ) : row.prospectia === false ? (
                          <X size={18} className="text-red-400 mx-auto" />
                        ) : (
                          <span className={`font-semibold ${row.prospectiaWins ? 'text-green-400' : 'text-zinc-300'}`}>
                            {row.prospectia}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm">
                        {row.competitor === true ? (
                          <Check size={18} className="text-zinc-500 mx-auto" />
                        ) : row.competitor === false ? (
                          <X size={18} className="text-red-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-400">{row.competitor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Strengths/Weaknesses competitor */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            {competitor.name} : forces et faiblesses
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <Check size={18} /> Ce qui est bien
              </h3>
              <ul className="space-y-2">
                {competitor.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <X size={18} /> Ce qui pose problème
              </h3>
              <ul className="space-y-2">
                {competitor.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Why Prospectia is better */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Pourquoi choisir Prospectia plutôt que {competitor.name} ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <TrendingDown size={18} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {Math.round((competitor.pricing - 49) / competitor.pricing * 100)}% moins cher
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Prospectia coûte 49€/mois pour des prospects illimités. {competitor.name} coûte {competitor.pricing}{competitor.pricingUnit} avec des crédits limités.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Globe size={18} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Meilleur sur la France</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {competitor.name} est optimisé pour les USA. Nous, on combine scraping de sites français + Google Places + recherche Google pour 85% de couverture en France.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Shield size={18} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">RGPD natif</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Conforme RGPD : opt-out automatique, filtrage des emails personnels, page publique d&apos;opposition. {competitor.name} est outil US, configuration RGPD manuelle.
              </p>
            </div>
          </div>
        </section>

        {/* When to use which */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Lequel choisir selon votre profil ?
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-5">
              <h3 className="font-semibold text-violet-400 mb-2">✅ Choisissez Prospectia si :</h3>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Vous prospectez en France (PME, commerces locaux, artisans)</li>
                <li>• Vous voulez un prix fixe sans crédits cachés</li>
                <li>• Vous avez besoin de recherche par catégorie + département</li>
                <li>• Vous voulez une interface française et un support local</li>
                <li>• Vous voulez un export CSV sans limite, compatible avec n'importe quel CRM</li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-500/20 bg-zinc-500/[0.04] p-5">
              <h3 className="font-semibold text-zinc-400 mb-2">Choisissez {competitor.name} si :</h3>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• {competitor.bestFor}</li>
                <li>• Vous prospectez majoritairement aux USA/UK</li>
                <li>• Vous avez besoin d&apos;intégrations Salesforce/HubSpot avancées</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Essayez Prospectia gratuitement
            </h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              7 jours d&apos;essai gratuit. Aucune carte bancaire requise. Comparez vous-même les résultats avec {competitor.name}.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30"
            >
              <Zap size={16} />
              Démarrer maintenant
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">© 2026 Prospectia.cloud</div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <Link href="/cgu" className="hover:text-zinc-300 transition">CGU</Link>
            <Link href="/confidentialite" className="hover:text-zinc-300 transition">Confidentialité</Link>
            <Link href="/rgpd" className="hover:text-zinc-300 transition">RGPD</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
