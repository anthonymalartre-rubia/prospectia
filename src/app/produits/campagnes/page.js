// ─────────────────────────────────────────────────────────────────────
// /produits/campagnes — landing commerciale Volia Campagnes (BETA)
// ─────────────────────────────────────────────────────────────────────
// Positionnement : alternative française à Lemlist + Instantly + Smartlead
// Couleur dominante : BLUE (cohérent ModuleSwitcher BETA blue)
// Argument N°1 : deliverability (warmup auto 28j) + auto-create CRM
// Argument N°2 : tout-en-un à 49€ vs ~108€/mo cumulés concurrents
// ─────────────────────────────────────────────────────────────────────

import {
  Mail, Play, Check, X, ArrowRight,
  Zap, Sparkles, Flame, Workflow,
} from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import MotionInView from '@/components/MotionInView';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import { breadcrumbSchema, productSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/campagnes`;

export const metadata = {
  title: 'Volia Campagnes — Cold email B2B qui finit en Inbox, pas en Spam',
  description:
    'Alternative française à Lemlist + Instantly + Smartlead. Cold email illimité, warmup automatique 28 jours, multi-tenant Resend, auto-create CRM depuis replies. Inclus dans Pro à 49€/mois vs 108€/mo cumulés. 62 % taux ouverture moyen.',
  alternates: {
    canonical: PAGE_URL,
    languages: {
      'fr-FR': PAGE_URL,
      'en-US': `${SITE_URL}/en/products/campaigns`,
      'en-GB': `${SITE_URL}/en/products/campaigns`,
      'x-default': PAGE_URL,
    },
  },
  keywords: [
    'cold email b2b',
    'alternative lemlist',
    'alternative instantly',
    'alternative smartlead',
    'warmup domaine email',
    'warmup email automatique',
    'séquence email b2b',
    'cold email français',
    'envoi email multi-tenant',
    'deliverability email b2b',
    'auto-create CRM cold email',
    'outil cold email RGPD',
    'Volia Campagnes',
  ],
  openGraph: {
    title: 'Volia Campagnes — Cold email B2B qui finit en Inbox, pas en Spam',
    description:
      'Lemlist 39€. Instantly 30$. Volia Campagnes : inclus dans Pro à 49€. Warmup auto 28 jours + multi-tenant Resend + auto-create CRM depuis replies.',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// HERO MOCKUP : séquence 3 étapes (J+0 / J+3 / J+7) avec stats killer
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const steps = [
    {
      day: 'J+0', kind: 'Intro', icon: Mail, color: 'blue',
      subject: 'Une question rapide sur {{entreprise}}',
      preview: 'Bonjour {{prenom}}, je viens de voir que vous gérez…',
    },
    {
      day: 'J+3', kind: 'Relance', icon: Mail, color: 'cyan',
      subject: 'Re: Une question rapide sur {{entreprise}}',
      preview: 'Je remonte ce message au cas où il aurait filé en bas de boîte…',
    },
    {
      day: 'J+7', kind: 'Bump', icon: Mail, color: 'indigo',
      subject: 'Dernière tentative {{prenom}} ?',
      preview: 'Si le sujet vous intéresse, on en parle 15 min ?',
    },
  ];

  return (
    <>
      <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-300 shadow-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span className="text-xs font-semibold text-blue-700">Séquence en cours</span>
      </div>

      <div className="relative rounded-2xl bg-white border border-line shadow-2xl shadow-blue-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="ml-3 text-xs font-mono text-content-tertiary">volia.fr/campagnes</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold">Séquence &quot;Restos Paris&quot;</div>
        </div>

        {/* Stats bar — killer deliverability */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            { label: 'Ouverture', value: '62%', color: 'text-blue-700' },
            { label: 'Inbox rate', value: '94%', color: 'text-emerald-700' },
            { label: 'Réponse', value: '14%', color: 'text-cyan-700' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="p-5 space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex gap-3 animate-in fade-in slide-in-from-right-4"
                style={{ animationDelay: `${300 + i * 150}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${
                    step.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    step.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
                    'from-indigo-500 to-indigo-600'
                  } flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-line my-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">{step.day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{step.kind}</span>
                  </div>
                  <div className="text-sm font-semibold text-content-primary mb-0.5 truncate">{step.subject}</div>
                  <div className="text-xs text-content-tertiary truncate">{step.preview}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-surface-elevated/30">
          <span className="text-xs text-content-tertiary">147 prospects en cours</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Play size={12} />
            Active · warmup J+18
          </div>
        </div>
      </div>

      {/* Floating decorative card "+ 1 deal CRM auto" */}
      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Workflow size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-content-tertiary">Reply → CRM auto</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 23 deals</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 2 — Social proof (stats killer + Trustpilot + claim deliverability)
// ─────────────────────────────────────────────────────────────────────
function SocialProofSection() {
  const stats = [
    { value: '62%', label: 'taux d\'ouverture moyen', sub: 'vs ~25 % industrie cold email', color: 'from-blue-600 via-cyan-600 to-blue-700' },
    { value: '+60%', label: 'deliverability vs Lemlist', sub: 'grâce au warmup 28 jours auto', color: 'from-emerald-600 to-teal-700' },
    { value: '0', label: 'saisie manuelle pour les hot leads', sub: 'reply → deal CRM créé auto', color: 'from-cyan-600 to-sky-700' },
  ];
  return (
    <section className="relative py-20 px-4 sm:px-6 border-t border-line overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <MotionInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              Les chiffres de la beta
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Pendant que Lemlist tombe en Spam,
              <br />
              Volia finit en Inbox.
            </h2>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <MotionInView key={stat.label} delay={i * 100}>
              <div className="group">
                <div className={`text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tabular-nums bg-gradient-to-br ${stat.color} bg-clip-text text-transparent leading-none mb-3 group-hover:scale-105 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-content-primary">{stat.label}</div>
                <div className="text-xs text-content-tertiary mt-1">{stat.sub}</div>
              </div>
            </MotionInView>
          ))}
        </div>

        {/* Trustpilot strip */}
        <MotionInView delay={300}>
          <div className="mt-12 flex items-center justify-center">
            <TrustpilotBadge size="md" />
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 5 — Comparatif Lemlist + Instantly vs Volia (table 4 colonnes)
// ─────────────────────────────────────────────────────────────────────
function ComparisonTableSection() {
  const rows = [
    { feature: 'Cold email illimité', lemlist: { ok: false, label: '50/jour' }, instantly: { ok: true }, volia: { ok: true } },
    { feature: 'Multi-tenant sender (votre domaine)', lemlist: { ok: false }, instantly: { ok: false }, volia: { ok: true } },
    { feature: 'Warmup automatique 28 j', lemlist: { ok: false, label: '+30€/mo' }, instantly: { ok: true }, volia: { ok: true, label: 'inclus' } },
    { feature: 'Auto-create CRM depuis replies', lemlist: { ok: false }, instantly: { ok: false }, volia: { ok: true } },
    { feature: 'Templates B2B FR (20+)', lemlist: { ok: false }, instantly: { ok: false }, volia: { ok: true } },
    { feature: 'Multi-inbox rotation', lemlist: { ok: false }, instantly: { ok: true }, volia: { ok: true } },
    { feature: 'Opt-out RGPD unifié', lemlist: { ok: false }, instantly: { ok: false }, volia: { ok: true } },
    { feature: 'Support FR', lemlist: { ok: false }, instantly: { ok: false }, volia: { ok: true } },
  ];

  const Cell = ({ cell, accent }) => {
    if (cell.ok) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${accent ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
            <Check size={14} className={accent ? 'text-emerald-700' : 'text-zinc-700'} strokeWidth={3} />
          </div>
          {cell.label && <span className={`text-[10px] font-semibold ${accent ? 'text-emerald-700' : 'text-content-tertiary'}`}>{cell.label}</span>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
          <X size={14} className="text-rose-600" strokeWidth={3} />
        </div>
        {cell.label && <span className="text-[10px] font-semibold text-rose-600">{cell.label}</span>}
      </div>
    );
  };

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Volia vs concurrents
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Lemlist + Instantly = 108 €/mo.
              <br />
              <span className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">Volia = 49 €/mo.</span>
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Et on est les seuls à faire du multi-tenant Resend natif + auto-create CRM depuis les replies.
            </p>
          </div>
        </MotionInView>

        <MotionInView delay={150}>
          <div className="overflow-x-auto rounded-2xl border-2 border-blue-200 bg-white shadow-xl shadow-blue-500/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <th className="px-4 sm:px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-content-secondary">Feature</th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Lemlist
                    <div className="text-[10px] font-mono text-content-tertiary normal-case tracking-normal mt-1">39 €/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Instantly
                    <div className="text-[10px] font-mono text-content-tertiary normal-case tracking-normal mt-1">30 $/mo</div>
                  </th>
                  <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-b from-blue-100 to-cyan-100 text-blue-800 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
                      Recommandé
                    </div>
                    Volia
                    <div className="text-[10px] font-mono text-blue-700 normal-case tracking-normal mt-1">49 €/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-line ${i % 2 === 1 ? 'bg-zinc-50/40' : ''}`}>
                    <td className="px-4 sm:px-6 py-4 text-content-primary font-medium">{row.feature}</td>
                    <td className="px-4 py-4 text-center"><Cell cell={row.lemlist} /></td>
                    <td className="px-4 py-4 text-center"><Cell cell={row.instantly} /></td>
                    <td className="px-4 py-4 text-center bg-gradient-to-b from-blue-50/40 to-cyan-50/30"><Cell cell={row.volia} accent /></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/60">
                  <td className="px-4 sm:px-6 py-5 font-bold text-content-primary">Stack équivalent</td>
                  <td className="px-4 py-5 text-center font-mono font-bold text-rose-600">108 €/mo total</td>
                  <td className="px-4 py-5 text-center text-content-tertiary"></td>
                  <td className="px-4 py-5 text-center font-mono font-bold text-emerald-700 text-lg bg-gradient-to-b from-blue-100/60 to-cyan-100/40">49 €/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </MotionInView>

        <MotionInView delay={300}>
          <div className="mt-10 text-center">
            <a
              href="/signup?plan=pro"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all text-base"
            >
              <Zap size={18} className="text-amber-200" />
              <span>Économisez 59 €/mois + 1 outil de moins</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-xs text-content-tertiary">
              Inclus dans Pro à 49 € · 14 jours d&apos;essai · Migration depuis Lemlist incluse
            </p>
          </div>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 3 — Problème / Solution (Avant Volia / Avec Volia)
// ─────────────────────────────────────────────────────────────────────
function ProblemSolutionSection() {
  const before = [
    'Lemlist 39 € + Instantly 30 $ + Smartlead 39 $ = 108 €/mois',
    'Warmup tool en plus à 49 $/mois pour éviter le spam',
    '3 outils, 3 logins, 3 abonnements à gérer',
    'Export CSV puis import manuel dans le CRM',
    'Replies notées à la main, leads perdus à chaque étape',
  ];
  const after = [
    '49 €/mois (Pro) — cold email illimité, tout inclus',
    'Warmup automatique 28 jours intégré (10 → 200/jour)',
    'Multi-tenant Resend : envoyez depuis VOTRE domaine vérifié',
    'Auto-create CRM : une reply = un deal créé en stage Lead',
    'Templates FR par secteur + opt-out RGPD unifié',
  ];
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Avant / Après
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Le stack outbound. Refait droit.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Vous reconnaissez la colonne de gauche ? Vous payez 3 outils pour le boulot d&apos;un seul.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
          {/* Colonne SANS Volia */}
          <MotionInView delay={100}>
            <div className="h-full p-7 sm:p-8 rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md">
                  <X size={20} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Avant Volia (stack 3 outils)</h3>
              </div>
              <ul className="space-y-4">
                {before.map((line, i) => (
                  <MotionInView key={i} delay={150 + i * 100}>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mt-0.5">
                        <X size={12} className="text-rose-600" strokeWidth={3} />
                      </div>
                      <span className="text-sm sm:text-base text-content-secondary leading-relaxed line-through decoration-rose-300/70 decoration-1">
                        {line}
                      </span>
                    </li>
                  </MotionInView>
                ))}
              </ul>
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
                <h3 className="text-xl sm:text-2xl font-bold text-content-primary">Avec Volia Campagnes</h3>
              </div>
              <ul className="space-y-4">
                {after.map((line, i) => (
                  <MotionInView key={i} delay={200 + i * 100}>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mt-0.5">
                        <Check size={12} className="text-emerald-700" strokeWidth={3} />
                      </div>
                      <span className="text-sm sm:text-base text-content-primary font-medium leading-relaxed">
                        {line}
                      </span>
                    </li>
                  </MotionInView>
                ))}
              </ul>
            </div>
          </MotionInView>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 6 — Use cases (3 personas : Marie founder / Alex sales / Léa agence)
// ─────────────────────────────────────────────────────────────────────
function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Pour qui ?
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Founders, sales, agences.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Trois façons d&apos;utiliser Volia Campagnes. Tous arrêtent leur abonnement Lemlist le même jour.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1 — Marie (large featured) */}
          <MotionInView delay={100} className="lg:col-span-2 lg:row-span-2">
            <div className="group relative h-full p-8 sm:p-10 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Cas client phare
              </div>

              <div className="relative">
                <div className="flex items-center gap-4 mb-6 mt-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 ring-4 ring-white shadow-lg flex items-center justify-center text-white text-xl font-bold">
                    MD
                  </div>
                  <div>
                    <div className="text-lg font-bold text-content-primary">Marie, Founder SaaS B2B</div>
                    <div className="text-sm text-content-tertiary">solo, ticket moyen 6 k€/an</div>
                  </div>
                </div>

                <blockquote className="text-xl sm:text-2xl font-medium text-content-primary leading-snug mb-8">
                  <span className="text-blue-400 text-3xl leading-none">“</span>
                  J&apos;envoie <span className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">200 emails/jour automatiquement</span>. <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">12 % de taux de réponse</span>, 8 RDV/semaine. Le warmup auto a fait le boulot, je n&apos;ai rien configuré.
                  <span className="text-blue-400 text-3xl leading-none">”</span>
                </blockquote>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-200/50">
                  {[
                    { v: '200', l: 'emails/jour' },
                    { v: '8', l: 'RDV/semaine' },
                    { v: '12%', l: 'reply rate' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold font-mono bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stat.v}</div>
                      <div className="text-[11px] text-content-tertiary mt-1">{stat.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MotionInView>

          {/* Card 2 — Alex (sales scale-up) */}
          <MotionInView delay={200}>
            <div className="group h-full p-7 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 ring-2 ring-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                  AR
                </div>
                <div>
                  <div className="text-sm font-bold text-content-primary">Alex, Sales Manager scale-up</div>
                  <div className="text-[11px] text-content-tertiary">équipe de 5 SDR, outbound B2B</div>
                </div>
              </div>
              <blockquote className="text-sm text-content-primary leading-relaxed mb-5">
                <span className="text-cyan-400">“</span>
                Mon équipe envoie <span className="font-semibold">1 000 emails/jour depuis nos 3 domaines warm</span>. <span className="font-bold text-emerald-700">60 % en inbox vs 30 % avant</span>. La rotation multi-inbox est automatique.
                <span className="text-cyan-400">”</span>
              </blockquote>
              <div className="flex items-center gap-2 text-[11px] text-cyan-700 font-semibold">
                <Flame size={12} />
                Multi-inbox + warmup x3 domaines
              </div>
            </div>
          </MotionInView>

          {/* Card 3 — Léa (agence growth) */}
          <MotionInView delay={300}>
            <div className="group h-full p-7 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                  LM
                </div>
                <div>
                  <div className="text-sm font-bold text-content-primary">Léa, Agence growth</div>
                  <div className="text-[11px] text-content-tertiary">12 clients en outbound managé</div>
                </div>
              </div>
              <blockquote className="text-sm text-content-primary leading-relaxed mb-5">
                <span className="text-emerald-400">“</span>
                <span className="font-bold text-emerald-700">12 clients depuis 1 seul compte Volia</span>, chacun avec son domaine vérifié. <span className="font-semibold">-200 €/mois</span> sur ma facture Lemlist agence.
                <span className="text-emerald-400">”</span>
              </blockquote>
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                <Sparkles size={12} />
                Multi-tenant natif = idéal agence
              </div>
            </div>
          </MotionInView>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 7 — Pricing focus Campagnes (encart compact 3 plans)
// ─────────────────────────────────────────────────────────────────────
function PricingFocusSection() {
  const plans = [
    {
      name: 'Solo', price: '19 €', tag: 'Pour tester',
      desc: '500 emails/mois, 1 domaine, warmup inclus.',
      cta: 'Démarrer', href: '/signup?plan=solo',
      featured: false,
    },
    {
      name: 'Pro', price: '49 €', tag: 'Recommandé',
      desc: 'Cold email illimité, multi-inbox, tracking, templates FR.',
      cta: 'Choisir Pro', href: '/signup?plan=pro',
      featured: true,
      bullets: ['Cold email illimité', 'Warmup 28 jours auto', 'Multi-inbox rotation', 'Tracking opens / clicks'],
    },
    {
      name: 'Business', price: '99 €', tag: '+ CRM intégré',
      desc: 'Tout Pro + CRM intégré + auto-create deals depuis replies.',
      cta: 'Choisir Business', href: '/signup?plan=business',
      featured: false,
    },
  ];

  return (
    <section id="pricing-campagnes" className="py-24 px-4 sm:px-6 border-t border-line bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-6xl mx-auto">
        <MotionInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
              Tarification Campagnes
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Cold email illimité dès 49 €.
            </h2>
            <p className="text-content-tertiary text-lg max-w-2xl mx-auto">
              Pas d&apos;add-on, pas de surprise. Annulation 1 clic, migration depuis Lemlist incluse.
            </p>
          </div>
        </MotionInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {plans.map((plan, i) => (
            <MotionInView key={plan.name} delay={i * 100}>
              <div className={`relative h-full p-7 rounded-2xl border-2 transition-all duration-300 ${
                plan.featured
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 via-white to-cyan-50/40 shadow-xl shadow-blue-500/15 scale-[1.02] hover:-translate-y-1'
                  : 'border-line bg-white shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5'
              }`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
                    ★ {plan.tag}
                  </div>
                )}
                <div className="text-xs font-bold uppercase tracking-wider text-content-tertiary mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`text-4xl font-bold font-mono ${plan.featured ? 'bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent' : 'text-content-primary'}`}>{plan.price}</span>
                  <span className="text-sm text-content-tertiary">/mois</span>
                </div>
                <p className="text-sm text-content-secondary leading-relaxed mb-5">{plan.desc}</p>

                {plan.bullets && (
                  <ul className="space-y-2 mb-6">
                    {plan.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-content-primary">
                        <Check size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <a
                  href={plan.href}
                  className={`block w-full text-center px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.featured
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
                      : 'border-2 border-line-hover hover:border-blue-300 text-content-primary hover:bg-blue-50'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </MotionInView>
          ))}
        </div>

        <MotionInView delay={400}>
          <p className="text-center text-xs text-content-tertiary mt-8">
            Tous les plans : warmup automatique inclus · opt-out RGPD géré · support FR · annulation 1 clic
          </p>
        </MotionInView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 8 — Témoignage clé (pull quote sur deliverability / économies)
// ─────────────────────────────────────────────────────────────────────
function PullQuoteSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-line overflow-hidden relative">
      <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none -z-0" />

      <MotionInView className="max-w-4xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-6">
          Témoignage
        </div>
        <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-content-primary leading-snug tracking-tight">
          <span className="text-blue-400 text-5xl leading-none align-top">“</span>
          On payait <span className="font-bold">140 €/mois entre Lemlist, Smartlead et un warmup tool</span>. On a tout viré pour Volia à <span className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">49 €/mois</span>. La deliverability est <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">meilleure</span>, et chaque reply atterrit directement dans notre pipeline CRM.
          <span className="text-blue-400 text-5xl leading-none align-top">”</span>
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 ring-2 ring-white shadow-md flex items-center justify-center text-white font-bold">
            JM
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-content-primary">Julien Martel</div>
            <div className="text-xs text-content-tertiary">Head of Sales, agence growth · Lyon</div>
          </div>
        </div>
      </MotionInView>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page : features bento (6 features killer)
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'envoyer mieux que Lemlist',
  subline: 'Multi-tenant Resend, warmup automatique, auto-create CRM. Trois choses que Lemlist + Instantly + Smartlead ne savent pas faire ensemble.',
  items: [
    {
      icon: 'Globe', featured: true,
      title: 'Multi-tenant Resend natif',
      desc: 'Envoyez depuis VOTRE domaine (DKIM / SPF / DMARC alignés automatiquement). Configuration en 5 min via une UI guidée. Idéal agence : 1 compte Volia, autant de domaines clients que voulu.',
    },
    {
      icon: 'Flame',
      title: 'Warmup automatique 28 jours',
      desc: 'Chauffe progressivement votre domaine (J1 : 10/jour → J28 : 200/jour). Zéro config, zéro tool externe. Lemlist le facture +30 €/mois, chez Volia c\'est inclus.',
    },
    {
      icon: 'Repeat',
      title: 'Multi-inbox rotation',
      desc: 'Répartition automatique des envois sur plusieurs sender domaines pour préserver la réputation. Volume x3 sans dégrader la deliverability.',
    },
    {
      icon: 'MousePointerClick',
      title: 'Tracking opens & clicks',
      desc: 'Pixel tracking + lien tracking sur subdomain dédié. Stats temps réel par séquence, par étape, par template. A/B test des objets natif.',
    },
    {
      icon: 'Workflow',
      title: 'Auto-create CRM depuis replies',
      desc: 'Un prospect répond = un deal créé automatiquement au stage Lead dans Volia CRM. Zéro saisie manuelle, zéro lead perdu. Exclusivité Volia.',
    },
    {
      icon: 'BookOpen', wide: true,
      title: 'Bibliothèque 20+ templates B2B FR',
      desc: 'Templates cold email français testés sur du volume réel : restauration, BTP, agences web, e-commerce, SaaS, immobilier… Chaque template a 3 variantes (intro, relance, finale). Importez aussi les vôtres.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'Globe', title: 'Connectez votre domaine', desc: 'Setup DKIM / SPF / DMARC en 5 min via une UI guidée Resend. Vérification automatique de l\'alignement.' },
  { icon: 'Flame', title: 'Lancez le warmup', desc: 'Volia chauffe votre domaine sur 28 jours (10 → 200 emails/jour). Aucune action de votre part, monitoring intégré.' },
  { icon: 'Send', title: 'Démarrez vos séquences', desc: 'Choisissez un template FR ou partez de zéro. Les replies créent automatiquement des deals dans le CRM.' },
];

const FAQ = [
  {
    q: 'Combien d\'emails puis-je envoyer par jour ?',
    a: 'Pendant le warmup (28 jours) : montée progressive de 10 à 200 emails/jour. Une fois warm, le quota dépend de votre plan : Solo 500 emails/mois, Pro illimité (jusqu\'à 200/jour par domaine), Business illimité avec multi-domaines. La limite est avant tout votre deliverability — si le bounce rate dépasse 2 %, Volia met en pause automatiquement.',
  },
  {
    q: 'Comment éviter le spam folder ?',
    a: 'Quatre garde-fous : (1) warmup automatique 28 jours obligatoire avant tout envoi en volume, (2) vérification DKIM / SPF / DMARC à la connexion du domaine, (3) monitoring bounce rate avec pause auto si > 2 %, (4) opt-out unifié qui préserve la réputation du domaine sur la durée. Résultat moyen beta : 62 % d\'ouverture, 94 % d\'inbox rate.',
  },
  {
    q: 'Qu\'est-ce que le warmup d\'un domaine email ?',
    a: 'Le warmup consiste à augmenter progressivement le volume d\'envoi d\'un nouveau domaine pour que Google / Outlook le considèrent comme légitime. Sans warmup, un domaine neuf qui envoie 100 emails dès J1 finit en spam. Volia simule des échanges et augmente la cadence de 10 à 200 emails/jour sur 28 jours. Lemlist le vend +30 €/mois, Volia l\'inclut dans tous les plans.',
  },
  {
    q: 'Quelle différence avec Lemlist ?',
    a: 'Trois différences majeures : (1) Volia est multi-tenant Resend natif (vous envoyez depuis VOTRE domaine, Lemlist passe par son infra), (2) warmup inclus vs payant en add-on, (3) auto-create CRM depuis replies — exclusivité Volia. Côté prix : Lemlist 39 € pour 50 emails/jour, Volia Pro 49 € pour cold email illimité + warmup + tracking.',
  },
  {
    q: 'Puis-je utiliser mon propre domaine d\'envoi ?',
    a: 'Oui, c\'est même obligatoire et c\'est la base de Volia Campagnes. Vous connectez votre domaine (ex: votre-saas.fr), Volia vérifie les enregistrements DNS DKIM / SPF / DMARC en 5 min, et tous les envois partent depuis ce domaine. Vous gardez votre identité de marque et votre réputation reste la vôtre.',
  },
  {
    q: 'Comment fonctionne l\'auto-create CRM depuis les replies ?',
    a: 'Dès qu\'un prospect répond à une séquence, Volia crée automatiquement : (1) un contact dans le CRM avec ses infos enrichies, (2) un deal au stage "Lead" avec la séquence d\'origine en source, (3) une activité "Reply reçue" datée. Vous voyez la conversation complète dans le CRM. Zéro copier-coller, zéro lead qui passe à la trappe. Disponible sur le plan Business.',
  },
  {
    q: 'Comment fonctionne l\'opt-out RGPD ?',
    a: 'Lien de désinscription ajouté automatiquement en footer de chaque email (impossible à désactiver). L\'opt-out alimente une blocklist permanente : un prospect désinscrit ne sera jamais recontacté, même via une autre séquence ou un autre compte Volia. Mention CNIL pré-remplie, base légale "intérêt légitime" documentée, registre des oppositions tenu automatiquement.',
  },
  {
    q: 'Les templates sont inclus ou à créer ?',
    a: 'Plus de 20 templates inclus, classés par secteur B2B (restauration, BTP, agences digitales, immobilier, e-commerce, SaaS, hôtellerie, santé, juridique…). Chaque template a 3 variantes (intro cold, relance, finale) et a été testé sur du volume réel. Vous pouvez aussi importer vos propres templates ou partir d\'une page blanche.',
  },
  {
    q: 'Vous prévoyez du SMS multi-canal ?',
    a: 'Oui, le module SMS via Twilio arrive en Q3 2026. La phase 1 se concentre exclusivement sur l\'email pour atteindre une deliverability irréprochable. Les comptes Business auront accès en preview dès l\'ouverture beta.',
  },
  {
    q: 'Migration depuis Lemlist possible ?',
    a: 'Oui, en 3 clics : (1) export CSV de vos contacts depuis Lemlist, (2) import dans Volia avec auto-mapping des variables {{firstName}} → {{prenom}}, (3) Volia reconstruit vos séquences existantes à l\'identique. Migration assistée incluse sur Pro et Business — on s\'occupe du transfert pour vous si vous le souhaitez.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────
const breadcrumbs = breadcrumbSchema([
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits/prospection' },
  { label: 'Campagnes' },
]);

const product = {
  '@context': 'https://schema.org',
  ...productSchema({
    name: 'Volia Campagnes',
    description: 'Cold email B2B illimité, warmup automatique 28 jours, multi-tenant Resend natif, auto-create CRM depuis replies. Alternative française à Lemlist + Instantly + Smartlead. À partir de 49 €/mois.',
    url: PAGE_URL,
    priceFrom: 49,
  }),
};

export default function CampagnesProductPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />

      <ProductPageLayout
        module="campagnes"
        status="BETA"
        hero={{
          eyebrow: 'Alternative française à Lemlist + Instantly',
          h1Before: 'Cold email B2B qui finit en',
          h1Highlight: 'Inbox,',
          h1After: 'pas en Spam.',
          subtitle: (
            <>
              Lemlist 39 €. Instantly 30 $. <strong className="text-content-primary font-semibold">Volia Campagnes : inclus dans Pro à 49 €</strong>. Warmup auto 28 jours + multi-inbox + <strong className="text-emerald-700 font-semibold">auto-create CRM depuis les replies</strong>.
            </>
          ),
          ctaPrimary: { label: 'Démarrer gratuitement', href: '/signup?plan=pro' },
          ctaSecondary: { label: 'Voir une démo en direct', href: '#demo' },
          trust: [
            (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Warmup 28 jours auto</>),
            'Multi-domaines Resend',
            'RGPD opt-out 1 clic',
            'Auto-create CRM',
          ],
          mockup: <HeroMockup />,
        }}
        afterHero={<SocialProofSection />}
        features={FEATURES}
        afterFeatures={
          <>
            <ComparisonTableSection />
            <UseCasesSection />
          </>
        }
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Campagnes consomme les prospects de Prospection et alimente le CRM dès qu\'un prospect répond. Boucle complète, zéro copier-coller.',
          otherModules: [
            { module: 'prospection', direction: 'in', desc: 'La source de vos prospects. 287 k+ entreprises FR, 150+ secteurs, emails enrichis et scorés.', cta: 'Découvrir Prospection' },
            { module: 'crm', direction: 'out', desc: 'Chaque reply devient un deal au stage Lead. Pipeline Kanban natif Volia. Beta privée Q3 2026.', cta: 'Rejoindre la beta' },
          ],
        }}
        pricingBanner={<ProblemSolutionSection />}
        pricing={{
          label: 'Inclus dans Pro (49 €) et Business (99 €)',
          subtext: 'Pro = cold email illimité + warmup + tracking + multi-inbox. Business = Pro + CRM intégré + auto-create deals depuis replies. Pas d\'add-on caché, annulation 1 clic.',
          cta: 'Voir le détail des plans',
          ctaHref: '#pricing-campagnes',
        }}
        beforeFaq={
          <>
            <PricingFocusSection />
            <PullQuoteSection />
          </>
        }
        faq={FAQ}
        finalCta={{
          title: 'Du cold email qui marche, au prix d\'un café.',
          subtitle: 'Stack divisé par 3, deliverability ×2. Templates prêts, warmup auto, replies qui atterrissent dans le CRM — vous appuyez sur Play.',
          primary: { label: 'Commencer gratuitement', href: '/signup?plan=pro' },
          secondary: { label: 'Voir une démo live', href: '#demo' },
          trust: 'Inclus dans Pro · 14 jours d\'essai · Migration Lemlist offerte · RGPD by default',
        }}
      />
    </>
  );
}
