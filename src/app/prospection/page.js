import Link from 'next/link';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { getAllCategories, getAllDepartments } from '@/lib/slugs';
import { B2B_GROUPS } from '@/lib/constants';

export const metadata = {
  title: 'Prospection B2B France — 150 secteurs × 101 départements',
  description: 'Trouvez les emails B2B de toutes les entreprises françaises par secteur d\'activité et département. Restaurants, hôtels, avocats, garages, commerces — 15 000+ pages de prospection disponibles.',
  alternates: { canonical: 'https://prospectia.cloud/prospection' },
  openGraph: {
    title: 'Prospection B2B France — Toutes catégories et départements',
    description: 'Trouvez les emails B2B de n\'importe quelle entreprise française. 150 secteurs × 101 départements.',
    url: 'https://prospectia.cloud/prospection',
  },
};

export default function ProspectionIndexPage() {
  const categories = getAllCategories();
  const departments = getAllDepartments();
  const groupedCategories = B2B_GROUPS;

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white overflow-hidden">
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
            <Search size={12} />
            Prospection B2B France
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Trouvez les emails B2B de toutes les entreprises françaises
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
            Prospectia couvre <strong className="text-white">150 secteurs d&apos;activité</strong> dans les <strong className="text-white">101 départements français</strong>. Explorez par catégorie ou par département pour trouver les emails professionnels de vos prospects.
          </p>
        </section>

        {/* Categories grouped */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Explorer par secteur d&apos;activité</h2>
          <div className="space-y-8">
            {Object.entries(groupedCategories).map(([group, cats]) => {
              const groupCats = categories.filter((c) => c.group === group);
              if (groupCats.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                    {group}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {groupCats.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/prospection/${cat.slug}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 text-sm text-zinc-300 hover:text-white transition"
                      >
                        <ArrowRight size={12} className="text-violet-400 flex-shrink-0" />
                        <span className="truncate">{cat.labelCapitalized}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Departments */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Explorer par département</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {departments.map((dept) => (
              <Link
                key={dept.slug}
                href={`/prospection/dept/${dept.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 text-sm text-zinc-300 hover:text-white transition"
              >
                <MapPin size={12} className="text-violet-400 flex-shrink-0" />
                <span className="truncate">{dept.code} · {dept.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Prêt à prospecter ?</h2>
            <p className="text-zinc-400 mb-6">Accédez à tous les emails B2B en quelques clics. 49€/mois, prospects illimités.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30"
            >
              Démarrer gratuitement
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
          </div>
        </div>
      </footer>
    </div>
  );
}
