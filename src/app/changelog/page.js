import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Wrench, Shield, Calendar } from 'lucide-react';
import { getAllChangelogEntries } from '@/lib/changelog';
import { breadcrumbSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://prospectia.cloud';

export const metadata = {
  title: 'Changelog Prospectia — Toutes les nouveautés du produit',
  description: 'L\'historique complet des évolutions de Prospectia : nouvelles fonctionnalités, améliorations, correctifs, mises à jour SEO. Transparence totale sur le développement.',
  alternates: { canonical: `${SITE_URL}/changelog` },
  openGraph: {
    title: 'Changelog Prospectia',
    description: 'Toutes les nouveautés du produit, mises à jour transparentes.',
    url: `${SITE_URL}/changelog`,
  },
};

const TYPE_META = {
  feature: { icon: Sparkles, label: 'Nouveau', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  improvement: { icon: CheckCircle2, label: 'Amélioré', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  fix: { icon: Wrench, label: 'Corrigé', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  security: { icon: Shield, label: 'Sécurité', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function ChangelogPage() {
  const entries = getAllChangelogEntries();

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Changelog' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Changelog Prospectia',
    description: 'Historique des évolutions du produit Prospectia',
    url: `${SITE_URL}/changelog`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="dark min-h-screen bg-[#08080c] text-white">
        <nav className="fixed top-0 w-full z-50 bg-[#08080c]/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
              <ArrowLeft size={14} />
              Prospectia
            </Link>
            <Link href="/signup" className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition">
              Essayer gratuitement
            </Link>
          </div>
        </nav>

        <main className="pt-24 pb-16">
          <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4">
              <Sparkles size={12} />
              Changelog public
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Tout ce qu&apos;on a livré récemment
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
              Prospectia est en développement continu. Ici la liste exhaustive des releases — features, améliorations et corrections. Transparence totale.
            </p>
          </section>

          {/* Timeline */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="space-y-12">
              {entries.map((entry) => (
                <article key={entry.version} className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-xs font-bold text-violet-300">
                      v{entry.version}
                    </div>
                    <span className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
                      <Calendar size={11} />
                      {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">{entry.title}</h2>

                  {/* Items */}
                  <ul className="space-y-2.5">
                    {entry.items.map((item, i) => {
                      const meta = TYPE_META[item.type] || TYPE_META.improvement;
                      const Icon = meta.icon;
                      return (
                        <li key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${meta.bg} flex-shrink-0`}>
                            <Icon size={12} className={meta.color} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                                {meta.label}
                              </span>
                              {item.tag && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 font-medium">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-200 leading-relaxed">{item.text}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-16">
            <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Une feature à suggérer ?</h2>
              <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
                On lit chaque demande. Écrivez-nous à <a href="mailto:hello@prospectia.cloud" className="text-violet-300 hover:underline">hello@prospectia.cloud</a> ou rejoignez la newsletter pour suivre les prochaines releases.
              </p>
              <Link href="/newsletter" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30">
                <Sparkles size={16} />
                S&apos;inscrire à la newsletter
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-zinc-500">
            <span>© 2026 Prospectia.cloud</span>
            <div className="flex gap-4">
              <Link href="/status" className="hover:text-zinc-300">Status</Link>
              <Link href="/cgu" className="hover:text-zinc-300">CGU</Link>
              <Link href="/rgpd" className="hover:text-zinc-300">RGPD</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
