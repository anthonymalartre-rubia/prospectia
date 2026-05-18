import Link from 'next/link';
import { Search, MapPin, Mail, Phone, Globe, CheckCircle2, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

/**
 * Reusable component for programmatic SEO pages.
 * Renders a server-component-friendly layout with:
 * - H1 + description ciblée mot-clé
 * - Stats / chiffres
 * - FAQ
 * - CTA signup
 * - Schema.org JSON-LD
 */
export default function ProspectionSeoPage({
  // Content
  title,           // H1 main title
  metaTitle,       // <title> tag
  metaDescription,
  intro,           // First paragraph after H1
  category,        // Category info { slug, label, labelCapitalized, labelPlural, group } or null
  department,      // Department info { code, slug, name, region } or null
  // Stats (mocked)
  stats = { total: '1 250', avgRating: 4.2, withEmail: '78%', withPhone: '92%' },
  // FAQ items
  faq = [],
  // Related links
  relatedCategories = [],
  relatedDepartments = [],
  // Breadcrumbs
  breadcrumbs = [],
}) {
  const heroBadge = department && category
    ? `${category.labelCapitalized} • ${department.name}`
    : department
    ? `Tous les secteurs • ${department.name}`
    : category
    ? category.labelPlural
    : 'Prospection B2B France';

  return (
    <div className="dark min-h-screen bg-[#08080c] text-white overflow-hidden">
      {/* Top nav minimaliste */}
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
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
            <nav className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap" aria-label="Fil d'Ariane">
              {breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-2">
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-violet-400 transition">{bc.label}</Link>
                  ) : (
                    <span className="text-zinc-300">{bc.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span>›</span>}
                </span>
              ))}
            </nav>
          </div>
        )}

        <article>
        {/* Hero / H1 */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
            <MapPin size={12} />
            {heroBadge}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            {title}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mb-8">
            {intro}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/20"
            >
              <Zap size={16} />
              Essayer gratuitement
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold transition"
            >
              Comment ça marche
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Stats grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Search} label="Entreprises" value={stats.total} color="text-violet-400" />
            <StatCard icon={Mail} label="Avec email" value={stats.withEmail} color="text-green-400" />
            <StatCard icon={Phone} label="Avec téléphone" value={stats.withPhone} color="text-blue-400" />
            <StatCard icon={CheckCircle2} label="Note moyenne" value={`${stats.avgRating}/5`} color="text-amber-400" />
          </div>
        </section>

        {/* Why Prospectia (3 features) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Pourquoi utiliser Prospectia ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Search}
              title="Scraping intelligent"
              desc="Notre IA scrape les sites web des entreprises pour extraire automatiquement les emails de contact, même quand ils ne sont pas visibles publiquement."
            />
            <FeatureCard
              icon={Globe}
              title="Recherche Google"
              desc="On combine scraping et recherche Google pour maximiser le taux de découverte. Là où Apollo trouve 40% des emails, on en trouve 70 à 85%."
            />
            <FeatureCard
              icon={Shield}
              title="Conforme RGPD"
              desc="Opt-out automatique, blocage des emails personnels, scoring de confiance. Prospectez sereinement dans le cadre légal européen."
            />
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition"
                >
                  <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                    {item.question}
                    <span className="text-violet-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-zinc-400 mt-3 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related links — internal linking for SEO */}
        {(relatedCategories.length > 0 || relatedDepartments.length > 0) && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              {relatedCategories.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                    Autres secteurs {department ? `à ${department.name}` : ''}
                  </h2>
                  <ul className="space-y-2">
                    {relatedCategories.slice(0, 12).map((rc, i) => (
                      <li key={i}>
                        <Link
                          href={rc.href}
                          className="text-sm text-zinc-400 hover:text-violet-400 transition flex items-center gap-2"
                        >
                          <ArrowRight size={12} />
                          {rc.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {relatedDepartments.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                    {category ? `${category.labelPlural} dans d'autres départements` : 'Autres départements'}
                  </h2>
                  <ul className="space-y-2">
                    {relatedDepartments.slice(0, 12).map((rd, i) => (
                      <li key={i}>
                        <Link
                          href={rd.href}
                          className="text-sm text-zinc-400 hover:text-violet-400 transition flex items-center gap-2"
                        >
                          <ArrowRight size={12} />
                          {rd.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Bonus content cluster — internal linking massif */}
        {(category || department) && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                Ressources prospection B2B
              </h2>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <Link href="/blog/trouver-email-entreprise-france" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Comment trouver l&apos;email d&apos;une entreprise
                </Link>
                <Link href="/blog/rgpd-prospection-b2b" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Guide RGPD pour la prospection B2B
                </Link>
                <Link href="/blog/cold-emailing-2026" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Cold emailing en 2026 : ce qui marche
                </Link>
                <Link href="/vs/apollo" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Prospectia vs Apollo.io
                </Link>
                <Link href="/vs/hunter" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Prospectia vs Hunter.io
                </Link>
                <Link href="/prospection" className="text-zinc-400 hover:text-violet-400 transition flex items-center gap-2">
                  <ArrowRight size={12} />
                  Tous les secteurs disponibles
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <TrendingUp size={32} className="text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              Trouvez vos prospects en quelques clics
            </h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              Prospectia trouve les emails B2B que vos concurrents ratent. 49€/mois, prospects illimités, scoring IA inclus.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30"
            >
              <Zap size={16} />
              Démarrer gratuitement
            </Link>
            <p className="text-xs text-zinc-500 mt-4">Aucune carte bancaire requise · 7 jours d'essai</p>
          </div>
        </section>
        </article>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-white/[0.06] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">
            © 2026 Prospectia.cloud — Prospection B2B en France
          </div>
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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <Icon size={20} className={`${color} mb-2`} />
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
        <Icon size={18} className="text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}
