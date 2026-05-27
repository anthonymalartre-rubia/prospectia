// ─────────────────────────────────────────────────────────────────────
// /produits/crm — landing produit Volia CRM (LIVE — gated Business 99 €)
// ─────────────────────────────────────────────────────────────────────
// Accent : emerald/teal.
// Positionnement : alternative française à HubSpot Starter / Pipedrive /
// Salesforce — natif Volia, inclus dans Business 99 € (vs 90-125 €
// pour HubSpot CRM seul, sans l'enrichment + le sending).
// ─────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Layers, TrendingUp, Check, X, ArrowRight, Zap, Users, Smartphone,
  KanbanSquare, MessageSquare, BarChart3, FileText, Send, Star,
} from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import MotionInView from '@/components/MotionInView';
import { breadcrumbSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/crm`;

export const metadata = {
  title: 'Volia CRM — Alternative française à HubSpot, inclus dans Business 99 €',
  description:
    'HubSpot Starter 90 €. Pipedrive 49 €. Salesforce 125 €. Volia CRM : 0 € de plus si vous êtes en Business. Kanban drag-drop, auto-create deals depuis replies, timeline 360°, intégré nativement à Prospection + Campagnes.',
  alternates: {
    canonical: PAGE_URL,
    languages: {
      'fr-FR': PAGE_URL,
      'en-US': `${SITE_URL}/en/products/crm`,
      'en-GB': `${SITE_URL}/en/products/crm`,
      'x-default': PAGE_URL,
    },
  },
  keywords: [
    'alternative hubspot',
    'alternative hubspot français',
    'crm français pas cher',
    'crm intégré prospection',
    'alternative pipedrive',
    'alternative salesforce',
    'alternative zoho crm',
    'crm kanban drag drop',
    'crm tpe pme france',
    'crm freelance founder',
    'Volia CRM',
  ],
  openGraph: {
    title: 'Volia CRM — Alternative française à HubSpot, inclus dans Business 99 €',
    description:
      'Un CRM intégré à votre Prospection + Campagnes. Pas une intégration. Kanban natif, auto-create deals depuis replies, timeline 360°. 99 €/mois tout inclus vs 270 €+ pour HubSpot + Apollo + Lemlist.',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Mockup hero : pipeline Kanban 5 colonnes (Lead → Closé) avec deals
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const columns = [
    {
      title: 'Lead', count: 14, color: 'zinc', proba: '10%',
      deals: [
        { name: 'La Bonne Table', value: '2 400 €', avatar: '🍽️' },
        { name: 'Pasta Roma', value: '1 800 €', avatar: '🍝' },
      ],
    },
    {
      title: 'Qualifié', count: 8, color: 'blue', proba: '25%',
      deals: [
        { name: 'Hôtel Riviera', value: '4 200 €', avatar: '🏨' },
      ],
    },
    {
      title: 'Démo', count: 5, color: 'violet', proba: '50%',
      deals: [
        { name: 'Sushi Lounge', value: '3 600 €', avatar: '🍱' },
      ],
    },
    {
      title: 'Proposition', count: 3, color: 'amber', proba: '75%',
      deals: [
        { name: 'Agence Pixel', value: '6 900 €', avatar: '🎨' },
      ],
    },
    {
      title: 'Closé', count: 4, color: 'emerald', proba: '100%',
      deals: [
        { name: 'Le Petit Bistrot', value: '5 100 €', avatar: '🍷' },
      ],
    },
  ];

  return (
    <>
      <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 shadow-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-700">Pipeline live</span>
      </div>

      <div className="relative rounded-2xl bg-white border border-line shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="ml-3 text-xs font-mono text-content-tertiary">volia.fr/crm</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 font-semibold">Pipeline Q2</div>
        </div>

        {/* Pipeline stats */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            { label: 'Pipeline pondéré', value: '47 k€', color: 'text-emerald-700' },
            { label: 'Closing rate', value: '21%', color: 'text-teal-700' },
            { label: 'Cycle moyen', value: '18 j', color: 'text-green-700' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Kanban 5 colonnes */}
        <div className="grid grid-cols-5 gap-1.5 p-3 bg-surface-elevated/30">
          {columns.map((col, ci) => (
            <div
              key={col.title}
              className="bg-white rounded-lg border border-line p-1.5 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${300 + ci * 100}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-content-tertiary truncate">{col.title}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  col.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  col.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  col.color === 'violet' ? 'bg-violet-100 text-violet-700' :
                  col.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  'bg-zinc-100 text-zinc-700'
                }`}>{col.count}</span>
              </div>
              <div className="text-[8px] text-content-tertiary px-1 mb-1.5 font-mono">prob. {col.proba}</div>
              <div className="space-y-1">
                {col.deals.map((deal, di) => (
                  <div
                    key={di}
                    className="rounded-md border border-line bg-white p-1.5 shadow-sm hover:shadow transition-shadow cursor-grab"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px]">{deal.avatar}</span>
                      <span className="text-[9px] font-semibold text-content-primary truncate flex-1">{deal.name}</span>
                    </div>
                    <div className="text-[9px] font-mono font-bold text-emerald-700">{deal.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-white">
          <span className="text-xs text-content-tertiary">34 deals actifs</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <TrendingUp size={12} />
            +18% ce mois
          </div>
        </div>
      </div>

      {/* Floating card "Auto-créé depuis reply" */}
      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border-2 border-emerald-200 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 max-w-[240px]">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Reply détecté</div>
          <div className="text-xs font-semibold text-content-primary">Deal auto-créé en Lead</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 2 — Social proof (stats brutes)
// ─────────────────────────────────────────────────────────────────────
function SocialProofSection() {
  const stats = [
    { value: '87%', label: 'des SDR utilisent un CRM', sub: 'pour ne plus perdre de deal (source HubSpot 2024)', color: 'from-emerald-600 via-teal-600 to-emerald-700' },
    { value: '0', label: 'saisie manuelle', sub: 'les hot leads arrivent direct dans le pipeline', color: 'from-teal-600 to-green-700' },
    { value: '5 min', label: 'pour setup Volia CRM', sub: 'vs 2 semaines pour onboarder HubSpot', color: 'from-green-600 to-emerald-700' },
    { value: '90 €', label: '/mois économisés', sub: 'pas de licence HubSpot Starter par-dessus', color: 'from-emerald-700 to-teal-700' },
  ];
  return (
    <section className="relative py-20 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <MotionInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              Pourquoi un CRM intégré change tout
            </span>
          </div>
        </MotionInView>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <MotionInView key={stat.label} delay={i * 100}>
              <div className="group">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold font-mono tabular-nums bg-gradient-to-br ${stat.color} bg-clip-text text-transparent leading-none mb-3 group-hover:scale-105 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-content-primary">{stat.label}</div>
                <div className="text-xs text-content-tertiary mt-1">{stat.sub}</div>
              </div>
            </MotionInView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 3 — Problème / Solution (vrai coût stack vs Volia tout-en-un)
// ─────────────────────────────────────────────────────────────────────
function ProblemSolutionSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-emerald-50/30 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Le vrai coût d&apos;un stack prospection + CRM
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              318 $/mois et toujours du copier-coller.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Le calcul que personne ne fait : ce qu&apos;un setup HubSpot + Apollo + Lemlist + Zapier vous coûte vraiment, vs Volia Business.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
          {/* Colonne AVANT Volia CRM */}
          <MotionInView delay={100}>
            <div className="h-full p-7 sm:p-8 rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md">
                  <X size={20} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-rose-600 font-bold">Avant Volia CRM</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Le stack &quot;tout connecté à la main&quot;</h3>
                </div>
              </div>
              <ul className="space-y-3 mb-5">
                {[
                  { label: 'Apollo (prospection)', price: '99 $/mo' },
                  { label: 'Lemlist (campagnes)', price: '99 $/mo' },
                  { label: 'HubSpot Starter (CRM)', price: '90 $/mo' },
                  { label: 'Zapier (intégration entre les 3)', price: '30 $/mo' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 border-b border-rose-100 last:border-0">
                    <span className="text-sm text-content-secondary">{item.label}</span>
                    <span className="text-sm font-mono font-bold text-rose-700">{item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-rose-200">
                <span className="text-base font-bold text-content-primary">Total mensuel</span>
                <span className="text-2xl font-mono font-bold text-rose-700">318 $/mo</span>
              </div>
              <p className="mt-4 text-sm text-content-tertiary leading-relaxed">
                Et chaque hot lead doit quand même être copié-collé d&apos;un outil à l&apos;autre. Les fenêtres se multiplient, les variables ne mappent jamais pareil, et personne ne sait quel deal est à quel stage.
              </p>
            </div>
          </MotionInView>

          {/* Colonne AVEC Volia */}
          <MotionInView delay={150}>
            <div className="relative h-full p-7 sm:p-8 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 shadow-xl shadow-emerald-500/10">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Recommandé
              </div>
              <div className="flex items-center gap-3 mb-6 mt-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Check size={20} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">Avec Volia Business</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Les 3 modules natifs, 1 facture</h3>
                </div>
              </div>
              <ul className="space-y-3 mb-5">
                {[
                  { label: 'Volia Prospection (101 départements)', price: 'Inclus' },
                  { label: 'Volia Campagnes (séquences + warmup)', price: 'Inclus' },
                  { label: 'Volia CRM (Kanban + auto-create)', price: 'Inclus' },
                  { label: 'Intégrations natives entre les 3 modules', price: 'Inclus' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 border-b border-emerald-100 last:border-0">
                    <span className="text-sm text-content-primary font-medium">{item.label}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-emerald-200">
                <span className="text-base font-bold text-content-primary">Total mensuel</span>
                <span className="text-2xl font-mono font-bold text-emerald-700">99 €/mo</span>
              </div>
              <p className="mt-4 text-sm text-content-secondary leading-relaxed">
                <strong className="text-emerald-700">Zéro saisie manuelle.</strong> Un prospect répond à votre séquence ? Il atterrit automatiquement en colonne Lead du Kanban, historique complet inclus.
              </p>
            </div>
          </MotionInView>
        </div>

        {/* Bottom CTA */}
        <MotionInView delay={300}>
          <div className="mt-12 text-center">
            <Link
              href="/signup?plan=business"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all text-base"
            >
              <Zap size={18} className="text-amber-200" />
              <span>Économisez ~220 $/mois en passant à Business</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-3 text-xs text-content-tertiary">
              99 €/mois tout inclus · Annulation 1 clic · Setup en 5 minutes
            </p>
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 5 — Comparatif tableau HubSpot / Pipedrive / Salesforce / Zoho vs Volia
// ─────────────────────────────────────────────────────────────────────
function ComparisonTableSection() {
  const rows = [
    { feature: 'Kanban pipeline drag-drop', hubspot: 'yes', pipedrive: 'yes', volia: 'best' },
    { feature: 'Auto-create deal depuis email reply', hubspot: 'no', pipedrive: 'no', volia: 'best' },
    { feature: 'Intégré nativement à la prospection', hubspot: 'no', pipedrive: 'no', volia: 'best' },
    { feature: 'Intégré nativement aux campagnes email', hubspot: 'paid', pipedrive: 'zapier', volia: 'best' },
    { feature: 'Timeline 360° par contact', hubspot: 'yes', pipedrive: 'limited', volia: 'best' },
    { feature: 'Pondération auto par stage', hubspot: 'yes', pipedrive: 'yes', volia: 'best' },
    { feature: 'Templates emails inclus', hubspot: 'no', pipedrive: 'no', volia: 'best' },
    { feature: 'Hébergement & support français', hubspot: 'no', pipedrive: 'no', volia: 'best' },
    { feature: 'Setup time', hubspot: '2 semaines', pipedrive: '1 semaine', volia: '5 minutes' },
  ];

  const Cell = ({ value }) => {
    if (value === 'yes') return <Check size={18} className="text-content-tertiary mx-auto" strokeWidth={2.5} />;
    if (value === 'no') return <X size={18} className="text-rose-400 mx-auto" strokeWidth={2.5} />;
    if (value === 'best') return (
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-md">
        <Check size={16} className="text-white" strokeWidth={3} />
      </div>
    );
    if (value === 'paid') return <span className="text-xs text-amber-700 font-semibold">Payant +</span>;
    if (value === 'zapier') return <span className="text-xs text-amber-700 font-semibold">Via Zapier</span>;
    if (value === 'limited') return <span className="text-xs text-amber-700 font-semibold">Limité</span>;
    return <span className="text-xs text-content-secondary font-mono">{value}</span>;
  };

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Comparatif honnête
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              HubSpot, Pipedrive ou Volia ?
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Sur la feature CRM pure, HubSpot et Pipedrive font le job. Sur la suite intégrée prospection + campagnes + CRM,
              <strong className="text-content-primary"> Volia est seul dans sa catégorie</strong>.
            </p>
          </div>
        </MotionInView>

        <MotionInView delay={100}>
          <div className="overflow-x-auto rounded-2xl border-2 border-emerald-200 shadow-xl shadow-emerald-500/10 bg-white">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b-2 border-line bg-gradient-to-r from-emerald-50 to-teal-50">
                  <th className="text-left px-5 py-5 text-sm font-bold text-content-primary">Feature</th>
                  <th className="px-4 py-5 text-center">
                    <div className="text-xs font-bold text-content-secondary">HubSpot</div>
                    <div className="text-xs text-content-tertiary font-mono mt-0.5">Starter — 90 €/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center">
                    <div className="text-xs font-bold text-content-secondary">Pipedrive</div>
                    <div className="text-xs text-content-tertiary font-mono mt-0.5">Essential — 49 €/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center bg-gradient-to-b from-emerald-100 to-emerald-50">
                    <div className="text-xs font-bold text-emerald-800">Volia CRM</div>
                    <div className="text-xs text-emerald-700 font-mono mt-0.5">Business — 99 €/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-4 text-sm text-content-primary font-medium">{row.feature}</td>
                    <td className="px-4 py-4 text-center"><Cell value={row.hubspot} /></td>
                    <td className="px-4 py-4 text-center"><Cell value={row.pipedrive} /></td>
                    <td className="px-4 py-4 text-center bg-emerald-50/40"><Cell value={row.volia} /></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-emerald-200 bg-gradient-to-r from-zinc-50 to-emerald-50/30">
                  <td className="px-5 py-5 text-sm font-bold text-content-primary">Vrai coût pour faire de l&apos;outbound</td>
                  <td className="px-4 py-5 text-center text-xs font-semibold text-rose-700">
                    90 € + Apollo + Lemlist<br /><span className="font-mono text-base text-rose-700">≈ 270 €+/mo</span>
                  </td>
                  <td className="px-4 py-5 text-center text-xs font-semibold text-rose-700">
                    49 € + Apollo + Lemlist<br /><span className="font-mono text-base text-rose-700">≈ 230 €+/mo</span>
                  </td>
                  <td className="px-4 py-5 text-center bg-emerald-50/60">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tout inclus</div>
                    <div className="font-mono text-2xl font-bold text-emerald-700 mt-0.5">99 €/mo</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </MotionInView>

        <MotionInView delay={200}>
          <p className="mt-6 text-center text-xs text-content-tertiary max-w-2xl mx-auto">
            Tarifs publics au {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} —
            Salesforce Essentials 125 €/user/mo et Zoho CRM Standard 49 €/user/mo restent au-dessus du coût Volia tout inclus dès qu&apos;on ajoute l&apos;enrichment et le sending.
          </p>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 6 — Use cases (3 personas)
// ─────────────────────────────────────────────────────────────────────
function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Pour qui c&apos;est fait
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              3 profils qui passent à Volia Business.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Si vous reconnaissez l&apos;un de ces 3 profils, vous économisez du cash et du temps en gardant un CRM intégré plutôt qu&apos;en branchant HubSpot.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1 — Anthony Founder SaaS (featured large) */}
          <MotionInView delay={100} className="lg:col-span-2 lg:row-span-2">
            <div className="group relative h-full p-8 sm:p-10 rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Cas le plus fréquent
              </div>

              <div className="relative">
                <div className="flex items-center gap-4 mb-6 mt-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 ring-white shadow-lg flex items-center justify-center text-white text-xl font-bold">
                    AM
                  </div>
                  <div>
                    <div className="text-lg font-bold text-content-primary">Anthony, Founder SaaS</div>
                    <div className="text-sm text-content-tertiary">solo + 1 freelance commercial · 40 deals actifs</div>
                  </div>
                </div>

                <blockquote className="text-xl sm:text-2xl font-medium text-content-primary leading-snug mb-8">
                  <span className="text-emerald-400 text-3xl leading-none">“</span>
                  Volia CRM remplace HubSpot pour <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">90 €/mois en moins</span>. Et mes hot leads arrivent <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">automatiquement</span> dans le pipeline — plus jamais besoin de fouiller ma boîte mail le lundi matin.
                  <span className="text-emerald-400 text-3xl leading-none">”</span>
                </blockquote>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-200/50">
                  {[
                    { v: '−90 €', l: '/mois vs HubSpot' },
                    { v: '5 min', l: 'pour setup' },
                    { v: '0', l: 'saisie manuelle' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold font-mono bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stat.v}</div>
                      <div className="text-[11px] text-content-tertiary mt-1">{stat.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MotionInView>

          {/* Card 2 — Julie Sales OneWoman */}
          <MotionInView delay={200}>
            <div className="group h-full p-7 rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-white to-green-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-green-600 ring-2 ring-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                  JL
                </div>
                <div>
                  <div className="text-sm font-bold text-content-primary">Julie, Sales OneWoman</div>
                  <div className="text-[11px] text-content-tertiary">agence comm · cycle 18 jours</div>
                </div>
              </div>
              <blockquote className="text-sm text-content-primary leading-relaxed mb-5">
                <span className="text-teal-400">“</span>
                <strong>5 deals/semaine</strong> en stage Démo grâce à l&apos;auto-create depuis les replies. Avant je ratais <span className="font-bold text-emerald-700">30 % des opportunités</span> par oubli de saisie.
                <span className="text-teal-400">”</span>
              </blockquote>
              <div className="flex items-center gap-2 text-[11px] text-teal-700 font-semibold">
                <Users size={12} />
                Solo, gère 80+ leads/mois
              </div>
            </div>
          </MotionInView>

          {/* Card 3 — Karim Petite équipe */}
          <MotionInView delay={300}>
            <div className="group h-full p-7 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                  KB
                </div>
                <div>
                  <div className="text-sm font-bold text-content-primary">Karim, Head of Sales</div>
                  <div className="text-[11px] text-content-tertiary">3 SDR + 1 closeur · 80 deals/mois</div>
                </div>
              </div>
              <blockquote className="text-sm text-content-primary leading-relaxed mb-5">
                <span className="text-green-400">“</span>
                On est 4 dans l&apos;équipe sales. Le CRM Volia nous <strong>suffit largement</strong> pour 80 deals/mois. <span className="font-bold text-emerald-700">Pas besoin de Salesforce</span> à 500 €/mois.
                <span className="text-green-400">”</span>
              </blockquote>
              <div className="flex items-center gap-2 text-[11px] text-green-700 font-semibold">
                <Smartphone size={12} />
                Petite équipe 1-5 personnes
              </div>
            </div>
          </MotionInView>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 7 — Pricing focus CRM (mini)
// ─────────────────────────────────────────────────────────────────────
function PricingFocusBanner() {
  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-7 sm:p-8 shadow-lg">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Layers size={22} className="text-white" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold mb-1">CRM gated Business</div>
          <h4 className="text-xl font-bold text-content-primary">Volia CRM = inclus dans Business 99 €/mois</h4>
          <p className="text-sm text-content-secondary mt-1">Les 3 modules ensemble (Prospection + Campagnes + CRM). Aucun add-on caché, aucune licence par user.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="text-[11px] uppercase tracking-wider text-rose-700 font-bold mb-1">Avec HubSpot Starter</div>
          <div className="text-sm font-bold text-content-primary mb-1">90 € CRM seul</div>
          <div className="text-xs text-content-tertiary">+ Apollo (99 $) + Lemlist (99 $) = <span className="font-mono font-bold text-rose-700">≈ 270 €/mo</span></div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-4">
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold mb-1">Avec Volia Business</div>
          <div className="text-sm font-bold text-content-primary mb-1">CRM + Prospection + Campagnes</div>
          <div className="text-xs text-content-secondary"><span className="font-mono font-bold text-emerald-700">99 €/mo</span> tout inclus, 1 facture</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 8 — Témoignage clé (pull quote intégration)
// ─────────────────────────────────────────────────────────────────────
function PullQuoteSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <MotionInView className="max-w-4xl mx-auto text-center relative z-10">
        <div className="flex justify-center mb-5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
          ))}
        </div>
        <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-content-primary leading-snug tracking-tight mb-8">
          <span className="text-emerald-400 text-5xl leading-none">“</span>
          Avant je payais HubSpot + Apollo + Lemlist et je passais ma semaine sur Zapier à recoller les morceaux. Avec Volia, <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">tout est natif</span>. Un prospect qui répond = un deal créé. Pas une intégration, juste <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">le même produit</span>.
          <span className="text-emerald-400 text-5xl leading-none">”</span>
        </blockquote>
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-white shadow-md flex items-center justify-center text-white text-sm font-bold">
            AM
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-content-primary">Anthony Malartre</div>
            <div className="text-xs text-content-tertiary">Founder, ancien client HubSpot</div>
          </div>
        </div>
      </MotionInView>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'piloter votre pipeline',
  subline: 'Pas un mini-Salesforce. Un CRM léger, natif Volia, déjà connecté à Prospection et Campagnes. 6 features pensées pour les founders et petites équipes sales.',
  items: [
    {
      icon: 'KanbanSquare', featured: true,
      title: 'Kanban drag-drop natif',
      desc: 'Pipeline visuel avec 5 colonnes par défaut (Lead → Qualifié → Démo → Proposition → Closé). Drag pour faire avancer un deal. Stages personnalisables (Q3 2026). Valeur totale du pipeline en temps réel.',
    },
    {
      icon: 'MessageSquare',
      title: 'Auto-create depuis replies',
      desc: 'Un prospect répond à une séquence Volia Campagnes ? Un deal est créé automatiquement au stage Lead avec l\'historique email complet. Plus jamais de copier-coller.',
    },
    {
      icon: 'Users',
      title: 'Timeline 360° par contact',
      desc: 'Toutes les interactions en 1 vue : emails envoyés, ouverts, cliqués, répondus, notes, calls, meetings. Recherche full-text. Pour reprendre une conversation 3 mois après, sans relire 50 mails.',
    },
    {
      icon: 'BarChart3',
      title: 'Pondération automatique',
      desc: 'Chaque stage a sa probabilité de closing (10 % Lead, 25 % Qualifié, 50 % Démo, 75 % Proposition, 100 % Won). Pipeline pondéré et forecast M+1 calculés en live.',
    },
    {
      icon: 'FileText',
      title: 'Activities log',
      desc: 'Notes, appels, meetings, tâches avec due_at, fichiers attachés par deal. Mentionnez un teammate (@) pour partager. Historique horodaté immutable.',
    },
    {
      icon: 'Send', wide: true,
      title: 'Intégration Volia Prospection',
      desc: 'Depuis les résultats d\'une recherche Volia Prospection, bouton "Envoyer au CRM" pour créer un deal directement. Les variables (nom, ville, secteur, téléphone) sont auto-mappées. Aucun export CSV.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'Settings', title: 'Setup en 5 minutes', desc: 'Pipeline par défaut prêt à l\'emploi (5 stages, probabilités préconfigurées). Aucun consultant, aucune visio d\'onboarding, aucun template à choisir.' },
  { icon: 'MessageSquare', title: 'Les deals arrivent tout seuls', desc: 'Chaque reply positif à une séquence Campagnes crée un deal en colonne Lead avec l\'historique complet. Vous ne loupez plus aucune opportunité.' },
  { icon: 'TrendingUp', title: 'Pilotez jusqu\'au closing', desc: 'Drag & drop des deals d\'étape en étape. Notes, calls, fichiers par deal. Forecast pondéré, closing rate et cycle moyen calculés en live.' },
];

const FAQ = [
  {
    q: 'Quels sont les stages du pipeline par défaut ?',
    a: '5 stages préconfigurés avec leur probabilité : Lead (10 %), Qualifié (25 %), Démo (50 %), Proposition (75 %), Closé (100 %). Vous avez aussi un stage Lost pour archiver les deals perdus avec un motif (pas de budget, concurrent, timing, etc.). Le pipeline pondéré et le forecast M+1 sont recalculés à chaque déplacement de deal.',
  },
  {
    q: 'Puis-je créer mes propres stages personnalisés ?',
    a: 'Pas tout de suite — c\'est sur la roadmap Q3 2026. À court terme on a fait le choix d\'imposer un pipeline standard pour que la beta soit utilisable en 5 minutes sans configuration. Les custom pipelines arriveront avec un éditeur visuel (drag pour réordonner les stages, slider pour la probabilité, couleur par colonne).',
  },
  {
    q: 'Comment se fait exactement l\'auto-create depuis replies ?',
    a: 'Volia Campagnes détecte les réponses positives sur vos séquences (Reply Intent classification via Claude). Dès qu\'un prospect répond, un deal est créé dans le CRM en colonne Lead avec : contact complet, historique des emails envoyés/ouverts/cliqués, contenu intégral de la réponse, et tag automatique avec le nom de la séquence d\'origine. Aucune action manuelle.',
  },
  {
    q: 'Quelle différence concrète avec le CRM HubSpot gratuit ?',
    a: 'HubSpot CRM gratuit a Kanban + timeline, ok. Mais : (1) pour faire de l\'outbound vous devez ajouter HubSpot Marketing Hub (45 €/mo minimum), (2) il n\'existe pas d\'intégration native entre HubSpot et Apollo/Lemlist (vous passez par Zapier à 30 $/mo), (3) la limite gratuite est 1M contacts mais 5 deal pipelines max. Volia CRM est inclus dans le même produit que la prospection et le sending — aucune intégration à maintenir.',
  },
  {
    q: 'Je peux migrer depuis Pipedrive ou HubSpot ?',
    a: 'Oui. Import CSV standard disponible dès maintenant pour contacts et deals (mapping auto des colonnes). Migration assistée via API HubSpot et Pipedrive prévue Q2 2026 (export direct sans CSV). Pour Salesforce, l\'export CSV manuel fonctionne dès aujourd\'hui. Si vous avez plus de 5 000 contacts à migrer, on vous accompagne en visio.',
  },
  {
    q: 'Combien de contacts et de deals maximum ?',
    a: 'Plan Business 99 €/mo : 10 000 prospects en pipeline, nombre de deals illimité (un deal peut être lié à un contact existant ou créé à la volée). Au-delà de 10 000 prospects, contactez-nous pour un quota custom. À titre indicatif, une petite équipe sales (1-5 personnes) tient confortablement à 5 000-8 000 contacts actifs.',
  },
  {
    q: 'Timeline 360° par contact, ça veut dire quoi exactement ?',
    a: 'Toutes les interactions avec ce contact, agrégées en 1 vue chronologique : emails envoyés depuis Volia Campagnes (avec status ouvert/cliqué/répondu), emails reçus en réponse, notes manuelles, appels loggés, meetings planifiés, tâches créées/closées, fichiers attachés, changements de stage du deal. Recherche full-text et filtres par type d\'événement.',
  },
  {
    q: 'Y a-t-il une app mobile native ?',
    a: 'Pas d\'app native iOS/Android pour l\'instant (volontairement — on préfère que le produit web soit excellent avant de fragmenter l\'effort). Le CRM est en revanche entièrement responsive sur mobile : Kanban scrollable horizontalement, drag-drop tactile, notifications push web pour les nouveaux deals créés depuis replies. Une app native est en réflexion pour Q4 2026.',
  },
  {
    q: 'Le plan Business supporte combien d\'utilisateurs en équipe ?',
    a: 'Plan Business 99 €/mo : jusqu\'à 5 seats inclus (idéal pour une petite équipe 1-5 personnes — founder + 2-3 SDR + 1 closeur). Au-delà, +15 €/user/mois supplémentaire. Chaque utilisateur a son propre dashboard, ses propres deals, et le founder voit tout. Pas de licence à 50-100 € par user comme chez HubSpot Pro ou Salesforce.',
  },
  {
    q: 'C\'est conforme RGPD ?',
    a: 'Oui, hébergement Supabase Paris (souveraineté données France), opt-out RGPD unifié (un contact qui se désinscrit d\'une séquence est aussi archivé du CRM), consentements horodatés, droit à l\'effacement en 1 clic depuis la fiche contact, registre des traitements pré-rempli pour votre DPO. Conforme aux exigences CNIL pour la prospection B2B.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────
const breadcrumbs = breadcrumbSchema([
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits/prospection' },
  { label: 'CRM' },
]);

const product = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Volia CRM',
  description: 'Alternative française à HubSpot CRM. Pipeline Kanban drag-drop, auto-create deals depuis replies, timeline 360° par contact, intégré nativement à Volia Prospection et Campagnes. Inclus dans Volia Business 99 €/mois.',
  url: PAGE_URL,
  brand: { '@type': 'Brand', name: 'Volia' },
  offers: {
    '@type': 'Offer',
    price: '99',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: PAGE_URL,
  },
};

export default function CrmProductPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />

      <ProductPageLayout
        module="crm"
        status="LIVE"
        hero={{
          h1Before: 'Un CRM intégré à votre Prospection + Campagnes.',
          h1Highlight: 'Pas une intégration.',
          subtitle: (
            <>
              HubSpot 90 €. Pipedrive 49 €. Salesforce 125 €.{' '}
              <strong className="text-content-primary font-semibold">Volia CRM : 0 € supplémentaire si vous êtes en Business</strong>.
              Kanban drag-drop + auto-create deals depuis replies + <strong className="text-emerald-700 font-semibold">timeline 360° par contact</strong>.
            </>
          ),
          ctaPrimary: { label: 'Passer à Business 99 €', href: '/signup?plan=business' },
          ctaSecondary: { label: 'Voir une démo CRM', href: '/#demo' },
          trust: [
            'Kanban natif',
            'Auto-create depuis replies',
            'Timeline 360°',
            (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Inclus Business 99 €</>),
          ],
          mockup: <HeroMockup />,
        }}
        afterHero={<SocialProofSection />}
        features={FEATURES}
        afterFeatures={(
          <>
            <ProblemSolutionSection />
            <ComparisonTableSection />
            <UseCasesSection />
          </>
        )}
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Volia CRM consomme les contacts qui répondent dans Campagnes, qui viennent des prospects extraits par Prospection. La boucle est fermée nativement.',
          otherModules: [
            { module: 'prospection', direction: 'in', desc: 'Le début du tunnel. 150+ secteurs, 101 départements, emails enrichis et scorés. Bouton "Envoyer au CRM" en 1 clic.', cta: 'Découvrir Prospection' },
            { module: 'campagnes', direction: 'in', desc: 'Séquences email avec relances. Chaque reply positif crée automatiquement un deal en colonne Lead du CRM.', cta: 'Découvrir Campagnes' },
          ],
        }}
        pricingBanner={<PricingFocusBanner />}
        pricing={{
          label: 'CRM gated Business — 99 €/mois tout inclus',
          subtext: 'Les 3 modules (Prospection + Campagnes + CRM) ensemble. Jusqu\'à 5 seats inclus, 10 000 prospects en pipeline, deals illimités. Aucune licence à 50-100 € par user comme HubSpot ou Salesforce.',
          cta: 'Passer à Business 99 €',
          ctaHref: '/signup?plan=business',
        }}
        beforeFaq={<PullQuoteSection />}
        faq={FAQ}
        finalCta={{
          title: 'Le CRM qui se remplit tout seul. 90 €/mois en moins.',
          subtitle: 'Stop le bazar HubSpot + Apollo + Lemlist + Zapier. Volia Business : un produit, un login, une facture. Résiliable en 1 clic.',
          primary: { label: 'Passer à Business 99 €', href: '/signup?plan=business' },
          secondary: { label: 'Voir une démo CRM', href: '/#demo' },
          trust: '99 €/mo tout inclus · 5 seats · 10 000 prospects en pipeline · Annulation 1 clic · RGPD by default',
        }}
      />
    </>
  );
}
