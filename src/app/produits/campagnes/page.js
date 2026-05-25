// ─────────────────────────────────────────────────────────────────────
// /produits/campagnes — page produit Volia Campagnes (BETA)
// ─────────────────────────────────────────────────────────────────────
// Accent : blue/cyan.
// Position : module d'envoi connecté à Prospection (source) et CRM (output).
// Statut : BETA déjà fonctionnel en backend admin, polish UI public en cours.
// ─────────────────────────────────────────────────────────────────────

import { Mail, MessageSquare, Send, Play } from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import { breadcrumbSchema, productSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/campagnes`;

export const metadata = {
  title: 'Volia Campagnes — Vos séquences email & SMS automatisées',
  description:
    'Lancez des séquences email cold + SMS sur vos prospects Volia sans repartir vers un autre outil. Templates par secteur, relances auto, stats temps réel. Inclus dans Pro et Business.',
  alternates: { canonical: PAGE_URL },
  keywords: [
    'séquence email cold France',
    'campagne email b2b',
    'sms marketing pro',
    'outil cold email RGPD',
    'Volia Campagnes',
    'alternative Lemlist France',
  ],
  openGraph: {
    title: 'Volia Campagnes — Vos séquences email & SMS automatisées',
    description:
      'Séquences email + SMS, relances auto, templates par secteur, variables dynamiques, stats temps réel. Conformité RGPD by default. Inclus dans Pro (49 €) et Business (99 €).',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Mockup hero : faux séquence email (D+0, D+3, SMS D+7) + stats
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const steps = [
    {
      day: 'J+0', kind: 'Email', icon: Mail, color: 'blue',
      subject: 'Une question rapide sur {{entreprise}}',
      preview: 'Bonjour {{prenom}}, je viens de voir que vous gérez…',
    },
    {
      day: 'J+3', kind: 'Relance email', icon: Mail, color: 'cyan',
      subject: 'Re: Une question rapide sur {{entreprise}}',
      preview: 'Je remonte ce message au cas où il aurait filé en bas de boîte…',
    },
    {
      day: 'J+7', kind: 'SMS', icon: MessageSquare, color: 'indigo',
      subject: 'SMS via Twilio',
      preview: '{{prenom}}, est-ce que je vous appelle cette semaine pour 10 min ?',
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
          <div className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold">Séquence "Restos Paris"</div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            { label: 'Ouverture', value: '62%', color: 'text-blue-700' },
            { label: 'Clic', value: '24%', color: 'text-cyan-700' },
            { label: 'Réponse', value: '14%', color: 'text-emerald-700' },
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
            Active
          </div>
        </div>
      </div>

      {/* Floating decorative card "+ 23 réponses" */}
      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Send size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-content-tertiary">Réponses reçues</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 23</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'envoyer vos campagnes',
  subline: 'Pas besoin de Lemlist + Twilio + Apollo. Tout est intégré, déjà conforme RGPD, et inclus dans Pro.',
  items: [
    {
      icon: 'Mail', featured: true,
      title: 'Séquences email cold avec relances auto',
      desc: 'Délais 100 % personnalisables (J+3, J+7, J+14…). Pause auto sur réponse. Limite quotidienne pour préserver la délivrabilité (10–200 envois/jour selon votre warm-up).',
    },
    {
      icon: 'MessageSquare',
      title: 'SMS Twilio intégré',
      desc: 'Pas besoin d\'un compte Twilio à part : on a déjà un numéro français connecté. Mixez email + SMS dans la même séquence (J+0 mail, J+7 SMS de relance).',
    },
    {
      icon: 'FileText',
      title: 'Templates pré-écrits par secteur',
      desc: 'Restauration, immobilier, BTP, agences web, e-commerce… Chaque template a été testé sur des milliers d\'envois. Tweakez ou repartez de zéro.',
    },
    {
      icon: 'Tag',
      title: 'Variables dynamiques',
      desc: '{{prenom}}, {{entreprise}}, {{ville}}, {{secteur}}… Insertion automatique depuis vos prospects Volia. Fallback configurable si une variable est vide.',
    },
    {
      icon: 'BarChart3',
      title: 'Stats ouverture/clic/réponse',
      desc: 'Suivi temps réel par séquence, par étape, par template. Identifiez tout de suite ce qui marche et ce qui flop.',
    },
    {
      icon: 'Shield', wide: true,
      title: 'Opt-out unifié RGPD automatique',
      desc: 'Lien de désinscription ajouté en footer de chaque email. L\'opt-out alimente la blocklist Volia (jamais re-contacté). Mention CNIL pré-remplie, déclaration RGPD à jour.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'Send', title: 'Importez vos prospects', desc: 'Depuis Volia Prospection en 1 clic ou par upload CSV. Les variables (prénom, ville, secteur) sont auto-mappées.' },
  { icon: 'Settings', title: 'Configurez votre séquence', desc: 'Choisissez un template ou partez de zéro. Définissez les délais, l\'ordre email/SMS, les limites quotidiennes.' },
  { icon: 'Zap', title: 'Lancez et suivez', desc: 'Les envois s\'enchaînent automatiquement. Stats live : taux d\'ouverture, clic, réponse. Vous arrêtez ou ajustez quand vous voulez.' },
];

const FAQ = [
  {
    q: 'Quels sont les quotas d\'envoi ?',
    a: 'Les quotas dépendent de votre plan et de votre warm-up : 10 emails/jour la première semaine (warm-up), 30/jour la 2e semaine, jusqu\'à 200/jour à partir du mois 2 si votre délivrabilité reste propre (taux de bounce <2 %, plaintes <0.1 %). Pour le SMS : pas de quota strict mais facturation à l\'usage (Twilio ~0,08 €/SMS France).',
  },
  {
    q: 'Comment vous gérez la délivrabilité ?',
    a: 'On ne touche pas à votre domaine d\'envoi (vous gardez votre identité). En revanche on : (1) impose un warm-up progressif, (2) bouncrate-monitoring auto avec pause si >2 %, (3) headers SPF/DKIM check à la config, (4) vérification SMTP des emails avant envoi, (5) opt-out unifié pour préserver votre réputation. Concrètement : 8-15 % de taux de réponse moyen sur du cold email B2B FR.',
  },
  {
    q: 'C\'est conforme RGPD ?',
    a: 'Oui. Volia Campagnes implémente : (1) opt-out clair en footer obligatoire, (2) registre des consentements/oppositions, (3) blocklist permanente (un prospect désinscrit ne sera jamais re-contacté, même via une autre séquence), (4) base légale "intérêt légitime" documentée, (5) déclaration RGPD à jour conforme aux recommandations CNIL pour la prospection B2B. Vous restez responsable du contenu de vos messages.',
  },
  {
    q: 'Combien de templates inclus ?',
    a: 'Plus de 40 templates couvrant 12 secteurs B2B : restauration, BTP, agences digitales, immobilier, e-commerce, hôtellerie, santé, juridique, etc. Chaque template a 3 variantes (intro cold, relance, relance finale) et a été testé sur du volume réel. Vous pouvez aussi importer vos propres templates.',
  },
  {
    q: 'Combien de séquences en parallèle ?',
    a: 'Plan Pro : 5 séquences actives. Plan Business : 25 séquences. Au-delà, contactez-nous pour un quota custom. Chaque séquence peut contenir jusqu\'à 10 étapes (email + SMS mixés) et autant de prospects que votre quota d\'envoi le permet.',
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
    description: 'Séquences email cold + SMS automatisées, templates par secteur, opt-out RGPD unifié. Inclus dans Pro (49 €) et Business (99 €).',
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
          h1Before: 'Vos séquences email & SMS,',
          h1Highlight: 'automatisées',
          h1After: 'sans changer d\'outil.',
          subtitle: (
            <>
              Importez vos prospects Volia, lancez une séquence avec relances auto, suivez les stats en temps réel.{' '}
              <strong className="text-content-primary font-semibold">Email + SMS Twilio + opt-out RGPD</strong>, tout inclus.
            </>
          ),
          ctaPrimary: { label: 'Lancer ma première campagne', href: '/signup?intent=campaign' },
          ctaSecondary: { label: 'Voir les tarifs', href: '/#pricing' },
          trust: [
            (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Inclus dans Pro &amp; Business</>),
            'Templates par secteur',
            'Opt-out RGPD automatique',
          ],
          mockup: <HeroMockup />,
        }}
        features={FEATURES}
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Campagnes consomme les prospects extraits par Prospection et alimente le CRM dès qu\'un prospect répond.',
          otherModules: [
            { module: 'prospection', direction: 'in', desc: 'La source de vos prospects. 150+ secteurs, 101 départements, emails enrichis et scorés.', cta: 'Découvrir Prospection' },
            { module: 'crm', direction: 'out', desc: 'Dès qu\'un prospect répond, il devient un deal dans votre pipeline Kanban. Bientôt disponible.', cta: 'Rejoindre la beta' },
          ],
        }}
        pricing={{
          label: 'Inclus dans Pro (49 €/mois) et Business (99 €/mois)',
          subtext: 'Pro = 5 séquences en parallèle, jusqu\'à 5 000 prospects en pipeline. Business = 25 séquences, 10 000 prospects, quotas d\'envoi augmentés. Pas d\'add-on caché.',
          cta: 'Voir les tarifs complets',
          ctaHref: '/#pricing',
        }}
        faq={FAQ}
        finalCta={{
          title: 'Lancez votre première séquence cette semaine',
          subtitle: 'Templates prêts à l\'emploi, prospects déjà enrichis, opt-out géré. Vous n\'avez plus qu\'à appuyer sur Play.',
          primary: { label: 'Lancer ma première campagne', href: '/signup?intent=campaign' },
          secondary: { label: 'Voir les tarifs', href: '/#pricing' },
          trust: 'Inclus dans Pro · Beta accessible aux comptes payants · Conformité RGPD by default',
        }}
      />
    </>
  );
}
