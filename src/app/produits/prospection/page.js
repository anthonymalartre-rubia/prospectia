// ─────────────────────────────────────────────────────────────────────
// /produits/prospection — landing page COMMERCIALE Volia Prospection (LIVE)
// ─────────────────────────────────────────────────────────────────────
// Positionnement : alternative française à Apollo.io, 5× moins chère,
// 287k+ entreprises France, RGPD natif. Conversion-first.
// Accent : violet/indigo (couleur signature module Prospection).
// ─────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Search, Mail, Download, Phone, Check, X, ArrowRight, TrendingUp, Zap, Building2,
  Sparkles, Star, ShieldCheck, Flame, Clock, Wallet, Users as UsersIcon, Briefcase,
  Target as TargetIcon,
} from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import MotionInView from '@/components/MotionInView';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import { BuiltForProfilesBlock } from '@/components/MarketingBlocks';
import { breadcrumbSchema, productSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/prospection`;

// ─────────────────────────────────────────────────────────────────────
// SEO METADATA — ciblé "alternative Apollo" + "prospection b2b france"
// ─────────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'Volia Prospection — Alternative française à Apollo, 5× moins chère (19 €/mois)',
  description:
    "Trouvez 1 000 prospects qualifiés en France en 30 secondes. 287 000+ entreprises avec emails + téléphones vérifiés. À partir de 19 €/mois — 5× moins cher qu'Apollo. 100% conforme RGPD.",
  alternates: {
    canonical: PAGE_URL,
    languages: {
      'fr-FR': PAGE_URL,
      'en-US': `${SITE_URL}/en/products/prospection`,
      'en-GB': `${SITE_URL}/en/products/prospection`,
      'x-default': PAGE_URL,
    },
  },
  keywords: [
    'alternative Apollo France',
    'alternative Apollo.io',
    'prospection b2b France',
    'trouver email entreprise',
    'trouver téléphone entreprise',
    'enrichissement email b2b',
    'annuaire b2b France',
    'Volia Prospection',
    'leads B2B France',
    'alternative Hunter',
    'alternative Lemlist',
    'logiciel prospection france',
    'base de données entreprises france',
    'RGPD prospection b2b',
  ],
  openGraph: {
    title: 'Volia Prospection — Alternative française à Apollo, 5× moins chère',
    description:
      "287 000+ entreprises françaises avec emails + téléphones vérifiés. À partir de 19 €/mois. RGPD inclus. L'alternative française à Apollo, Hunter, Lemlist.",
    url: PAGE_URL,
    type: 'website',
    // Pas de `images` ici : Next.js sert automatiquement /opengraph-image.js
    // depuis src/app/ comme fallback, et l'asset /og-prospection.png n'existe
    // pas dans /public (référence cassée qui pénalisait le partage social).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volia Prospection — Alternative française à Apollo, 5× moins chère',
    description: '287k+ entreprises FR, emails + tels, RGPD inclus. À partir de 19 €/mois.',
  },
};

// ─────────────────────────────────────────────────────────────────────
// MOCKUP HERO — faux résultats de recherche (statique)
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const rows = [
    { name: 'La Bonne Table', email: 'contact@labonnetable.fr', phone: '01 42 33 45 67', score: 'Vérifié', color: 'emerald', avatar: '🍽️' },
    { name: 'Pasta Roma', email: 'info@pastaroma.fr', phone: '01 48 06 12 89', score: 'Vérifié', color: 'emerald', avatar: '🍝' },
    { name: 'Boulangerie Maison', email: 'bonjour@boulangerie-m.fr', phone: '01 45 22 78 03', score: 'Google', color: 'amber', avatar: '🥖' },
    { name: 'Le Petit Bistrot', email: 'reservation@petitbistrot.fr', phone: '01 43 87 19 56', score: 'Vérifié', color: 'emerald', avatar: '🍷' },
    { name: 'Sushi Lounge Paris', email: 'contact@sushilounge.fr', phone: '01 56 34 21 78', score: 'Vérifié', color: 'emerald', avatar: '🍱' },
  ];
  return (
    <>
      <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 shadow-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold text-emerald-700">Recherche en direct</span>
      </div>

      <div className="relative rounded-2xl bg-white border border-line shadow-2xl shadow-violet-500/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="ml-3 text-xs font-mono text-content-tertiary">volia.fr/dashboard</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-violet-100 text-violet-700 font-semibold">234 résultats</div>
        </div>

        <div className="px-5 py-3 border-b border-line flex items-center gap-3">
          <Search size={14} className="text-violet-500" />
          <span className="text-sm text-content-secondary font-medium">Restaurants · Paris (75)</span>
        </div>

        <div className="divide-y divide-line">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/50 transition-colors animate-in fade-in slide-in-from-right-4"
              style={{ animationDelay: `${300 + i * 100}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                {row.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-content-primary truncate">{row.name}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-content-tertiary font-mono truncate min-w-0">
                    <Mail size={10} className="flex-shrink-0 text-violet-500" />
                    <span className="truncate">{row.email}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-content-tertiary font-mono flex-shrink-0">
                    <Phone size={10} className="flex-shrink-0 text-violet-500" />
                    <span>{row.phone}</span>
                  </div>
                </div>
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex-shrink-0 ${
                row.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {row.score}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-surface-elevated/30">
          <span className="text-xs text-content-tertiary">+ 229 autres résultats</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
            <Download size={12} />
            Export CSV
          </div>
        </div>
      </div>

      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-content-tertiary">Emails + tels trouvés</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 192</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Social Proof — mini-stats killer + Trustpilot + Built-For
// ─────────────────────────────────────────────────────────────────────
function SocialProofSection() {
  const killStats = [
    {
      icon: TrendingUp,
      value: '47 %',
      label: 'taux d\'emails enrichis',
      sub: 'en moyenne par recherche',
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      icon: Clock,
      value: '30 s',
      label: 'pour 1 000 prospects',
      sub: 'enrichissement waterfall inclus',
      gradient: 'from-indigo-600 to-blue-600',
    },
    {
      icon: Wallet,
      value: '5×',
      label: 'moins cher qu\'Apollo',
      sub: '19 € vs 99 $/mois',
      gradient: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <MotionInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-600"></span>
              </span>
              Pourquoi les commerciaux choisissent Volia
            </span>
          </div>
        </MotionInView>

        {/* Stats killer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {killStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <MotionInView key={stat.label} delay={i * 120}>
                <div className="group h-full p-7 rounded-2xl border-2 border-violet-200/60 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className={`text-5xl sm:text-6xl font-bold font-mono tabular-nums bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent leading-none mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-base font-semibold text-content-primary">{stat.label}</div>
                  <div className="text-sm text-content-tertiary mt-1">{stat.sub}</div>
                </div>
              </MotionInView>
            );
          })}
        </div>

        {/* Trustpilot badge centré */}
        <MotionInView delay={400}>
          <div className="flex justify-center">
            <TrustpilotBadge size="md" />
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Avant / Avec Volia (problème → solution chiffrée)
// ─────────────────────────────────────────────────────────────────────
function ProblemSolutionSection() {
  const before = {
    items: [
      'LinkedIn Sales Navigator : 99 €/mois',
      'Apollo.io : 99 $/mois (~92 €) pour 6 000 emails',
      'Hunter.io : 49 $/mois (~46 €) pour 1 000 emails',
      '4 h/jour à copier-coller dans Excel',
      'Couverture France : ~40 % (concurrents US-first)',
    ],
    total: '237 €/mois + 80 h/mois perdues',
  };
  const after = {
    items: [
      'Volia Prospection : 19 €/mois pour 1 000 prospects',
      '30 secondes par recherche (waterfall auto)',
      'Email + téléphone à chaque ligne, scorés',
      'Couverture France : 78 % (#1 du marché FR)',
      'Export 1-clic vers HubSpot, Salesforce, Zoho',
    ],
    total: '19 €/mois — économie 218 €/mois',
  };
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-violet-50/20 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Problème → solution
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              237€/mois pour 3 outils US. Sérieux ?
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              On a recodé Apollo + Hunter + LinkedIn Sales Nav pour 19€/mois. Meilleure couverture France, support en français.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
          {/* Avant */}
          <MotionInView delay={100}>
            <div className="h-full p-7 sm:p-8 rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md">
                  <X size={20} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Avant Volia</h3>
              </div>
              <ul className="space-y-3.5 mb-6">
                {before.items.map((line, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mt-0.5">
                      <X size={12} className="text-rose-600" strokeWidth={3} />
                    </div>
                    <span className="text-sm sm:text-base text-content-secondary leading-relaxed">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-rose-200/60 text-center">
                <div className="text-2xl font-bold text-rose-700 font-mono">{before.total}</div>
              </div>
            </div>
          </MotionInView>

          {/* Avec Volia Prospection */}
          <MotionInView delay={200}>
            <div className="relative h-full p-7 sm:p-8 rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-indigo-50/40 shadow-xl shadow-violet-500/10">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                La méthode Volia
              </div>
              <div className="flex items-center gap-3 mb-6 mt-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Check size={20} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Avec Volia Prospection</h3>
              </div>
              <ul className="space-y-3.5 mb-6">
                {after.items.map((line, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 border border-violet-300 flex items-center justify-center mt-0.5">
                      <Check size={12} className="text-violet-700" strokeWidth={3} />
                    </div>
                    <span className="text-sm sm:text-base text-content-primary font-medium leading-relaxed">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-violet-200/60 text-center">
                <div className="text-2xl font-bold bg-gradient-to-br from-violet-700 to-indigo-700 bg-clip-text text-transparent font-mono">{after.total}</div>
              </div>
            </div>
          </MotionInView>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Comparatif Apollo / Hunter / Lemlist / Volia
// ─────────────────────────────────────────────────────────────────────
function ComparatifSection() {
  const rows = [
    { feature: 'Emails B2B France', apollo: 'Limité (~40 %)', hunter: 'Non', lemlist: 'Partiel', volia: '287k entreprises' },
    { feature: 'Téléphones inclus', apollo: 'oui', hunter: 'non', lemlist: 'non', volia: 'oui' },
    { feature: 'Recherche en langage naturel (IA)', apollo: 'oui', hunter: 'non', lemlist: 'non', volia: 'oui' },
    { feature: 'Waterfall multi-sources', apollo: 'non', hunter: 'non', lemlist: 'non', volia: 'oui' },
    { feature: 'Conformité RGPD France native', apollo: 'non', hunter: 'non', lemlist: 'non', volia: 'oui' },
    { feature: 'Export Zoho / HubSpot 1-clic', apollo: 'HubSpot only', hunter: 'CSV', lemlist: 'non', volia: 'oui' },
    { feature: 'Support en français', apollo: 'non', hunter: 'non', lemlist: 'oui', volia: 'oui' },
  ];

  const cell = (val) => {
    if (val === 'oui') return <Check size={18} className="text-emerald-600 mx-auto" strokeWidth={3} />;
    if (val === 'non') return <X size={18} className="text-rose-400 mx-auto" strokeWidth={2.5} />;
    return <span className="text-xs sm:text-sm text-content-secondary">{val}</span>;
  };

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Comparatif honnête
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Volia vs Apollo, Hunter, Lemlist.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Sur le marché B2B français, on est tout seuls. Le tableau parle.
            </p>
          </div>
        </MotionInView>

        <MotionInView delay={150}>
          <div className="relative overflow-x-auto rounded-2xl border-2 border-violet-200 bg-white shadow-xl shadow-violet-500/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b-2 border-violet-200">
                  <th className="px-4 sm:px-6 py-5 text-xs sm:text-sm font-bold text-content-primary uppercase tracking-wider">
                    Fonctionnalité
                  </th>
                  <th className="px-3 sm:px-5 py-5 text-center">
                    <div className="text-xs sm:text-sm font-bold text-content-secondary">Apollo</div>
                    <div className="text-[10px] sm:text-xs text-content-tertiary font-mono mt-1">$99/mo</div>
                  </th>
                  <th className="px-3 sm:px-5 py-5 text-center">
                    <div className="text-xs sm:text-sm font-bold text-content-secondary">Hunter</div>
                    <div className="text-[10px] sm:text-xs text-content-tertiary font-mono mt-1">$49/mo</div>
                  </th>
                  <th className="px-3 sm:px-5 py-5 text-center hidden sm:table-cell">
                    <div className="text-xs sm:text-sm font-bold text-content-secondary">Lemlist</div>
                    <div className="text-[10px] sm:text-xs text-content-tertiary font-mono mt-1">$59/mo</div>
                  </th>
                  <th className="px-3 sm:px-5 py-5 text-center bg-gradient-to-b from-violet-100 to-indigo-100 border-l-2 border-violet-300 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                      Recommandé
                    </div>
                    <div className="text-xs sm:text-sm font-bold bg-gradient-to-br from-violet-700 to-indigo-700 bg-clip-text text-transparent">Volia</div>
                    <div className="text-[10px] sm:text-xs text-violet-700 font-mono font-bold mt-1">19 €/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-violet-100 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'}`}>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-content-primary">
                      {row.feature}
                    </td>
                    <td className="px-3 sm:px-5 py-4 text-center">{cell(row.apollo)}</td>
                    <td className="px-3 sm:px-5 py-4 text-center">{cell(row.hunter)}</td>
                    <td className="px-3 sm:px-5 py-4 text-center hidden sm:table-cell">{cell(row.lemlist)}</td>
                    <td className="px-3 sm:px-5 py-4 text-center bg-gradient-to-b from-violet-50/60 to-indigo-50/60 border-l-2 border-violet-300">
                      {cell(row.volia)}
                    </td>
                  </tr>
                ))}
                {/* Ligne prix finale en gras */}
                <tr className="border-t-2 border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50">
                  <td className="px-4 sm:px-6 py-5 text-sm font-bold text-content-primary uppercase tracking-wider">
                    Prix mensuel
                  </td>
                  <td className="px-3 sm:px-5 py-5 text-center text-sm font-bold text-content-secondary font-mono">99 $</td>
                  <td className="px-3 sm:px-5 py-5 text-center text-sm font-bold text-content-secondary font-mono">49 $</td>
                  <td className="px-3 sm:px-5 py-5 text-center text-sm font-bold text-content-secondary font-mono hidden sm:table-cell">59 $</td>
                  <td className="px-3 sm:px-5 py-5 text-center bg-gradient-to-b from-violet-100 to-indigo-100 border-l-2 border-violet-300">
                    <div className="text-base font-bold bg-gradient-to-br from-violet-700 to-indigo-700 bg-clip-text text-transparent font-mono">19 €</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </MotionInView>

        <MotionInView delay={300}>
          <div className="mt-10 text-center">
            <Link
              href="/signup?plan=starter"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all text-base"
            >
              <Sparkles size={18} className="text-amber-200" />
              <span>Démarrer gratuitement</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-3 text-xs text-content-tertiary">
              100 prospects gratuits · Sans CB · Annulation 1 clic
            </p>
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Use cases (3 personas)
// ─────────────────────────────────────────────────────────────────────
function UseCasesSection() {
  const personas = [
    {
      avatar: 'S',
      name: 'Sarah',
      role: 'Founder SaaS B2B',
      gradient: 'from-violet-500 to-indigo-600',
      icon: Briefcase,
      quote: 'J\'utilise Volia chaque lundi matin pour sortir 50 nouveaux prospects à Paris. Volia me fait économiser 168 €/mois vs Apollo, et je passe 4 h de moins en sourcing.',
      metric: '168 €/mois économisés vs Apollo',
      metricIcon: Wallet,
    },
    {
      avatar: 'M',
      name: 'Marc',
      role: 'Agence growth',
      gradient: 'from-blue-500 to-cyan-600',
      icon: TrendingUp,
      quote: 'Je facture 1 500 € une liste de 500 prospects qualifiés à mes clients. Volia me la génère en 5 minutes au lieu de 2 jours. Marge × 30.',
      metric: '1 500 € de marge par livrable',
      metricIcon: Flame,
    },
    {
      avatar: 'T',
      name: 'Tom',
      role: 'Freelance commercial',
      gradient: 'from-emerald-500 to-teal-600',
      icon: TargetIcon,
      quote: 'Je suis 1 SDR à moi tout seul. Volia m\'a fait passer de 20 à 80 RDV/mois. Je vais ouvrir un 2e poste grâce au pipeline généré.',
      metric: 'Pipeline × 4 en 8 semaines',
      metricIcon: UsersIcon,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Use cases
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              3 profils, 1 outil, des résultats.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Volia Prospection s&apos;adapte à votre rythme : founder, agence ou freelance commercial. Voici 3 retours de vrais utilisateurs.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {personas.map((p, i) => {
            const Icon = p.icon;
            const MetricIcon = p.metricIcon;
            return (
              <MotionInView key={p.name} delay={i * 150}>
                <div className="group h-full p-7 rounded-2xl border-2 border-violet-200/60 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.gradient} ring-2 ring-white shadow-md flex items-center justify-center text-white text-lg font-bold`}>
                      {p.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-content-primary">{p.name}</div>
                      <div className="text-xs text-content-tertiary inline-flex items-center gap-1">
                        <Icon size={11} />
                        {p.role}
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-sm text-content-secondary leading-relaxed mb-5 flex-1">
                    <span className="text-violet-400 text-xl leading-none mr-0.5">“</span>
                    {p.quote}
                    <span className="text-violet-400 text-xl leading-none ml-0.5">”</span>
                  </blockquote>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br ${p.gradient} text-white text-xs font-bold shadow-md`}>
                    <MetricIcon size={13} />
                    {p.metric}
                  </div>
                </div>
              </MotionInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Pricing focus — 4 plans en cards compactes
// ─────────────────────────────────────────────────────────────────────
function PricingFocusSection() {
  const plans = [
    {
      name: 'Starter',
      price: '0 €',
      period: 'à vie',
      prospects: '100 prospects/mois',
      audience: 'pour tester',
      cta: 'Démarrer',
      href: '/signup?plan=starter',
      popular: false,
    },
    {
      name: 'Solo',
      price: '19 €',
      period: '/mois',
      prospects: '1 000 prospects/mois',
      audience: 'pour les freelances',
      cta: 'Choisir Solo',
      href: '/signup?plan=solo',
      popular: true,
    },
    {
      name: 'Pro',
      price: '49 €',
      period: '/mois',
      prospects: '5 000 prospects/mois',
      audience: 'pour agences & PME',
      cta: 'Choisir Pro',
      href: '/signup?plan=pro',
      popular: false,
    },
    {
      name: 'Business',
      price: '99 €',
      period: '/mois',
      prospects: '10 000 prospects/mois + Campagnes + CRM',
      audience: 'pour scaleups',
      cta: 'Choisir Business',
      href: '/signup?plan=business',
      popular: false,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-violet-50/20 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Tarifs Volia Prospection
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Un plan pour chaque ambition.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Pas d&apos;engagement, annulation 1 clic, downgrade libre. Vous changez de plan quand vous voulez.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {plans.map((plan, i) => (
            <MotionInView key={plan.name} delay={i * 100}>
              <div className={`relative h-full p-6 rounded-2xl border-2 ${plan.popular ? 'border-violet-400 bg-gradient-to-br from-violet-50 via-white to-indigo-50/40 shadow-xl shadow-violet-500/15' : 'border-line bg-white hover:border-violet-200'} transition-all hover:-translate-y-1 flex flex-col`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap inline-flex items-center gap-1">
                    <Star size={10} className="fill-white" />
                    Le plus populaire
                  </div>
                )}
                <div className="mb-4 mt-1">
                  <h3 className="text-xl font-bold text-content-primary">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-4xl font-bold font-mono tabular-nums ${plan.popular ? 'bg-gradient-to-br from-violet-700 to-indigo-700 bg-clip-text text-transparent' : 'text-content-primary'}`}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-content-tertiary">{plan.period}</span>
                  </div>
                  <p className="text-xs text-content-tertiary mt-1">{plan.audience}</p>
                </div>
                <p className="text-sm text-content-secondary font-medium leading-relaxed mb-5 flex-1">
                  {plan.prospects}
                </p>
                <Link
                  href={plan.href}
                  className={`inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/30'
                      : 'border border-line hover:border-violet-400 hover:bg-violet-50 text-content-primary'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </MotionInView>
          ))}
        </div>

        <MotionInView delay={500}>
          <div className="text-center">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900 transition group"
            >
              Comparer les plans complets
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Témoignage clé (pull quote)
// ─────────────────────────────────────────────────────────────────────
function FeaturedTestimonialSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <MotionInView className="max-w-4xl mx-auto text-center relative z-10">
        <div className="text-6xl sm:text-7xl text-violet-300 leading-none mb-4 font-serif">“</div>
        <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-content-primary leading-snug mb-8 tracking-tight">
          Avant Volia, on payait Apollo <strong className="font-bold">99 $/mois</strong> pour <strong className="font-bold">40 %</strong> de couverture France. Aujourd&apos;hui, on est à <strong className="bg-gradient-to-br from-violet-700 to-indigo-700 bg-clip-text text-transparent font-bold">19 €/mois</strong> pour <strong className="bg-gradient-to-br from-emerald-700 to-teal-700 bg-clip-text text-transparent font-bold">78 %</strong>. Le gain est insolent.
        </blockquote>

        <div className="flex items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 ring-4 ring-white shadow-lg flex items-center justify-center text-white text-base font-bold">
            JD
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-content-primary">Julien Dupré</div>
            <div className="text-sm text-content-tertiary">Head of Sales · Studio Digital Lyon</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-line mx-2" />
          <div className="hidden sm:block text-left">
            <div className="text-2xl font-bold font-mono bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">+95 %</div>
            <div className="text-xs text-content-tertiary">de couverture France</div>
          </div>
        </div>
      </MotionInView>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION : Built-For profiles (réutilise composant existant)
// ─────────────────────────────────────────────────────────────────────
function BuiltForSection() {
  return (
    <div className="border-t border-line py-16 bg-white">
      <BuiltForProfilesBlock
        title="Pensé pour ces profils B2B en France"
        subtitle="Chaque plan est calibré sur les volumes typiques d'un profil. Trouvez le vôtre — vous y arriverez en 5 minutes."
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DONNÉES PAGE : FEATURES BENTO (6 features)
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'trouver vos prospects B2B en France',
  subline: 'Une couverture France totale, un enrichissement multi-sources, et un scoring qui vous dit exactement quoi croire et quoi prioriser.',
  items: [
    {
      icon: 'Search', featured: true,
      title: 'Recherche par catégorie + département',
      desc: '150+ catégories B2B (restauration, BTP, immobilier, santé, juridique…) croisées avec 101 départements via Google Places API. Multi-sélection régions/départements/villes. Aucune zone blanche en France.',
    },
    {
      icon: 'Layers',
      title: 'Waterfall enrichissement multi-sources',
      desc: 'Scraping intelligent du site → recherche Google via Serper → patterns. S\'arrête dès qu\'un email est trouvé.',
    },
    {
      icon: 'BarChart3',
      title: 'Scoring de confiance par lead',
      desc: 'Chaque email scoré : Vérifié (~85 % deliverability), Google (~70 %), Probable (~50 %). Vous priorisez.',
    },
    {
      icon: 'Brain',
      title: 'Recherche en langage naturel',
      desc: 'Tapez "trouve-moi 50 SaaS B2B à Paris" → Claude traduit en requête Google Places en 2 secondes.',
    },
    {
      icon: 'Download',
      title: 'Export CSV / HubSpot / Zoho / Salesforce',
      desc: 'Format standard ou pré-mappé pour vos CRM. Mapping auto : nom, adresse, tél, email, score, site, note Google.',
    },
    {
      icon: 'Shield',
      title: 'Filtrage RGPD emails personnels',
      desc: '28 domaines bloqués automatiquement (@gmail, @hotmail, @yahoo…). Activable/désactivable, conforme CNIL.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// DONNÉES PAGE : HOW IT WORKS (3 étapes)
// ─────────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    icon: 'Search',
    title: '1. Choisissez secteur et zone',
    desc: 'Sélectionnez un ou plusieurs secteurs (150+ catégories) et la zone (régions, départements ou ville). Ou tapez en langage naturel, Claude se charge du reste.',
  },
  {
    icon: 'Sparkles',
    title: '2. Volia cherche pour vous',
    desc: 'L\'enrichissement waterfall s\'enchaîne automatiquement : Google Places → site web → Google → patterns. 234 résultats en 30 secondes, avec emails et téléphones scorés.',
  },
  {
    icon: 'Download',
    title: '3. Exportez et contactez',
    desc: 'CSV propre, prêt pour votre CRM ou pour Volia Campagnes en 1 clic. Pas de copier-coller, pas d\'ETL, pas d\'erreur de mapping. Vous gardez vos données pour toujours.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// DONNÉES PAGE : FAQ produit (8 questions ciblées Prospection)
// ─────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'Combien d\'emails j\'obtiens par recherche ?',
    a: 'En moyenne, 47 % des prospects extraits sont enrichis d\'un email professionnel (sources : scraping site + Serper + patterns). Sur certains secteurs très digitalisés (SaaS, agences digitales, e-commerce), on monte à 70-85 %. Sur des secteurs moins en ligne (artisans, BTP local), c\'est plutôt 30-45 %. Dans tous les cas, vous voyez le score de confiance avant l\'envoi.',
  },
  {
    q: 'D\'où viennent les données ?',
    a: 'Trois sources combinées : (1) Google Places API pour l\'identification des entreprises (nom, adresse, téléphone, note, avis) ; (2) scraping du site web officiel pour l\'email (méthode "Vérifié") ; (3) Serper.dev pour rechercher l\'email via Google quand le site ne le donne pas (méthode "Google"). En dernier recours, on génère un pattern (contact@nom-domaine.fr, "Probable"). Aucune base achetée, aucune donnée volée.',
  },
  {
    q: 'C\'est conforme RGPD ?',
    a: 'Oui, by default. Volia respecte les recommandations CNIL pour la prospection B2B : intérêt légitime, opt-out clair sur chaque email, suppression sur demande via /opt-out, blocklist permanente. Un filtre RGPD bloque par défaut 28 domaines d\'emails personnels (@gmail, @hotmail…) pour ne contacter que des emails professionnels. Hébergement EU, code Made in France.',
  },
  {
    q: 'Comment ça marche pour les départements outre-mer ?',
    a: 'Volia couvre les 5 départements d\'outre-mer (Guadeloupe 971, Martinique 972, Guyane 973, La Réunion 974, Mayotte 976) au même titre que la métropole. Mêmes APIs, mêmes catégories, mêmes prix. C\'est même un avantage : les bases concurrentes US (Apollo, Hunter) ont une couverture quasi-nulle sur les DOM-TOM.',
  },
  {
    q: 'Quelle différence avec Apollo / Hunter ?',
    a: 'Trois différences clés : (1) Volia est 5× moins cher (19 € vs ~92-99 $/mois) ; (2) Volia est spécialisé France (287k entreprises FR, 78 % de couverture) alors qu\'Apollo/Hunter sont US-first (40 % de couverture FR) ; (3) Volia inclut le téléphone à chaque ligne et un waterfall multi-sources qui maximise le taux email sans gaspiller de crédits. Et bien sûr : support en français, RGPD natif, hébergement EU.',
  },
  {
    q: 'Puis-je faire des recherches en langage naturel ?',
    a: 'Oui. Tapez par exemple "trouve-moi 50 SaaS B2B à Paris" ou "cabinets d\'avocats fiscalistes Lyon" — Claude (Anthropic) traduit votre requête en termes Google Places exploitables en 2 secondes. Pratique quand vous ne connaissez pas la nomenclature exacte des catégories. Fonctionnalité incluse dans tous les plans, dès Starter gratuit.',
  },
  {
    q: 'Y a-t-il une limite quotidienne d\'enrichissement ?',
    a: 'Non. Vous avez un quota mensuel selon votre plan (100, 1k, 5k, 10k prospects/mois), à utiliser comme vous voulez : tout en une fois ou réparti dans le mois. Pas de cap quotidien, pas de rate-limit côté utilisateur. Côté infrastructure, le waterfall s\'arrête dès qu\'un email est trouvé, donc on ne brûle pas vos crédits sur des APIs externes inutiles.',
  },
  {
    q: 'Export possible vers mon CRM (HubSpot, Salesforce, Pipedrive, Zoho) ?',
    a: 'Oui. Export CSV standard (compatible HubSpot, Salesforce, Pipedrive, Brevo, Mailjet…) et export pré-mappé Zoho CRM (champs auto-remplis). Mapping inclus : nom, adresse, téléphone, email, site web, score, note Google, nombre d\'avis. Et avec le plan Business, vos prospects filent directement dans Volia Campagnes pour l\'envoi de séquences email/SMS sans étape d\'export.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD STRUCTURED DATA
// ─────────────────────────────────────────────────────────────────────
const breadcrumbs = breadcrumbSchema([
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits/prospection' },
  { label: 'Prospection' },
]);

const product = {
  '@context': 'https://schema.org',
  ...productSchema({
    name: 'Volia Prospection',
    description: "Alternative française à Apollo.io, 5× moins chère. 287k+ entreprises françaises avec emails + téléphones, 150+ secteurs, 101 départements. À partir de 19 €/mois, RGPD inclus.",
    url: PAGE_URL,
    priceFrom: 19,
  }),
};

// ─────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function ProspectionProductPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />

      <ProductPageLayout
        module="prospection"
        status="LIVE"
        hero={{
          eyebrow: 'Le moins cher du marché français — Alternative Apollo',
          h1Before: 'Trouvez 1 000 prospects qualifiés',
          h1Highlight: 'en France.',
          h1After: 'En 30 secondes.',
          subtitle: (
            <>
              <strong className="text-content-primary font-semibold">287 000+ entreprises françaises</strong> avec emails + téléphones vérifiés.{' '}
              <strong className="text-emerald-700 font-semibold">5× moins cher qu&apos;Apollo</strong>. 100% conforme RGPD.
            </>
          ),
          ctaPrimary: { label: 'Démarrer gratuitement', href: '/signup?plan=starter' },
          ctaSecondary: { label: 'Voir une démo en direct', href: '/#try-live' },
          trust: [
            (<><strong className="font-mono text-content-secondary">287 000+</strong> entreprises</>),
            (<><strong className="font-mono text-content-secondary">101</strong> départements</>),
            (<><strong className="font-mono text-content-secondary">150+</strong> catégories</>),
            (<><ShieldCheck size={12} className="text-emerald-600" /> 100% RGPD</>),
          ],
          mockup: <HeroMockup />,
        }}
        afterHero={
          <>
            <SocialProofSection />
            <BuiltForSection />
            <ProblemSolutionSection />
          </>
        }
        features={FEATURES}
        afterFeatures={
          <>
            <ComparatifSection />
            <UseCasesSection />
          </>
        }
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Vos prospects extraits filent directement dans Campagnes pour l\'envoi, puis dans le CRM (à la sortie) pour le suivi commercial. Zéro friction.',
          otherModules: [
            { module: 'campagnes', direction: 'out', desc: 'Lancez des séquences email + SMS sur vos prospects extraits. Templates inclus, relances auto, stats temps réel.', cta: 'Découvrir Campagnes' },
            { module: 'crm', direction: 'out', desc: 'Pipeline Kanban natif Volia pour suivre vos deals jusqu\'au closing. Disponible bientôt.', cta: 'Rejoindre la beta' },
          ],
        }}
        pricing={{
          label: 'Inclus dans tous les plans, dès le Starter gratuit',
          subtext: 'Starter 0 € (100 prospects/mois) · Solo 19 € (1k) · Pro 49 € (5k) · Business 99 € (10k + Campagnes + CRM). Pas d\'engagement, annulation 1 clic.',
          cta: 'Voir les tarifs complets',
          ctaHref: '/#pricing',
        }}
        beforeFaq={
          <>
            <PricingFocusSection />
            <FeaturedTestimonialSection />
          </>
        }
        faq={FAQ}
        finalCta={{
          title: 'Prêt à arrêter de payer Apollo 5× trop cher ?',
          subtitle: '100 prospects gratuits pour tester, sans carte bancaire. Vous gardez tout ce que vous exportez, pour toujours.',
          primary: { label: 'Démarrer gratuitement', href: '/signup?plan=starter' },
          secondary: { label: 'Voir une démo', href: '/#try-live' },
          trust: 'Sans CB · Annulation 1 clic · Made in France',
        }}
      />
    </>
  );
}
