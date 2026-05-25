// ─────────────────────────────────────────────────────────────────────
// /produits/prospection — page produit Volia Prospection (LIVE)
// ─────────────────────────────────────────────────────────────────────
// Accent : violet/indigo (couleur signature Volia).
// Position : module mère, le seul actuellement payant à part entière.
// ─────────────────────────────────────────────────────────────────────

import { Search, Mail, Download } from 'lucide-react';
import ProductPageLayout from '@/components/ProductPageLayout';
import { breadcrumbSchema, productSchema } from '@/lib/seo-helpers';

const SITE_URL = 'https://volia.fr';
const PAGE_URL = `${SITE_URL}/produits/prospection`;

export const metadata = {
  title: "Volia Prospection — L'email de toute entreprise française",
  description:
    "Trouvez l'email de n'importe quelle entreprise française : 150+ secteurs, 101 départements, scraping intelligent + recherche Google. À partir de 19 €/mois, conforme RGPD.",
  alternates: { canonical: PAGE_URL },
  keywords: [
    'prospection b2b France',
    'trouver email entreprise',
    'enrichissement email b2b',
    'scraping email France',
    'Volia Prospection',
    'leads B2B France',
  ],
  openGraph: {
    title: "Volia Prospection — L'email de toute entreprise française",
    description:
      '150+ secteurs · 101 départements · scraping waterfall multi-sources · scoring de confiance · export CSV/HubSpot/Zoho. À partir de 19 €/mois.',
    url: PAGE_URL,
    type: 'website',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Mockup hero : faux résultats de recherche (statique, pas interactif)
// ─────────────────────────────────────────────────────────────────────
function HeroMockup() {
  const rows = [
    { name: 'La Bonne Table', email: 'contact@labonnetable.fr', score: 'Vérifié', color: 'emerald', avatar: '🍽️' },
    { name: 'Pasta Roma', email: 'info@pastaroma.fr', score: 'Vérifié', color: 'emerald', avatar: '🍝' },
    { name: 'Boulangerie Maison', email: 'bonjour@boulangerie-m.fr', score: 'Google', color: 'amber', avatar: '🥖' },
    { name: 'Le Petit Bistrot', email: 'reservation@petitbistrot.fr', score: 'Vérifié', color: 'emerald', avatar: '🍷' },
    { name: 'Sushi Lounge Paris', email: 'contact@sushilounge.fr', score: 'Vérifié', color: 'emerald', avatar: '🍱' },
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
                <div className="text-xs text-content-tertiary font-mono truncate">{row.email}</div>
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
          <div className="text-xs text-content-tertiary">Emails trouvés</div>
          <div className="text-lg font-bold text-content-primary tabular-nums">+ 192</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Données page
// ─────────────────────────────────────────────────────────────────────
const FEATURES = {
  headline: 'trouver vos prospects B2B',
  subline: 'Une couverture France totale, un enrichissement multi-sources, et un scoring qui vous dit quoi croire.',
  items: [
    {
      icon: 'Layers', featured: true,
      title: 'Enrichissement waterfall multi-sources',
      desc: 'Scraping intelligent du site web → recherche Google via Serper → fallback patterns (contact@, info@…). On s\'arrête dès qu\'un email est trouvé. Aucun gaspillage.',
    },
    {
      icon: 'Brain',
      title: 'Recherche en langage naturel',
      desc: 'Décrivez votre cible en français ("restaurants gastronomiques Bordeaux"), Claude la traduit en requête Google Places.',
    },
    {
      icon: 'BarChart3',
      title: 'Scoring de confiance par lead',
      desc: 'Chaque email reçoit un score : Vérifié (trouvé sur le site), Google (extrait d\'une recherche), Probable (pattern deviné). Vous savez quoi prioriser.',
    },
    {
      icon: 'Database',
      title: '150+ secteurs B2B',
      desc: '12 grands groupes (restauration, BTP, immobilier, santé, juridique…) + 3 groupes copropriété. Couverture France complète.',
    },
    {
      icon: 'Globe',
      title: '101 départements français',
      desc: 'Métropole (96) + outre-mer (5), organisés en 14 régions. Filtrage par région, département ou multi-départements.',
    },
    {
      icon: 'Download', wide: true,
      title: 'Export CSV, HubSpot, Zoho',
      desc: 'Format standard ou pré-mappé pour vos CRM. Champs : nom, adresse, téléphone, email, score, site web, note Google, nombre d\'avis.',
    },
  ],
};

const HOW_IT_WORKS = [
  { icon: 'Search', title: 'Choisissez secteur et zone', desc: 'Sélectionnez un ou plusieurs secteurs (150+ catégories) et la zone géographique (régions, départements ou ville).' },
  { icon: 'Sparkles', title: 'Volia recherche pour vous', desc: 'L\'enrichissement waterfall s\'enchaîne automatiquement : Google Places → site web → Google → patterns. En quelques secondes.' },
  { icon: 'Download', title: 'Exportez et contactez', desc: 'CSV propre, prêt pour votre CRM ou pour Volia Campagnes en 1 clic. Pas de copier-coller, pas d\'ETL.' },
];

const FAQ = [
  {
    q: 'Combien de prospects puis-je extraire par mois ?',
    a: 'Cela dépend de votre plan : Starter (gratuit) 100 prospects, Solo 19 €/mois pour 1 000, Pro 49 €/mois pour 5 000, Business 99 €/mois pour 10 000. Pas d\'engagement, vous changez de plan quand vous voulez.',
  },
  {
    q: 'C\'est conforme RGPD ?',
    a: 'Oui. Volia respecte les recommandations CNIL pour la prospection B2B : intérêt légitime, opt-out clair sur chaque email, suppression sur demande via /opt-out, blocklist permanente. Un filtre RGPD bloque par défaut 28 domaines d\'emails personnels (@gmail, @hotmail…) pour ne contacter que des emails professionnels.',
  },
  {
    q: 'Je peux exporter vers HubSpot ?',
    a: 'Oui. Export CSV standard (compatible HubSpot, Salesforce, Pipedrive) et export pré-mappé Zoho CRM. Le mapping des champs est automatique : nom, adresse, téléphone, email, site web. Bientôt : intégration native via API.',
  },
  {
    q: 'Quelle est la précision des emails trouvés ?',
    a: 'Variable selon la source — c\'est pour ça qu\'on affiche le score. "Vérifié" (~85% de délivrabilité) : email trouvé directement sur le site officiel. "Google" (~70%) : extrait d\'une recherche Google avec contexte entreprise. "Probable" (~50%) : pattern deviné (contact@nom-domaine.fr). À combiner avec une vérification SMTP avant envoi pour les volumes importants.',
  },
  {
    q: 'Quelles catégories sont couvertes ?',
    a: 'Plus de 150 catégories réparties en 12 groupes B2B : restauration (15+ sous-catégories), commerce (épicerie, vêtements, sport…), services (coiffure, beauté, garage…), BTP (plombier, électricien, peintre…), santé, juridique, hôtellerie, immobilier, transport, finance, éducation, copropriété. Vous ne trouvez pas la vôtre ? On l\'ajoute sur demande.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// JSON-LD
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
    description: "L'email de toute entreprise française. Scraping waterfall + recherche Google + 150+ secteurs + 101 départements. À partir de 19 €/mois.",
    url: PAGE_URL,
    priceFrom: 19,
  }),
};

export default function ProspectionProductPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />

      <ProductPageLayout
        module="prospection"
        status="LIVE"
        hero={{
          h1Before: "L'email de",
          h1Highlight: 'toute entreprise',
          h1After: 'française.',
          subtitle: (
            <>
              Scraping intelligent + recherche Google.{' '}
              <strong className="text-content-primary font-semibold">150+ secteurs, 101 départements</strong>.
              Conformité RGPD incluse. À partir de 19 €/mois.
            </>
          ),
          ctaPrimary: { label: 'Démarrer gratuitement', href: '/signup' },
          ctaSecondary: { label: 'Voir les tarifs', href: '/#pricing' },
          trust: [
            (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sans carte bancaire</>),
            'Starter gratuit à vie',
            <span key="rgpd" className="font-medium">Conforme RGPD</span>,
          ],
          mockup: <HeroMockup />,
        }}
        features={FEATURES}
        howItWorks={HOW_IT_WORKS}
        crossSell={{
          subtitle: 'Vos prospects extraits filent directement dans Campagnes pour l\'envoi, puis dans le CRM (à la sortie) pour le suivi commercial.',
          otherModules: [
            { module: 'campagnes', direction: 'out', desc: 'Lancez des séquences email + SMS sur vos prospects extraits. Templates inclus, relances auto, stats temps réel.', cta: 'Découvrir Campagnes' },
            { module: 'crm', direction: 'out', desc: 'Pipeline Kanban natif Volia pour suivre vos deals jusqu\'au closing. Disponible bientôt.', cta: 'Rejoindre la beta' },
          ],
        }}
        pricing={{
          label: 'Inclus dans tous les plans, dès le Starter gratuit',
          subtext: 'Starter 0 € (100 prospects/mois) · Solo 19 € (1k) · Pro 49 € (5k) · Business 99 € (10k). Pas d\'engagement, annulation 1 clic.',
          cta: 'Voir les tarifs complets',
          ctaHref: '/#pricing',
        }}
        faq={FAQ}
        finalCta={{
          title: 'Prêt à trouver vos premiers prospects ?',
          subtitle: '100 prospects gratuits pour tester, sans carte bancaire. Vous gardez tout ce que vous exportez, pour toujours.',
          primary: { label: 'Démarrer gratuitement', href: '/signup' },
          secondary: { label: 'Voir les tarifs', href: '/#pricing' },
          trust: 'Sans carte bancaire · 100 prospects gratuits · Annulation en 1 clic',
        }}
      />
    </>
  );
}
