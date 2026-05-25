// ─────────────────────────────────────────────────────────────────────
// /produits/crm — page produit Volia CRM (COMING SOON)
// ─────────────────────────────────────────────────────────────────────
// Accent : emerald/teal/green.
// Position : aval de Campagnes (un prospect qui répond = un deal CRM).
// Statut : Beta privée prévue Q4 2026 / Q1 2027. CTA = waitlist form.
// ─────────────────────────────────────────────────────────────────────

import { Layers, TrendingUp, Rocket } from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import WaitlistForm from './WaitlistForm';
import { breadcrumbSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/crm`;

export const metadata = {
  title: 'Volia CRM — Pipeline et suivi commercial natif (bientôt)',
  description:
    'Le CRM léger pensé pour les pros qui prospectent avec Volia. Pipeline Kanban, contacts auto depuis Campagnes, reporting closing rate, mobile-first, RGPD by default. Beta privée Q4 2026.',
  alternates: { canonical: PAGE_URL },
  keywords: [
    'CRM français léger',
    'pipeline kanban deals',
    'alternative HubSpot français',
    'CRM RGPD natif',
    'Volia CRM',
    'CRM pour SDR freelance',
  ],
  openGraph: {
    title: 'Volia CRM — Pipeline et suivi commercial natif (bientôt)',
    description:
      'Pipeline Kanban, contacts auto-créés depuis Campagnes, reporting, mobile-first. RGPD by default. Beta privée Q4 2026, incluse dans Pro et Business à la sortie.',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Mockup hero : pipeline Kanban 4 colonnes avec deals stylisés
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const columns = [
    {
      title: 'Lead', count: 12, color: 'zinc',
      deals: [
        { name: 'La Bonne Table', value: '2 400 €', avatar: '🍽️' },
        { name: 'Pasta Roma', value: '1 800 €', avatar: '🍝' },
      ],
    },
    {
      title: 'Qualifié', count: 7, color: 'blue',
      deals: [
        { name: 'Hôtel Riviera', value: '4 200 €', avatar: '🏨' },
        { name: 'Boulangerie M.', value: '900 €', avatar: '🥖' },
      ],
    },
    {
      title: 'Démo', count: 4, color: 'amber',
      deals: [
        { name: 'Sushi Lounge', value: '3 600 €', avatar: '🍱' },
      ],
    },
    {
      title: 'Closé', count: 3, color: 'emerald',
      deals: [
        { name: 'Le Petit Bistrot', value: '5 100 €', avatar: '🍷' },
      ],
    },
  ];

  return (
    <>
      <div className="absolute -top-4 -left-4 z-20 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 shadow-md flex items-center gap-2">
        <Rocket size={12} className="text-amber-700" />
        <span className="text-xs font-semibold text-amber-700">Beta privée Q4 2026</span>
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
          <div className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 font-semibold">Pipeline Q1</div>
        </div>

        {/* Pipeline stats */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            { label: 'Pipeline', value: '47 k€', color: 'text-emerald-700' },
            { label: 'Closing rate', value: '21%', color: 'text-teal-700' },
            { label: 'Cycle moyen', value: '18 j', color: 'text-green-700' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Kanban 4 colonnes */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-surface-elevated/30">
          {columns.map((col, ci) => (
            <div
              key={col.title}
              className="bg-white rounded-lg border border-line p-2 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${300 + ci * 100}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">{col.title}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  col.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  col.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  col.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  'bg-zinc-100 text-zinc-700'
                }`}>{col.count}</span>
              </div>
              <div className="space-y-1.5">
                {col.deals.map((deal, di) => (
                  <div
                    key={di}
                    className="rounded-md border border-line bg-white p-2 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{deal.avatar}</span>
                      <span className="text-[10px] font-semibold text-content-primary truncate flex-1">{deal.name}</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-emerald-700">{deal.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-white">
          <span className="text-xs text-content-tertiary">26 deals actifs</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <TrendingUp size={12} />
            +18% ce mois
          </div>
        </div>
      </div>

      {/* Floating decorative card "+ 5 deals" */}
      <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 px-4 py-3 rounded-xl bg-white border border-line shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Layers size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-content-tertiary">Nouveaux deals</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 5</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Banner "Beta privée Q4 2026"
// ─────────────────────────────────────────────────────────────────────
function PricingBanner() {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
        <Rocket size={18} className="text-white" />
      </div>
      <div>
        <h4 className="font-bold text-amber-900 mb-1">Beta privée prévue Q4 2026</h4>
        <p className="text-sm text-amber-800">
          Volia CRM sera inclus dans les plans Pro (49 €/mois) et Business (99 €/mois) à la sortie.
          Aucun add-on, aucun surcoût. Rejoignez la waitlist pour être notifié à l'ouverture.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'gérer vos deals',
  subline: 'Pas un mini-Salesforce. Un CRM léger, mobile-first, déjà connecté à Prospection et Campagnes.',
  items: [
    {
      icon: 'Users', featured: true,
      title: 'Contacts auto-créés depuis Campagnes',
      desc: 'Dès qu\'un prospect répond à votre séquence, il devient un contact CRM avec tout son historique (séquence, ouvertures, clics, réponse complète). Plus de copier-coller.',
    },
    {
      icon: 'KanbanSquare',
      title: 'Pipeline Kanban personnalisable',
      desc: 'Lead → Qualifié → Démo → Proposition → Closé. Personnalisez les étapes, drag & drop des deals, valeur estimée par carte.',
    },
    {
      icon: 'BarChart3',
      title: 'Reporting closing rate & cycle',
      desc: 'Closing rate par segment/source, cycle de vente moyen, valeur pipeline pondérée, prévisions M+1/M+3. Pas besoin d\'un consultant pour comprendre.',
    },
    {
      icon: 'FileText',
      title: 'Notes & activités par deal',
      desc: 'Historique horodaté : appels, emails, démos, propositions. Recherche full-text. Tags personnalisables.',
    },
    {
      icon: 'Smartphone',
      title: 'Mobile-first',
      desc: 'Pensé pour le terrain : interface tactile, actions en 1 tap, notifications push. Vs les CRM old-school qui rament sur mobile.',
    },
    {
      icon: 'Shield', wide: true,
      title: 'RGPD compliant by default',
      desc: 'Hébergement français (Supabase Paris), consentements tracés, droit à l\'effacement en 1 clic, registre des traitements pré-rempli. Conforme aux exigences DPO/CNIL.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'Settings', title: 'Configurez votre pipeline', desc: 'Choisissez vos étapes (Lead/Qualifié/Démo/Proposition/Closé ou custom). Définissez la valeur moyenne par étape et vos prévisions cible.' },
  { icon: 'MessageSquare', title: 'Les contacts arrivent tout seuls', desc: 'Chaque réponse à une séquence Volia Campagnes crée automatiquement un deal en colonne "Lead" avec l\'historique complet.' },
  { icon: 'TrendingUp', title: 'Suivez jusqu\'au closing', desc: 'Drag & drop des deals d\'étape en étape. Notes, activités, fichiers. Reporting auto sur votre closing rate et cycle moyen.' },
];

const FAQ = [
  {
    q: 'Quand sera-t-il disponible ?',
    a: 'Beta privée prévue Q4 2026 (octobre-décembre), sortie publique Q1 2027. Le backend est déjà en construction parallèlement à Campagnes. Les premiers utilisateurs auront 3 mois d\'utilisation gratuite + un canal Discord direct avec l\'équipe produit.',
  },
  {
    q: 'Comment rejoindre la beta ?',
    a: 'Inscrivez-vous à la waitlist en haut ou en bas de cette page. On contactera 100 comptes maximum lors du lancement, prioritairement les utilisateurs actifs de Volia Prospection + Campagnes. Aucun engagement, vous recevez juste un email avec un accès anticipé.',
  },
  {
    q: 'Migration depuis HubSpot, Pipedrive, ou Salesforce ?',
    a: 'Import CSV standard prévu dès la beta (contacts, deals, étapes). Migration assistée Pipedrive et HubSpot prévue pour la sortie publique (Q1 2027). Pour Salesforce, l\'export CSV manuel reste possible dès le début. Si vous avez plus de 5 000 contacts à migrer, on vous aide en visio.',
  },
  {
    q: 'Combien de pipelines en parallèle ?',
    a: 'Plan Pro : 1 pipeline avec étapes custom (suffisant pour 95 % des cas). Plan Business : jusqu\'à 5 pipelines (utile si vous vendez plusieurs produits avec des cycles différents, ou si vous gérez plusieurs équipes commerciales). Pas de quota sur le nombre de deals.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD : Product avec availability PreOrder
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
  description: "Pipeline et suivi commercial natif Volia. Pipeline Kanban, contacts auto depuis Campagnes, reporting, mobile-first, RGPD by default. Beta privée Q4 2026.",
  url: PAGE_URL,
  brand: { '@type': 'Brand', name: 'Volia' },
  offers: {
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/PreOrder',
    availabilityStarts: '2026-10-01',
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
        status="COMING_SOON"
        hero={{
          h1Before: 'Le CRM léger,',
          h1Highlight: 'connecté nativement',
          h1After: 'à votre prospection.',
          subtitle: (
            <>
              Pipeline Kanban, contacts qui arrivent depuis Campagnes, reporting closing rate.{' '}
              <strong className="text-content-primary font-semibold">Pas un mini-Salesforce</strong> : un CRM mobile-first, conforme RGPD, inclus dans Pro à la sortie.
            </>
          ),
          ctaPrimary: { label: 'Voir Prospection', href: '/produits/prospection' },
          ctaSecondary: { custom: <WaitlistForm variant="hero" /> },
          trust: [
            (<><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Beta privée Q4 2026</>),
            'Inclus dans Pro &amp; Business',
            'RGPD by default',
          ],
          mockup: <HeroMockup />,
        }}
        features={FEATURES}
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Le CRM consomme les contacts qui répondent dans Campagnes, qui eux-mêmes viennent des prospects extraits par Prospection. La boucle est fermée.',
          otherModules: [
            { module: 'prospection', direction: 'in', desc: 'Le tout début du tunnel. 150+ secteurs, 101 départements, emails enrichis et scorés.', cta: 'Découvrir Prospection' },
            { module: 'campagnes', direction: 'in', desc: 'L\'outil qui transforme les prospects en réponses positives — qui deviennent vos deals CRM.', cta: 'Découvrir Campagnes' },
          ],
        }}
        pricingBanner={<PricingBanner />}
        pricing={{
          label: 'Inclus dans Pro et Business à la sortie',
          subtext: 'Aucun add-on, aucun surcoût. Si vous êtes déjà sur Pro (49 €) ou Business (99 €), le CRM s\'ajoutera automatiquement à votre compte à l\'ouverture publique.',
          cta: 'Voir les tarifs actuels',
          ctaHref: '/#pricing',
        }}
        faq={FAQ}
        finalCta={{
          title: 'Rejoignez la beta privée',
          subtitle: '100 premiers comptes seulement. 3 mois d\'utilisation gratuite, accès Discord direct à l\'équipe produit. Aucun engagement.',
          customForm: <WaitlistForm variant="cta" />,
          trust: 'Vous recevez un seul email à l\'ouverture, rien d\'autre · Désinscription 1 clic',
        }}
      />
    </>
  );
}
