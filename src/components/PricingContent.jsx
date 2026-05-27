'use client';

// ─────────────────────────────────────────────────────────────────────
// /pricing — page tarification standalone Volia (client component)
// ─────────────────────────────────────────────────────────────────────
// Page riche dédiée au SEO ("tarifs volia", "pricing volia",
// "comparatif plans") + landing pour ads/footers/blog.
//
// Sections :
//   1. Hero + toggle Mensuel/Annuel
//   2. 4 cards plans
//   3. Banner économies estimées
//   4. Tableau comparatif détaillé (le killer)
//   5. Guide "Quel plan pour vous ?" (4 personas)
//   6. Strip trust signals communs
//   7. Comparatif stack concurrents
//   8. FAQ pricing
//   9. CTA final
//
// Forcé en light mode (cohérence pages marketing Volia).
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, Crown, Star, Shield, Zap, ChevronDown, ArrowRight,
  Sparkles, Rocket, Briefcase, Building2, GraduationCap, TrendingUp,
  CreditCard, MailCheck, RefreshCw, Users as UsersIcon, Globe,
  Headphones, Calendar, Lock, ServerCrash, FileText,
} from 'lucide-react';
import { PLANS, VISIBLE_PLANS } from '@/lib/plans';
import { useForceLightTheme } from '@/lib/use-force-light-theme';
import MotionInView from '@/components/MotionInView';
import MarketingHeader from '@/components/MarketingHeader';
import ReaderFooter from '@/components/ReaderFooter';
import BookDemoButton from '@/components/BookDemoButton';

// ─── Helpers ────────────────────────────────────────────────────
function formatPrice(cents) {
  if (cents === 0) return '0';
  return Math.round(cents / 100).toString();
}

function formatEuro(cents) {
  if (cents === 0) return '0 €';
  return `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;
}

// Couleurs / styling par plan
const PLAN_VISUALS = {
  free:    { ring: 'border-line', bg: 'bg-surface-card', accent: 'text-content-tertiary', badge: null },
  solo:    { ring: 'border-violet-200', bg: 'bg-violet-50/40', accent: 'text-violet-600', badge: null },
  pro:     { ring: 'border-violet-500 ring-2 ring-violet-500/20', bg: 'bg-gradient-to-b from-violet-50 via-violet-50/60 to-white', accent: 'text-violet-700', badge: 'POPULAIRE' },
  business:{ ring: 'border-indigo-300', bg: 'bg-gradient-to-br from-violet-100/60 via-white to-indigo-100/60', accent: 'text-indigo-700', badge: null },
};

const PLAN_TAGLINES = {
  free: 'Pour découvrir Volia',
  solo: 'Pour freelances et consultants',
  pro: 'Pour PME et agences',
  business: 'Pour équipes outbound',
};

// Modules inclus par plan : SEUL Business débloque les 4 modules.
// Starter/Solo/Pro restent sur Prospection uniquement (Pro = juste plus de
// volume vs Solo). C'est ce qui justifie l'écart Pro 49€ → Business 149€.
const PLAN_MODULES = {
  free:     { prospection: 'limitée', campagnes: false, crm: false, formulaires: false },
  solo:     { prospection: true,      campagnes: false, crm: false, formulaires: false },
  pro:      { prospection: true,      campagnes: false, crm: false, formulaires: false },
  business: { prospection: true,      campagnes: true,  crm: true,  formulaires: true },
};

// ─── Section 4 : Tableau comparatif — données ───────────────────
// Sections collapsibles avec rows.
const COMPARE_SECTIONS = [
  {
    title: 'Module Prospection',
    rows: [
      ['Prospects par mois', '100', '1 000', '5 000', '10 000'],
      ['Enrichissements/mois', '20', '400', '1 000', '10 000'],
      ['Vérification email (MillionVerifier)', false, false, '500/mo', '5 000/mo'],
      ['Cascade waterfall (7 sources)', true, true, true, true],
      ['Recherche IA langage naturel', true, true, true, true],
      ['Exports CSV', '5/mois', 'Illimité', 'Illimité', 'Illimité'],
      ['Dossiers / listes', '3', '10', 'Illimité', 'Illimité'],
      ['287 000+ entreprises FR', true, true, true, true],
      ['101 départements (DROM inclus)', true, true, true, true],
      ['150+ catégories B2B', true, true, true, true],
    ],
  },
  {
    title: 'Module Campagnes (cold email)',
    rows: [
      ['Cold email illimité', false, false, true, true],
      ['Domaines d’envoi multi-tenant', false, false, true, true],
      ['Warmup automatique 28 jours', false, false, true, true],
      ['Templates email B2B', false, false, '20+', '20+'],
      ['Tracking opens / clicks', false, false, true, true],
      ['Réponses auto vers CRM', false, false, false, true],
      ['SMS (bientôt Q3 2026)', '—', '—', '—', '—'],
    ],
  },
  {
    title: 'Module CRM',
    rows: [
      ['Kanban drag & drop', false, false, false, true],
      ['Auto-create deals depuis replies', false, false, false, true],
      ['Timeline 360° par contact', false, false, false, true],
      ['Activities (notes, calls, meetings)', false, false, false, true],
      ['Multi-pipelines (Q4 2026)', '—', '—', '—', '—'],
    ],
  },
  {
    title: 'Module Formulaires',
    rows: [
      ['Nombre de formulaires', false, '1', '5', 'Illimité'],
      ['Submissions / mois', false, '100', '1 000', 'Illimité'],
      ['Builder drag-drop + multi-step', false, true, true, true],
      ['Logique conditionnelle AND/OR', false, true, true, true],
      ['Bridges natifs CRM + Campagnes', false, true, true, true],
      ['QR code + embed iframe', false, true, true, true],
      ['Webhooks sortants', false, true, true, true],
      ['Templates B2B prêts à l’emploi', false, true, true, true],
    ],
  },
  {
    title: 'Support & garanties',
    rows: [
      ['Support email', 'Communauté', '48 h', '24 h', 'Prioritaire'],
      ['Onboarding personnalisé', false, false, false, true],
      ['API publique REST', false, true, true, true],
      ['Webhooks + Zapier / Make', false, true, true, true],
      ['Multi-utilisateurs (à venir)', false, false, false, true],
      ['Conforme RGPD France', true, true, true, true],
      ['Données hébergées en Europe', true, true, true, true],
    ],
  },
];

// ─── Section 5 : Personas ────────────────────────────────────────
const PERSONAS = [
  {
    icon: GraduationCap,
    color: 'from-zinc-500 to-zinc-600',
    title: 'Je découvre Volia',
    plan: 'free',
    planLabel: 'Starter',
    description: 'Tester sur 100 prospects sans engagement, voir si la qualité des emails correspond à mes attentes.',
  },
  {
    icon: Briefcase,
    color: 'from-violet-500 to-violet-600',
    title: 'Je suis freelance ou consultant',
    plan: 'solo',
    planLabel: 'Solo · 19 €/mo',
    description: '1 000 prospects/mois, exports illimités, parfait pour du cold outreach solo et constant.',
  },
  {
    icon: Rocket,
    color: 'from-violet-600 to-indigo-600',
    title: 'Je dirige une agence ou PME',
    plan: 'pro',
    planLabel: 'Pro · 49 €/mo',
    description: '5 000 prospects + cold email pro + warmup auto + vérif email — la stack outbound complète.',
    highlight: true,
  },
  {
    icon: Building2,
    color: 'from-indigo-600 to-blue-600',
    title: 'Je scale mon outbound',
    plan: 'business',
    planLabel: 'Business · 149 €/mo (promo) puis 179 €',
    description: '10 000 prospects + multi-utilisateurs (équipes/RBAC) + volumes 10× + API + onboarding perso. Promo lancement : 149 €/mois la 1ʳᵉ année.',
  },
];

// ─── Section 6 : Trust strip ─────────────────────────────────────
const TRUST_SIGNALS = [
  { icon: Shield, label: 'Conforme RGPD France' },
  { icon: Globe, label: 'Données hébergées dans l’UE' },
  { icon: RefreshCw, label: 'Annulation en 1 clic' },
  { icon: Calendar, label: 'Sans engagement de durée' },
  { icon: TrendingUp, label: 'Mise à jour du plan à tout moment' },
  { icon: Headphones, label: 'Support en français' },
  { icon: FileText, label: 'CGV claires + DPA disponible', href: '/dpa' },
  { icon: Lock, label: 'Stripe sécurisé (PCI DSS)' },
];

// ─── Section 7 : Stack concurrents ───────────────────────────────
const STACK_COMPETITORS = [
  { name: 'Apollo.io',     price: 99,  usage: 'Prospection' },
  { name: 'Lemlist',       price: 39,  usage: 'Cold email' },
  { name: 'Smartlead',     price: 39,  usage: 'Warmup' },
  { name: 'HubSpot Starter', price: 90, usage: 'CRM' },
  { name: 'Hunter',        price: 49,  usage: 'Email finder' },
];

// ─── Section 8 : FAQ pricing ─────────────────────────────────────
const FAQ_PRICING = [
  {
    q: 'C\'est vraiment 19€/mois ? Y a un piège ?',
    a: 'Non. Solo c\'est 19€/mois, point. Pas de frais de setup, pas de surcoût à l\'export. La seule limite, c\'est le nombre de prospects/mois — au-delà, la recherche se met en pause jusqu\'au renouvellement (on ne facture rien en plus, jamais).',
  },
  {
    q: 'Essai gratuit ?',
    a: '14 jours d\'accès complet au plan Pro sans CB (5 000 prospects, cascade waterfall, campagnes). À J+14, le compte bascule sur Starter gratuit à vie (100 prospects/mois). Zéro prélèvement automatique sans votre accord explicite.',
  },
  {
    q: 'Je peux changer de plan quand je veux ?',
    a: 'Oui, en 1 clic depuis les paramètres. Upgrade ou downgrade, le pro-rata se calcule tout seul — vous payez juste la différence du mois en cours.',
  },
  {
    q: 'Et si j\'atteins la limite mensuelle ?',
    a: 'Alerte email à 80% et 100%. Au-delà, la recherche se met en pause jusqu\'au renouvellement ou jusqu\'à l\'upgrade. Pas de facture surprise, jamais.',
  },
  {
    q: 'Annuel -2 mois, comment ça marche ?',
    a: 'Vous payez 10 mois, vous accédez 12. Exemple Pro : 490€/an au lieu de 588€, soit 98€ gardés dans votre poche. Facturé en une fois (CB ou virement).',
  },
  {
    q: 'Comment je résilie ?',
    a: 'Paramètres > Plan > "Gérer mon abonnement". 1 clic, sans justification, sans email passif-agressif. L\'accès reste actif jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Virement bancaire possible ?',
    a: 'Oui sur les plans annuels Business+. Envoyez votre SIRET à contact@volia.fr, on vous fait une facture pro forma sous 24h.',
  },
  {
    q: 'Tout est vraiment inclus dans le prix ?',
    a: 'Oui. Accès aux 287 000+ entreprises FR (101 départements × 150+ secteurs), cascade waterfall multi-sources, exports CSV, emails transactionnels. Aucune option cachée derrière un paywall.',
  },
  {
    q: 'Le CRM est vraiment dans le plan Business ?',
    a: 'Oui, intégralement. Kanban drag-and-drop, deals auto-créés depuis vos réponses email, timeline 360° par contact, activities (notes, calls, meetings). Vous pouvez désinstaller HubSpot.',
  },
  {
    q: 'Moyens de paiement ?',
    a: 'CB (Visa, Mastercard, Amex) via Stripe sur tous les plans. SEPA et virement sur l\'annuel Business+. PayPal sur demande.',
  },
  {
    q: 'Remboursement ?',
    a: 'Satisfait ou remboursé 14 jours sur le premier paiement, sans justification — un email à contact@volia.fr suffit. Au-delà, la résiliation 1 clic vous laisse profiter de la période payée.',
  },
  {
    q: 'Tarif assos / étudiants ?',
    a: '-50% sur Solo ou Pro pour les assos loi 1901 et les étudiants (sur justificatif). Écrivez à contact@volia.fr depuis votre email institutionnel.',
  },
];

// ─── Composant principal ─────────────────────────────────────────
export default function PricingContent() {
  useForceLightTheme();
  const [period, setPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);
  const isYearly = period === 'yearly';

  // Économies totales annuelles si l'user prend tous les plans payants en annuel
  const yearlySavingsByPlan = {
    solo: PLANS.solo.price * 12 - PLANS.solo.priceYearly,
    pro: PLANS.pro.price * 12 - PLANS.pro.priceYearly,
    business: PLANS.business.price * 12 - PLANS.business.priceYearly,
  };
  const maxSavings = Math.max(...Object.values(yearlySavingsByPlan));

  // Stack concurrents : total
  const competitorTotalMo = STACK_COMPETITORS.reduce((acc, c) => acc + c.price, 0);
  const economyVsStack = competitorTotalMo - 149; // vs Business 149€ (promo) — seul plan qui inclut les 4 modules

  // Helper rendu cellule comparatif
  function renderCell(value) {
    if (value === true) return <Check size={16} className="text-emerald-500 mx-auto" aria-label="Inclus" />;
    if (value === false) return <X size={16} className="text-content-muted mx-auto" aria-label="Non inclus" />;
    return <span className="text-xs text-content-secondary">{value}</span>;
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <MarketingHeader />

      <main className="pt-24 pb-12">
        {/* ─── 1. HERO ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12">
          <MotionInView>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs font-medium text-violet-700 mb-6">
              <Sparkles size={12} />
              Les prix. Sans bullshit.
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Le prix d&apos;un café par jour<br />pour ton outil principal<br />de prospection.
            </h1>
            <p className="text-lg sm:text-xl text-content-secondary leading-relaxed max-w-2xl mx-auto mb-8">
              <strong className="text-content-primary">0&nbsp;€</strong> pour tester (100 prospects offerts, sans CB).
              <strong className="text-content-primary"> 19&nbsp;€/mois</strong> pour scaler.
              <strong className="text-content-primary"> 149&nbsp;€/mois</strong> pour les équipes (Prospection + Campagnes + CRM + Formulaires).
            </p>

            {/* Toggle Mensuel / Annuel */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-line bg-surface-card shadow-sm mb-6">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                  !isYearly
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setPeriod('yearly')}
                className={`px-5 py-2 text-sm font-medium rounded-full transition flex items-center gap-2 ${
                  isYearly
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                Annuel
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isYearly ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  -2 MOIS
                </span>
              </button>
            </div>

            {/* Label économies CONCRET sous le toggle — chiffres en euros
                réels par plan (vs "-2 mois" abstrait). Boost conversion
                annuel attendu : +5-10%. */}
            <p
              className="text-sm font-semibold text-emerald-700 mb-2"
              aria-live="polite"
            >
              {isYearly
                ? `Vous économisez jusqu'à ${formatEuro(maxSavings)}/an`
                : `Passez à l'annuel et économisez jusqu'à ${formatEuro(maxSavings)}/an`}
            </p>
            <p className="text-xs text-content-tertiary mb-6">
              Solo : -38€/an · Pro : -98€/an · Business : -198€/an
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-content-tertiary">
              <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Sans CB pour Starter</span>
              <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Annulation 1 clic</span>
              <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> RGPD France</span>
            </div>
          </MotionInView>
        </section>

        {/* ─── 2. CARDS PLANS ────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VISIBLE_PLANS.map((planId, idx) => {
              const plan = PLANS[planId];
              const visuals = PLAN_VISUALS[planId];
              const modules = PLAN_MODULES[planId];
              const price = isYearly ? plan.priceYearly : plan.price;
              const isFree = plan.price === 0;
              const cta = isFree ? 'Commencer gratuitement' : `Commencer avec ${plan.name}`;
              const ctaHref = `/signup?plan=${planId}${!isFree ? `&period=${period}` : ''}`;

              return (
                <MotionInView key={planId} delay={idx * 80}>
                  <div className={`relative h-full p-6 rounded-2xl border ${visuals.ring} ${visuals.bg} flex flex-col`}>
                    {visuals.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-semibold rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                        <Crown size={11} />
                        {visuals.badge}
                      </div>
                    )}

                    <h3 className={`text-lg font-semibold mb-1 ${visuals.accent}`}>{plan.name}</h3>
                    <p className="text-xs text-content-tertiary mb-5 min-h-[32px]">{PLAN_TAGLINES[planId]}</p>

                    {/* PRIX — gestion spéciale Business avec promo lancement.
                        Sur monthly : affiche prix promo en gros + prix normal barré.
                        Sur yearly : affiche prix yearly normal (pas de promo annual). */}
                    {planId === 'business' && !isYearly && plan.promo ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-4xl font-bold text-content-primary">
                            {formatPrice(plan.promo.displayPrice)}
                            <span className="text-2xl text-content-secondary">€</span>
                          </span>
                          <span className="text-content-tertiary text-sm">/mois</span>
                          <span className="text-lg text-content-muted line-through font-medium">
                            {formatPrice(plan.displayPrice)} €
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-emerald-700 mb-1">
                          🎉 {plan.promo.label}
                        </p>
                        <p className="text-[11px] text-content-tertiary mb-5">
                          {plan.promo.sublabel}
                        </p>
                      </>
                    ) : planId === 'business' && isYearly ? (
                      <>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-4xl font-bold text-content-primary">
                            {formatPrice(plan.displayPriceYearly)}
                            <span className="text-2xl text-content-secondary">€</span>
                          </span>
                          <span className="text-content-tertiary text-sm">/an</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-medium mb-5">
                          ~{Math.round(plan.displayPriceYearly / 1200)} €/mois · 2 mois offerts
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-4xl font-bold text-content-primary">
                            {formatPrice(price)}
                            <span className="text-2xl text-content-secondary">€</span>
                          </span>
                          <span className="text-content-tertiary text-sm">
                            {isYearly && !isFree ? '/an' : '/mois'}
                          </span>
                        </div>

                        {isYearly && !isFree ? (
                          <p className="text-[11px] text-emerald-600 font-medium mb-5">
                            ~{Math.round(plan.priceYearly / 1200)} €/mois · économisez {formatEuro(yearlySavingsByPlan[planId])}
                          </p>
                        ) : !isFree ? (
                          <p className="text-[11px] text-content-tertiary mb-5">
                            ou {formatPrice(plan.priceYearly)} €/an (économisez {formatEuro(yearlySavingsByPlan[planId])})
                          </p>
                        ) : (
                          <p className="text-[11px] text-content-tertiary mb-5">Sans carte bancaire</p>
                        )}
                      </>
                    )}

                    <Link
                      href={ctaHref}
                      className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition mb-5 ${
                        planId === 'pro'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
                          : planId === 'business'
                            ? 'bg-content-primary text-surface-base hover:bg-content-secondary'
                            : 'border border-line-hover hover:bg-surface-elevated text-content-secondary'
                      }`}
                    >
                      {cta}
                    </Link>

                    {/* HIGHLIGHT PRO — la "killer feature" : Pro est le SEUL plan
                        abordable qui débloque la suite complète. Affiché en card
                        séparée violette, plus visible que les badges modules. */}
                    {plan.unlocksModules && (
                      <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-300">
                        <p className="text-[11px] font-bold text-violet-900 mb-1 flex items-center gap-1">
                          <Star size={11} fill="currentColor" /> Débloque la suite complète
                        </p>
                        <p className="text-[11px] text-violet-700 leading-snug">
                          CRM · Campagnes email · Formulaires — tous inclus
                        </p>
                      </div>
                    )}

                    {/* Modules débloqués — version simplifiée (badges courts) */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        modules.prospection === true
                          ? 'bg-violet-100 text-violet-700'
                          : modules.prospection === 'limitée'
                            ? 'bg-zinc-100 text-zinc-600'
                            : 'bg-zinc-50 text-content-muted'
                      }`}>
                        ✓ Prospection{modules.prospection === 'limitée' ? ' (limitée)' : ''}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        modules.campagnes
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-zinc-50 text-content-muted'
                      }`}>
                        {modules.campagnes ? '✓' : '✗'} Campagnes
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        modules.crm
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-zinc-50 text-content-muted'
                      }`}>
                        {modules.crm ? '✓' : '✗'} CRM
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        modules.formulaires
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-zinc-50 text-content-muted'
                      }`}>
                        {modules.formulaires ? '✓' : '✗'} Formulaires
                        {modules.formulaires === 'solo' ? ' (1)' : modules.formulaires === 'pro' ? ' (5)' : ''}
                      </span>
                    </div>

                    {/* "Tout inclus dans X +" intro avant les delta features.
                        Le pattern simplifie radicalement la lecture cross-plans :
                        plus besoin de comparer les 4 colonnes, on voit juste
                        ce qui s'ajoute. */}
                    {plan.inheritsFrom && PLANS[plan.inheritsFrom] && (
                      <p className="text-[11px] font-semibold text-content-secondary mb-3 pb-3 border-b border-line">
                        ✓ Tout inclus dans {PLANS[plan.inheritsFrom].name} +
                      </p>
                    )}

                    {/* Delta features list — court et focalisé */}
                    <div className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-2">
                          <Check size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-content-secondary leading-relaxed">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </MotionInView>
              );
            })}
          </div>

          {/* Help line sous les cards — booking démo si hésitation */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm text-content-secondary">
              Vous hésitez sur le plan adapté à votre besoin ?
            </p>
            <BookDemoButton
              label="Une question ? Réservez une démo"
              variant="secondary"
              size="sm"
              source="pricing_cards"
            />
          </div>
        </section>

        {/* ─── 3. BANNER ÉCONOMIES ─────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <div className={`rounded-2xl border p-5 sm:p-6 text-center transition ${
            isYearly
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-violet-200 bg-violet-50/60'
          }`}>
            {isYearly ? (
              <p className="text-sm sm:text-base text-content-secondary">
                <Check size={16} className="inline -mt-0.5 mr-1.5 text-emerald-600" />
                Vous économisez jusqu&apos;à{' '}
                <strong className="text-emerald-700">{formatEuro(maxSavings)}/an</strong>{' '}
                vs la facturation mensuelle — soit 2 mois offerts.
              </p>
            ) : (
              <p className="text-sm sm:text-base text-content-secondary">
                <Sparkles size={16} className="inline -mt-0.5 mr-1.5 text-violet-600" />
                Passez à l&apos;annuel pour économiser jusqu&apos;à{' '}
                <strong className="text-violet-700">{formatEuro(maxSavings)}/an</strong>{' '}
                (2 mois offerts sur le plan Business).
              </p>
            )}
          </div>
        </section>

        {/* ─── 4. TABLEAU COMPARATIF DÉTAILLÉ ──────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <MotionInView>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-violet-600 mb-3">COMPARATIF DÉTAILLÉ</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Tout, plan par plan.
              </h2>
              <p className="text-content-tertiary text-base max-w-xl mx-auto">
                Zéro feature cachée derrière un paywall. Si c&apos;est dans le tableau, c&apos;est dans le plan.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-line bg-surface-card shadow-sm">
              <table className="w-full min-w-[720px]">
                <thead className="sticky top-0 bg-surface-card z-10 border-b border-line">
                  <tr>
                    <th className="text-left text-xs font-semibold text-content-tertiary uppercase tracking-wider px-5 py-4 w-[40%]">
                      Fonctionnalités
                    </th>
                    {VISIBLE_PLANS.map((planId) => (
                      <th key={planId} className="text-center px-3 py-4 w-[15%]">
                        <div className="text-sm font-bold text-content-primary">{PLANS[planId].name}</div>
                        <div className="text-[11px] text-content-tertiary mt-0.5">
                          {PLANS[planId].price === 0 ? 'Gratuit' : `${formatPrice(PLANS[planId].price)} €/mo`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_SECTIONS.map((section) => (
                    <ComparisonSection key={section.title} section={section} renderCell={renderCell} />
                  ))}
                </tbody>
              </table>
            </div>
          </MotionInView>
        </section>

        {/* ─── 5. PERSONAS — Quel plan pour vous ? ─────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <MotionInView>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-violet-600 mb-3">GUIDE DE CHOIX</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Lequel pour vous ?
              </h2>
              <p className="text-content-tertiary text-base max-w-xl mx-auto">
                Choisissez au feeling. Vous changez d&apos;avis demain ? 1 clic et c&apos;est fait.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PERSONAS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <MotionInView key={p.plan} delay={idx * 80}>
                    <div className={`h-full p-6 rounded-2xl border transition hover:shadow-lg ${
                      p.highlight
                        ? 'border-violet-300 bg-gradient-to-b from-violet-50/60 to-white shadow-md'
                        : 'border-line bg-surface-card'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-md`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-content-primary mb-1">{p.title}</h3>
                      <p className={`text-xs font-medium mb-3 ${p.highlight ? 'text-violet-700' : 'text-content-tertiary'}`}>
                        {p.planLabel}
                        {p.highlight && <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-violet-700"><Star size={9} fill="currentColor" /> POPULAIRE</span>}
                      </p>
                      <p className="text-xs text-content-secondary leading-relaxed mb-5">
                        {p.description}
                      </p>
                      <Link
                        href={`/signup?plan=${p.plan}&period=${period}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                          p.highlight ? 'text-violet-700 hover:text-violet-800' : 'text-content-secondary hover:text-content-primary'
                        }`}
                      >
                        Choisir ce plan <ArrowRight size={12} />
                      </Link>
                    </div>
                  </MotionInView>
                );
              })}
            </div>

            {/* CTA booking démo sous les personas — friction zéro pour le profil "pas sûr" */}
            <div className="mt-10 flex justify-center">
              <BookDemoButton
                label="Pas sûr ? Réservez une démo perso"
                variant="primary"
                size="md"
                source="pricing_personas"
              />
            </div>
          </MotionInView>
        </section>

        {/* ─── 6. TRUST STRIP ─────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <MotionInView>
            <div className="rounded-2xl border border-line bg-surface-card p-6 sm:p-8">
              <h2 className="text-center text-base font-semibold text-content-primary mb-6">
                Tout est inclus dans chaque plan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {TRUST_SIGNALS.map((sig) => {
                  const Icon = sig.icon;
                  const inner = (
                    <>
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                        <Icon size={16} className="text-violet-600" />
                      </div>
                      <span className="text-xs text-content-secondary leading-tight">{sig.label}</span>
                    </>
                  );
                  return sig.href ? (
                    <Link
                      key={sig.label}
                      href={sig.href}
                      className="flex flex-col items-center text-center gap-2 hover:text-content-primary transition"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={sig.label} className="flex flex-col items-center text-center gap-2">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </MotionInView>
        </section>

        {/* ─── 7. STACK CONCURRENTS ───────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
          <MotionInView>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-violet-600 mb-3">VS LA STACK TRADITIONNELLE</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                1 outil au lieu de 5
              </h2>
              <p className="text-content-tertiary text-base max-w-xl mx-auto">
                Prospection + Campagnes + CRM dans la même app — pour 3× moins cher.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Stack traditionnelle */}
              <div className="p-6 rounded-2xl border border-line bg-surface-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-4">
                  Stack outbound typique
                </p>
                <div className="space-y-2.5 mb-4">
                  {STACK_COMPETITORS.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="text-content-secondary">
                        <strong className="text-content-primary">{c.name}</strong>
                        <span className="text-content-tertiary text-xs ml-2">· {c.usage}</span>
                      </span>
                      <span className="text-content-secondary font-medium">{c.price} €/mo</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-content-primary">Total mensuel</span>
                  <span className="text-2xl font-bold text-content-primary">
                    ~{competitorTotalMo} €<span className="text-sm font-normal text-content-tertiary">/mo</span>
                  </span>
                </div>
                <p className="text-[11px] text-content-tertiary mt-2">5 outils silotés · 5 abonnements · 5 logins</p>
              </div>

              {/* Volia Business — SEUL plan qui débloque les 4 modules */}
              <div className="p-6 rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 via-violet-50/40 to-indigo-50 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={14} className="text-violet-600" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                    Volia Business
                  </p>
                </div>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-secondary">
                      <strong className="text-content-primary">Prospection</strong>
                      <span className="text-content-tertiary text-xs ml-2">· 10 000 prospects/mo</span>
                    </span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-secondary">
                      <strong className="text-content-primary">Campagnes</strong>
                      <span className="text-content-tertiary text-xs ml-2">· Cold email + warmup</span>
                    </span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-secondary">
                      <strong className="text-content-primary">CRM intégré</strong>
                      <span className="text-content-tertiary text-xs ml-2">· Kanban + timeline</span>
                    </span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-secondary">
                      <strong className="text-content-primary">Email finder</strong>
                      <span className="text-content-tertiary text-xs ml-2">· Vérif MillionVerifier</span>
                    </span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                </div>
                <div className="border-t border-violet-200 pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-content-primary">Total mensuel</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                      149 €<span className="text-sm font-normal text-content-tertiary">/mo</span>
                    </span>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">🎉 promo 12 mois (puis 179 €)</div>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                  Économie : ~{economyVsStack} €/mo (~{(economyVsStack * 12).toLocaleString('fr-FR')} €/an)
                </p>
              </div>
            </div>
          </MotionInView>
        </section>

        {/* ─── 8. FAQ PRICING ──────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-20" id="faq">
          <MotionInView>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-violet-600 mb-3">FAQ TARIFICATION</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Vos questions, nos réponses
              </h2>
              <p className="text-content-tertiary text-base">
                Tout ce qu&apos;il faut savoir avant de souscrire.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_PRICING.map((item, idx) => {
                const isOpen = openFaq === idx;
                const panelId = `pricing-faq-panel-${idx}`;
                const buttonId = `pricing-faq-button-${idx}`;
                return (
                <div
                  key={idx}
                  className="rounded-xl border border-line bg-surface-card overflow-hidden transition-colors hover:border-line-hover"
                >
                  <button
                    type="button"
                    id={buttonId}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-inset"
                  >
                    <span className="text-sm font-medium text-content-primary">{item.q}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`text-content-tertiary flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-4 pt-0">
                      <p className="text-sm text-content-secondary leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </MotionInView>
        </section>

        {/* ─── 9. CTA FINAL ────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <MotionInView>
            <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-10 sm:p-14 text-center text-white shadow-2xl shadow-violet-500/20">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                Démarrez gratuitement.<br />Upgradez quand vous voulez.
              </h2>
              <p className="text-violet-100 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                Testez Volia avec 100 prospects offerts. Pas de carte bancaire requise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Link
                  href="/signup?plan=free"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-violet-700 text-sm font-semibold hover:bg-violet-50 transition shadow-lg w-full sm:w-auto"
                >
                  Démarrer avec Starter (0 €) <ArrowRight size={14} />
                </Link>
                <Link
                  href="/#try-live"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition w-full sm:w-auto"
                >
                  Voir une démo en direct
                </Link>
                <BookDemoButton
                  label="Réserver 15 min avec le founder"
                  variant="dark"
                  size="md"
                  source="pricing_final_cta"
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-violet-100">
                <span className="flex items-center gap-1.5"><Check size={11} /> Sans CB</span>
                <span className="flex items-center gap-1.5"><Check size={11} /> Annulation 1 clic</span>
                <span className="flex items-center gap-1.5"><Check size={11} /> RGPD France</span>
              </div>
            </div>
          </MotionInView>
        </section>
      </main>

      <ReaderFooter />
    </div>
  );
}

// ─── Sous-composant : section comparatif (header + rows) ─────────
function ComparisonSection({ section, renderCell }) {
  return (
    <>
      <tr className="bg-violet-50/40">
        <td colSpan={5} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-violet-700">
          {section.title}
        </td>
      </tr>
      {section.rows.map((row, idx) => (
        <tr
          key={row[0]}
          className={`border-b border-line/60 ${idx % 2 === 1 ? 'bg-surface-elevated/30' : ''}`}
        >
          <td className="px-5 py-3 text-sm text-content-secondary">{row[0]}</td>
          {row.slice(1).map((cell, i) => (
            <td key={i} className="px-3 py-3 text-center">{renderCell(cell)}</td>
          ))}
        </tr>
      ))}
    </>
  );
}
