import Link from 'next/link';
import { Search, MapPin, Mail, Phone, Globe, CheckCircle2, ArrowRight, Zap, Shield, TrendingUp, Clock } from 'lucide-react';

// SVG LinkedIn inline (pas dispo dans cette version de lucide-react)
function LinkedinIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  );
}
import { getBuildDateFr, getBuildMonthFr } from '@/lib/buildDate';
import {
  MarketSizeBlock, KpiBlock, PersonaBlock, SeasonalityBlock, BestApproachBlock,
  PitchBlock, ObjectionBlock, GlossaryBlock, PainPointsBlock, TopRegionsBlock,
  DeptContextBlock, RegionContextBlock, DeptOverviewBlock, SiblingCitiesBlock,
  SocialProofBlock, CompetitorInlineBlock, AuthoritiesBlock,
  TrustBadgesBlock, DemoCtaBlock, SamplePreviewBlock, DensityChartBlock,
} from './ProspectionContentBlocks';
import { LeadMagnetBlock, StickyCtaBar, StickyTOC } from './ProspectionClientBlocks';

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
  // ── Enrichissement contenu unique ──
  categoryData = null,   // depuis category-data.js (persona, KPIs, pitch...)
  deptData = null,       // depuis dept-data.js (combinaison cat × dept)
  regionData = null,     // depuis region-data.js (combinaison cat × région)
  region = null,         // { slug, name }
  // ── Pour pages dept-only (sans catégorie) : vue d'ensemble du territoire ──
  deptOverviewCategories = null, // [{ label, href }] catégories phares du dept
  // ── Pour pages /[cat]/ville/[city] : autres villes du même dept ──
  siblingCities = null, // [{ slug, name, pop }] villes du même dept (toutes, current incluse)
  currentCitySlug = null,
  // ── DensityChart : { items: [{ label, value }], scopeLabel: "par région" } ──
  densityChart = null,
  // ── Pays cible (pour adapter copy et CTAs) ──
  country = 'fr', // 'fr' | 'be'
}) {
  // Copy adaptable par pays
  const countryCopy = {
    fr: {
      heroDefault: 'Prospection B2B France',
      areaShort: 'France',
      footerCopy: 'Prospection B2B en France',
    },
    be: {
      heroDefault: 'Prospection B2B Belgique francophone',
      areaShort: 'Belgique francophone',
      footerCopy: 'Prospection B2B en Belgique francophone',
    },
    ch: {
      heroDefault: 'Prospection B2B Suisse romande',
      areaShort: 'Suisse romande',
      footerCopy: 'Prospection B2B en Suisse romande',
    },
  }[country] || { heroDefault: 'Prospection B2B', areaShort: 'France', footerCopy: 'Prospection B2B' };

  const heroBadge = department && category
    ? `${category.labelCapitalized} • ${department.name}`
    : department
    ? `Tous les secteurs • ${department.name}`
    : category
    ? category.labelPlural
    : countryCopy.heroDefault;

  // Sections pour le sommaire ancré (sticky TOC). Filtre celles qui n'apparaîtront pas.
  const tocSections = [
    category && { id: 'apercu', label: 'Aperçu produit' },
    categoryData?.kpis?.length && { id: 'chiffres-cles', label: 'Chiffres clés' },
    categoryData?.persona && { id: 'persona', label: 'Qui contacter' },
    categoryData?.seasonality && { id: 'saisonnalite', label: 'Saisonnalité' },
    categoryData?.pitchHook && { id: 'pitch', label: 'Pitch type' },
    densityChart?.items?.length && { id: 'repartition', label: 'Répartition' },
    category && { id: 'comparatif', label: 'vs Apollo / Hunter' },
    categoryData?.objections?.length && { id: 'objections', label: 'Objections' },
    categoryData?.glossary?.length && { id: 'lexique', label: 'Lexique' },
    { id: 'demo', label: 'Réserver une démo' },
    faq?.length > 0 && { id: 'faq', label: 'Questions fréquentes' },
  ].filter(Boolean);

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

          <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mb-4">
            {intro}
          </p>

          {/* Fraîcheur : date mise à jour (Google adore + lecteur rassuré) */}
          <p className="text-xs text-zinc-500 mb-8 flex items-center gap-1.5">
            <Clock size={11} className="text-zinc-400" />
            Données et tarifs mis à jour le <strong className="text-zinc-300 font-medium">{getBuildDateFr()}</strong>
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Search} label="Entreprises" value={stats.total} color="text-violet-400" />
            <StatCard icon={Mail} label="Avec email" value={stats.withEmail} color="text-green-400" />
            <StatCard icon={Phone} label="Avec téléphone" value={stats.withPhone} color="text-blue-400" />
            <StatCard icon={CheckCircle2} label="Note moyenne" value={`${stats.avgRating}/5`} color="text-amber-400" />
          </div>
        </section>

        {/* Trust badges juste après les stats — rassure avant le scroll */}
        <TrustBadgesBlock />

        {/* Social proof juste après les stats — moment de confiance */}
        <SocialProofBlock department={department} region={region} category={category} />

        {/* Sample preview produit (5 entreprises anonymisées) — pousse signup */}
        <div id="apercu" className="scroll-mt-24">
          {category && <SamplePreviewBlock category={category} department={department} stats={stats} />}
        </div>

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

        {/* ───── Contenu enrichi data-driven ──────────── */}
        {/* Affiché uniquement si categoryData fourni : pages /[cat], /[cat]/[dept], /[cat]/region/[r], /[cat]/ville/[v] */}

        {/* Taille du marché */}
        <MarketSizeBlock data={categoryData} category={category} />

        {/* Pages /dept/[slug] sans catégorie : vue d'ensemble territoriale */}
        {!category && deptData && (
          <DeptOverviewBlock
            deptData={deptData}
            dept={department}
            popularCategories={deptOverviewCategories || []}
          />
        )}

        {/* Context géo (uniquement sur les pages avec catégorie + dept ou region) */}
        {category && <DeptContextBlock deptData={deptData} dept={department} category={category} />}
        {category && <RegionContextBlock regionData={regionData} region={region} category={category} />}

        {/* KPIs sectoriels */}
        <div id="chiffres-cles" className="scroll-mt-24">
          <KpiBlock data={categoryData} category={category} />
        </div>

        {/* Persona */}
        <div id="persona" className="scroll-mt-24">
          <PersonaBlock data={categoryData} category={category} />
        </div>

        {/* Pain points */}
        <PainPointsBlock data={categoryData} category={category} />

        {/* Saisonnalité */}
        <div id="saisonnalite" className="scroll-mt-24">
          <SeasonalityBlock data={categoryData} category={category} />
        </div>

        {/* Best approach */}
        <BestApproachBlock data={categoryData} category={category} />

        {/* Pitch hook */}
        <div id="pitch" className="scroll-mt-24">
          <PitchBlock data={categoryData} category={category} />
        </div>

        {/* Density chart : répartition territoriale (top régions/dépts/villes) */}
        {densityChart?.items?.length > 0 && (
          <div id="repartition" className="scroll-mt-24">
            <DensityChartBlock category={category} items={densityChart.items} scopeLabel={densityChart.scopeLabel} />
          </div>
        )}

        {/* Lead magnet contextuel (capture email — milieu de page, le hot spot) */}
        {category && <LeadMagnetBlock category={category} />}

        {/* Comparatif vs Apollo/Hunter — différenciation visuelle */}
        <div id="comparatif" className="scroll-mt-24">
          {category && <CompetitorInlineBlock category={category} />}
        </div>

        {/* Objections */}
        <div id="objections" className="scroll-mt-24">
          <ObjectionBlock data={categoryData} category={category} />
        </div>

        {/* Top régions (seulement sur les pages catégorie nationales — pas si déjà sur une page geo) */}
        {!department && !region && <TopRegionsBlock data={categoryData} category={category} />}

        {/* Autres villes du même dept (uniquement sur pages /[cat]/ville/[city]) */}
        {siblingCities?.length > 0 && category && (
          <SiblingCitiesBlock cities={siblingCities} category={category} currentCitySlug={currentCitySlug} />
        )}

        {/* Glossaire métier */}
        <div id="lexique" className="scroll-mt-24">
          <GlossaryBlock data={categoryData} category={category} />
        </div>

        {/* Sources & cadre légal (E-E-A-T : liens autoritaires INSEE, CNIL...) */}
        <AuthoritiesBlock category={category} />

        {/* Demo CTA — alternative au signup pour les indécis */}
        <div id="demo" className="scroll-mt-24">
          <DemoCtaBlock category={category} />
        </div>

        {/* FAQ */}
        {faq.length > 0 && (
          <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-24">
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
              Prospectia trouve les entreprises et leurs emails partout en France. Gratuit pour commencer · à partir de 19 €/mois — le ticket d&apos;entrée le moins cher du marché français.
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

      {/* Footer renforcé : 4 colonnes + trust strip + social */}
      <footer className="border-t border-white/[0.06] mt-16 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-1.5">
                  <span className="text-[11px] font-bold text-white">P</span>
                </div>
                <span className="text-base font-bold">Prospectia</span>
                <span className="text-violet-400 text-xs font-semibold">.cloud</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                Agrégateur de prospection B2B. 150 secteurs, 101 départements français, cascade waterfall 70-85 % de couverture email.
              </p>
              <a href="https://www.linkedin.com/company/prospectia" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-300 transition">
                <LinkedinIcon size={12} />
                LinkedIn
              </a>
            </div>

            {/* Produit */}
            <div>
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Produit</div>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard" className="text-zinc-400 hover:text-violet-300 transition">Dashboard</Link></li>
                <li><Link href="/#pricing" className="text-zinc-400 hover:text-violet-300 transition">Tarifs</Link></li>
                <li><Link href="/api-docs" className="text-zinc-400 hover:text-violet-300 transition">API publique</Link></li>
                <li><Link href="/prospection" className="text-zinc-400 hover:text-violet-300 transition">France · tous les secteurs</Link></li>
                <li><Link href="/prospection-be" className="text-zinc-400 hover:text-violet-300 transition">🇧🇪 Belgique francophone</Link></li>
                <li><Link href="/prospection-ch" className="text-zinc-400 hover:text-violet-300 transition">🇨🇭 Suisse romande</Link></li>
                <li><Link href="/pour/sdr" className="text-zinc-400 hover:text-violet-300 transition">Pour SDR</Link></li>
                <li><Link href="/pour/fondateurs" className="text-zinc-400 hover:text-violet-300 transition">Pour fondateurs</Link></li>
                <li><Link href="/pour/agences-web" className="text-zinc-400 hover:text-violet-300 transition">Pour agences web</Link></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Ressources</div>
              <ul className="space-y-2 text-xs">
                <li><Link href="/blog" className="text-zinc-400 hover:text-violet-300 transition">Blog</Link></li>
                <li><Link href="/ressources" className="text-zinc-400 hover:text-violet-300 transition">Lead magnets</Link></li>
                <li><Link href="/glossaire" className="text-zinc-400 hover:text-violet-300 transition">Glossaire</Link></li>
                <li><Link href="/comparatif-outils-prospection-b2b-france" className="text-zinc-400 hover:text-violet-300 transition">Comparatif outils</Link></li>
                <li><Link href="/etude/prospection-b2b-france-2026" className="text-zinc-400 hover:text-violet-300 transition">Étude marché 2026</Link></li>
                <li><Link href="/newsletter" className="text-zinc-400 hover:text-violet-300 transition">📬 Newsletter mensuelle</Link></li>
                <li><Link href="/parrainage" className="text-zinc-400 hover:text-violet-300 transition">🎁 Parrainage</Link></li>
                <li><Link href="/changelog" className="text-zinc-400 hover:text-violet-300 transition">📋 Changelog</Link></li>
                <li><Link href="/status" className="text-zinc-400 hover:text-violet-300 transition">⚡ Status</Link></li>
              </ul>
            </div>

            {/* Société + Légal */}
            <div>
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Société & légal</div>
              <ul className="space-y-2 text-xs">
                <li><Link href="/cgu" className="text-zinc-400 hover:text-violet-300 transition">CGU</Link></li>
                <li><Link href="/confidentialite" className="text-zinc-400 hover:text-violet-300 transition">Confidentialité</Link></li>
                <li><Link href="/rgpd" className="text-zinc-400 hover:text-violet-300 transition">Droits RGPD</Link></li>
                <li><Link href="/opt-out" className="text-zinc-400 hover:text-violet-300 transition">Opt-out / désinscription</Link></li>
                <li><a href="mailto:hello@prospectia.cloud" className="text-zinc-400 hover:text-violet-300 transition">hello@prospectia.cloud</a></li>
              </ul>
            </div>
          </div>

          {/* Trust strip + copyright */}
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Shield size={11} className="text-emerald-400" /> RGPD compliant
              </span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-blue-400" /> Paiement Stripe
              </span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1.5">
                🇫🇷 Made in France
              </span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-violet-400" /> Next.js + Supabase + Vercel
              </span>
            </div>
            <div className="text-[11px] text-zinc-600">
              © 2026 Prospectia.cloud — {countryCopy.footerCopy} · Édité par Suraya, France
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA bottom bar — apparaît après scroll, contextualisé */}
      <StickyCtaBar category={category} department={department} region={region} stats={stats} />

      {/* Sticky TOC (desktop only) — sommaire ancré + scroll-spy */}
      <StickyTOC sections={tocSections} />
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
