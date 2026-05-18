import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, Tag } from 'lucide-react';
import { getAllGuides } from '@/lib/guides';
import { breadcrumbSchema } from '@/lib/seo-helpers';

export const metadata = {
  title: 'Guides complets de prospection B2B par secteur — Prospectia',
  description: 'Guides longs (4000+ mots) pour prospecter efficacement chaque secteur : restaurants, BTP, avocats, immobilier, commerces locaux. Méthodes testées et chiffres réels.',
  alternates: { canonical: 'https://prospectia.cloud/guide' },
  openGraph: {
    title: 'Guides Prospection B2B',
    description: 'Guides sectoriels complets pour prospecter en France.',
    url: 'https://prospectia.cloud/guide',
  },
};

export default function GuideIndex() {
  const guides = getAllGuides();
  const breadcrumbs = [{ label: 'Accueil', href: '/' }, { label: 'Guides' }];
  const jsonLd = breadcrumbSchema(breadcrumbs);

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
            <BookOpen size={12} />
            Guides Prospectia
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Guides complets prospection B2B
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Guides longs et opérationnels pour chaque secteur. Méthodes testées, chiffres réels, templates inclus. De quoi prospecter sérieusement.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guide/${guide.slug}`}
                className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30 transition p-6 group"
              >
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{guide.sector}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {guide.readTime} min
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-violet-400 transition">
                  {guide.title}
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{guide.description}</p>
                <div className="flex items-center gap-2 text-sm text-violet-400 font-semibold">
                  Lire le guide
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
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
