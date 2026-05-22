import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, Users, Mail, Phone, Globe, Shield, Zap } from 'lucide-react';
import { getAllCategories } from '@/lib/slugs';
import { getAllProvincesBE } from '@/lib/slugs-be';
import { breadcrumbSchema } from '@/lib/seo-helpers';
import { B2B_GROUPS } from '@/lib/constants';

const SITE_URL = 'https://prospectia.cloud';

export const metadata = {
  title: 'Prospection B2B Belgique francophone — Prospectia',
  description: 'Trouvez les emails B2B des entreprises de Wallonie et Bruxelles. 150 secteurs couverts, 6 provinces francophones. À partir de 19 €/mois — le ticket d\'entrée le moins cher du marché.',
  alternates: {
    canonical: `${SITE_URL}/prospection-be`,
    languages: {
      'fr-FR': `${SITE_URL}/prospection`,
      'fr-BE': `${SITE_URL}/prospection-be`,
      'fr-CH': `${SITE_URL}/prospection-ch`,
      'x-default': `${SITE_URL}/prospection`,
    },
  },
  openGraph: {
    title: 'Prospectia Belgique — Prospection B2B Wallonie & Bruxelles',
    description: '150 secteurs, 6 provinces francophones, scraping intelligent + recherche Google. À partir de 19 €/mois.',
    url: `${SITE_URL}/prospection-be`,
  },
};

export default function ProspectionBeHub() {
  const allCats = getAllCategories();
  const allProvinces = getAllProvincesBE();
  const groups = Object.entries(B2B_GROUPS);

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Prospection B2B Belgique' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'WebPage',
        name: 'Prospection B2B Belgique francophone',
        description: 'Hub pour la prospection B2B en Wallonie et Bruxelles',
        url: `${SITE_URL}/prospection-be`,
        inLanguage: 'fr-BE',
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
              <Link href="/signup" className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
            <nav className="text-xs text-zinc-500 flex items-center gap-2" aria-label="Fil d'Ariane">
              {breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-2">
                  {bc.href ? <Link href={bc.href} className="hover:text-violet-400 transition">{bc.label}</Link> : <span className="text-zinc-300">{bc.label}</span>}
                  {i < breadcrumbs.length - 1 && <span>›</span>}
                </span>
              ))}
            </nav>
          </div>

          {/* Hero */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
              <MapPin size={12} />
              🇧🇪 Belgique francophone · Wallonie & Bruxelles
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Trouvez les emails B2B des entreprises belges francophones
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mb-6">
              Prospectia couvre <strong className="text-white">6 provinces francophones de Belgique</strong> (Wallonie + Bruxelles-Capitale) et <strong className="text-white">150 secteurs d&apos;activité</strong>. Recherche d&apos;entreprises via Google Places + enrichissement email automatique (taux de couverture 70-85 %). Conforme RGPD européen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20">
                <Zap size={16} />
                Essayer gratuitement
              </Link>
            </div>
          </section>

          {/* Stats */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={MapPin} label="Provinces" value="6" color="text-violet-400" />
              <StatCard icon={Users} label="Secteurs" value="150+" color="text-green-400" />
              <StatCard icon={Mail} label="Taux email" value="70-85%" color="text-blue-400" />
              <StatCard icon={Shield} label="RGPD" value="✓" color="text-amber-400" />
            </div>
          </section>

          {/* Provinces */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Explorer par province</h2>
            <p className="text-sm text-zinc-400 mb-6">
              6 provinces francophones couvertes. Cliquez pour découvrir le tissu B2B local.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allProvinces.map((p) => (
                <Link
                  key={p.code}
                  href={`/prospection-be/province/${p.slug}`}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-violet-500/30 hover:bg-violet-500/[0.05] transition"
                >
                  <div className="font-semibold text-zinc-100 group-hover:text-white transition mb-1">{p.name}</div>
                  <div className="text-xs text-zinc-500 group-hover:text-violet-300 transition flex items-center gap-1">
                    Explorer <ArrowRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Catégories par groupe */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Explorer par secteur d&apos;activité</h2>
            <p className="text-sm text-zinc-400 mb-8">
              150 catégories couvertes en Belgique. Les liens pointent vers les pages catégorie nationales BE.
            </p>
            <div className="space-y-8">
              {groups.map(([groupName, cats]) => (
                <div key={groupName}>
                  <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">{groupName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cats.map((label) => {
                      const cat = allCats.find((c) => c.label === label);
                      if (!cat) return null;
                      return (
                        <Link
                          key={cat.slug}
                          href={`/prospection-be/${cat.slug}`}
                          className="group rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/[0.04] p-2.5 transition flex items-center gap-2"
                        >
                          <ArrowRight size={11} className="text-violet-400 flex-shrink-0" />
                          <span className="text-xs text-zinc-200 group-hover:text-white transition truncate">{cat.labelCapitalized}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Prospectez en Belgique dès aujourd&apos;hui</h2>
              <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
                Plan Starter gratuit à vie. 100 prospects offerts chaque mois sans carte bancaire. À partir de 19 €/mois pour 1 000 prospects.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30">
                <Zap size={16} />
                Démarrer gratuitement
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] py-8 mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>© 2026 Prospectia.cloud · <Link href="/prospection" className="hover:text-violet-300">Voir la France</Link></div>
            <div className="flex gap-4">
              <Link href="/cgu" className="hover:text-zinc-300">CGU</Link>
              <Link href="/confidentialite" className="hover:text-zinc-300">Confidentialité</Link>
              <Link href="/rgpd" className="hover:text-zinc-300">RGPD</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <Icon size={20} className={`${color} mb-2`} />
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}
