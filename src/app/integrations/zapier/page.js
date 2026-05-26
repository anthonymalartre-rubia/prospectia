import Link from 'next/link';
import { ArrowLeft, Zap, Webhook, Key, ArrowRight, CheckCircle, ExternalLink, Code, Terminal, AlertTriangle, Sparkles } from 'lucide-react';
import { breadcrumbSchema } from '@/lib/seo-helpers';
import ReaderHeader from '@/components/ReaderHeader';
import ReaderFooter from '@/components/ReaderFooter';

export const metadata = {
  title: 'Volia × Zapier — Triggers, Actions et exemples de Zaps',
  description:
    "Documentation complète Volia × Zapier : 11 triggers (new_deal, reply_received, email.opened, email.clicked, sequence.enrolled…), 5 actions (créer contact, lancer campagne…), exemples concrets et setup pas-à-pas en 2 minutes.",
  alternates: { canonical: 'https://volia.fr/integrations/zapier' },
  keywords: [
    'volia zapier',
    'zapier prospection',
    'intégration zapier crm français',
    'zap volia slack',
    'zap volia hubspot',
    'webhook zapier prospection',
  ],
  openGraph: {
    title: 'Volia × Zapier — 11 triggers + 5 actions documentés',
    description: "Connectez Volia à 5000+ apps via Zapier sans coder. Setup en 2 minutes.",
    url: 'https://volia.fr/integrations/zapier',
  },
};

const breadcrumbs = [
  { label: 'Accueil', href: '/' },
  { label: 'Intégrations', href: '/integrations' },
  { label: 'Zapier' },
];

const TRIGGERS = [
  {
    id: 'prospect.created',
    label: 'New prospect found',
    desc: 'Déclenché quand des prospects sont ajoutés à une liste (depuis le dashboard Prospection).',
    sample: `{
  "event_type": "prospect.created",
  "timestamp": "2026-05-26T10:00:00Z",
  "data": {
    "list_id": "uuid",
    "list_name": "Coiffeurs Paris",
    "inserted_count": 25,
    "sample": [
      {
        "email": "contact@salon-marie.fr",
        "phone": "+33145678901",
        "first_name": "Marie Dupont",
        "company": "Salon Marie"
      }
    ]
  }
}`,
    usecase: 'Envoie un récap Slack chaque fois qu\'un batch de prospects est généré.',
  },
  {
    id: 'crm.deal.created',
    label: 'New deal created',
    desc: 'Déclenché à chaque création de deal dans Volia CRM.',
    sample: `{
  "event_type": "crm.deal.created",
  "timestamp": "2026-05-26T10:00:00Z",
  "data": {
    "deal_id": "uuid",
    "title": "Salon Marie - Abo Pro",
    "value_cents": 49000,
    "currency": "EUR",
    "stage_name": "Lead",
    "contact": { "id": "uuid", "name": "Marie Dupont", "email": "marie@salon-marie.fr" }
  }
}`,
    usecase: 'Synchronise automatiquement chaque nouveau deal Volia dans HubSpot ou Pipedrive.',
  },
  {
    id: 'crm.deal.stage_changed',
    label: 'Deal stage changed',
    desc: 'Déclenché quand un deal passe d\'un stage à un autre dans le pipeline.',
    sample: `{
  "event_type": "crm.deal.stage_changed",
  "timestamp": "2026-05-26T11:00:00Z",
  "data": {
    "deal_id": "uuid",
    "title": "Salon Marie - Abo Pro",
    "from_stage": { "id": "uuid", "name": "Lead" },
    "to_stage": { "id": "uuid", "name": "Démo planifiée" }
  }
}`,
    usecase: 'Ping Discord quand un deal entre en stage "Démo planifiée" pour préparer le call.',
  },
  {
    id: 'crm.deal.won',
    label: 'Deal won',
    desc: 'Déclenché quand un deal passe en status "won" (signature client).',
    sample: `{
  "event_type": "crm.deal.won",
  "timestamp": "2026-05-26T14:00:00Z",
  "data": {
    "deal_id": "uuid",
    "title": "Salon Marie - Abo Pro",
    "value_cents": 49000,
    "currency": "EUR",
    "closed_at": "2026-05-26T14:00:00Z"
  }
}`,
    usecase: 'Crée une invoice Stripe + déclenche un onboarding email + notifie #wins.',
  },
  {
    id: 'crm.deal.lost',
    label: 'Deal lost',
    desc: 'Déclenché quand un deal passe en status "lost".',
    sample: `{
  "event_type": "crm.deal.lost",
  "timestamp": "2026-05-26T14:00:00Z",
  "data": {
    "deal_id": "uuid",
    "title": "Salon Marie - Abo Pro",
    "closed_at": "2026-05-26T14:00:00Z"
  }
}`,
    usecase: 'Logge la raison du lost dans Notion + ajoute à une séquence de re-nurturing 3 mois.',
  },
  {
    id: 'email.delivered',
    label: 'Email delivered',
    desc: 'Déclenché quand Resend confirme la délivrance d\'un email de campagne.',
    sample: `{
  "event_type": "email.delivered",
  "timestamp": "2026-05-26T10:00:30Z",
  "data": {
    "campaign_id": "uuid",
    "to": "prospect@example.com",
    "delivered_at": "2026-05-26T10:00:30Z"
  }
}`,
    usecase: 'Tracking délivrabilité fine dans un Google Sheets ou un dashboard custom.',
  },
  {
    id: 'email.opened',
    label: 'Email opened',
    desc: 'Déclenché à la PREMIÈRE ouverture d\'un email (pixel chargé).',
    sample: `{
  "event_type": "email.opened",
  "timestamp": "2026-05-26T10:15:00Z",
  "data": {
    "campaign_id": "uuid",
    "to": "prospect@example.com",
    "opened_at": "2026-05-26T10:15:00Z"
  }
}`,
    usecase: 'Score engagement HubSpot/Salesforce + notification Slack pour les prospects chauds.',
  },
  {
    id: 'email.clicked',
    label: 'Email clicked',
    desc: 'Déclenché quand un destinataire clique un lien tracké dans l\'email.',
    sample: `{
  "event_type": "email.clicked",
  "timestamp": "2026-05-26T10:16:00Z",
  "data": {
    "campaign_id": "uuid",
    "to": "prospect@example.com",
    "url": "https://example.com/cta",
    "clicked_at": "2026-05-26T10:16:00Z"
  }
}`,
    usecase: 'Tag automatique "hot lead" + envoi d\'un follow-up perso depuis Zapier.',
  },
  {
    id: 'sequence.enrolled',
    label: 'Sequence enrolled',
    desc: 'Déclenché quand un contact démarre une séquence (1 event par contact enrôlé).',
    sample: `{
  "event_type": "sequence.enrolled",
  "timestamp": "2026-05-26T09:00:00Z",
  "data": {
    "sequence_id": "uuid",
    "sequence_name": "Reactivation 30j",
    "contact_id": "uuid",
    "email": "prospect@example.com"
  }
}`,
    usecase: 'Synchroniser l\'enrollment dans le CRM tiers pour reporting unifié.',
  },
  {
    id: 'campaign.completed',
    label: 'Campaign completed',
    desc: 'Déclenché quand tous les emails/SMS d\'une campagne ont été envoyés (statut "done").',
    sample: `{
  "event_type": "campaign.completed",
  "timestamp": "2026-05-26T17:00:00Z",
  "data": {
    "campaign_id": "uuid",
    "name": "Relance leads froids — Mai",
    "total_sent": 247,
    "total_delivered": 241,
    "total_bounced": 6,
    "total_opened": 89,
    "total_clicked": 12
  }
}`,
    usecase: 'Logge automatiquement les stats finales dans Google Sheets pour reporting hebdo.',
  },
  {
    id: 'email.replied',
    label: 'Reply received',
    desc: 'Déclenché quand un prospect répond à une campagne (auto-création contact + deal CRM).',
    sample: `{
  "event_type": "email.replied",
  "timestamp": "2026-05-26T10:30:00Z",
  "data": {
    "campaign_id": "uuid",
    "from_email": "marie@salon-marie.fr",
    "subject": "Re: On reste en contact ?",
    "body_preview": "Bonjour, oui je suis intéressée pour un échange...",
    "contact_id": "uuid",
    "deal_id": "uuid"
  }
}`,
    usecase: 'Notification Discord temps réel + tag automatique du contact en "hot" dans le CRM.',
  },
];

const ACTIONS = [
  {
    label: 'Create contact',
    method: 'POST',
    path: '/api/v1/crm/contacts (à venir)',
    desc: 'Ajoute un contact dans le CRM Volia depuis n\'importe quelle source Zapier (form, CRM tiers, etc.).',
    params: 'name, email, phone, company, position, notes',
    usecase: 'Form Typeform → contact CRM Volia (auto-import des demandes inbound).',
  },
  {
    label: 'Create deal',
    method: 'POST',
    path: '/api/v1/crm/deals (à venir)',
    desc: 'Crée un deal au stage de votre choix dans le pipeline cible.',
    params: 'title, pipeline_id, stage_id, value_cents, currency, contact_id',
    usecase: 'Stripe payment succeeded → deal Volia en stage "Closé gagné".',
  },
  {
    label: 'Add to list',
    method: 'POST',
    path: '/api/v1/prospect-lists/{id}/contacts (à venir)',
    desc: 'Ajoute un ou plusieurs contacts à une prospect_list existante.',
    params: 'email, phone, first_name, last_name, company',
    usecase: 'Google Sheets row added → contact ajouté à une liste de campagne ciblée.',
  },
  {
    label: 'Trigger campaign',
    method: 'POST',
    path: '/api/v1/campaigns/{id}/send (à venir)',
    desc: 'Démarre l\'envoi d\'une campagne email/SMS configurée (status: draft → sending).',
    params: 'campaign_id',
    usecase: 'Notion DB row "Status = Ready" → lance la campagne associée.',
  },
  {
    label: 'Update deal stage',
    method: 'PATCH',
    path: '/api/v1/crm/deals/{id}/move (à venir)',
    desc: 'Déplace un deal vers un autre stage du pipeline.',
    params: 'stage_id, position',
    usecase: 'Calendly meeting booked → deal passe en "Démo planifiée" automatiquement.',
  },
];

const POPULAR_ZAPS = [
  {
    title: 'Nouveau lead Volia → Slack #leads',
    steps: ['Trigger: New prospect found (Volia)', 'Action: Send Channel Message (Slack)'],
    desc: 'Notifie ton équipe sales en temps réel à chaque nouveau prospect qualifié, avec email + téléphone direct.',
  },
  {
    title: 'Form Typeform → contact CRM Volia',
    steps: ['Trigger: New Entry (Typeform)', 'Action: Create contact (Volia)'],
    desc: 'Importe automatiquement les leads inbound de ton formulaire dans le CRM Volia, prêts à entrer en pipeline.',
  },
  {
    title: 'Deal won Volia → invoice Stripe',
    steps: ['Trigger: Deal won (Volia)', 'Action: Create Invoice (Stripe)'],
    desc: 'Génère et envoie la facture client en un clic dès qu\'un deal passe en won.',
  },
  {
    title: 'Reply received → notification Discord',
    steps: ['Trigger: Reply received (Volia)', 'Action: Send Message (Discord)'],
    desc: 'Réponse prospect = alerte immédiate dans ton serveur Discord. Réactivité = taux de closing x3.',
  },
  {
    title: 'Email opened → HubSpot contact timeline',
    steps: ['Trigger: Campaign event - email.opened (Volia)', 'Action: Update Contact (HubSpot)'],
    desc: 'Synchronise l\'engagement campagne avec ton CRM principal pour un scoring unifié.',
  },
  {
    title: 'Campaign completed → Google Sheets report',
    steps: ['Trigger: Campaign completed (Volia)', 'Action: Create Spreadsheet Row (Google Sheets)'],
    desc: 'Logge automatiquement open rate, click rate, bounces de chaque campagne pour reporting hebdo.',
  },
];

export default function ZapierIntegrationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'TechArticle',
        headline: 'Volia × Zapier — Documentation Triggers et Actions',
        description: metadata.description,
        author: { '@type': 'Organization', name: 'Volia' },
        publisher: { '@type': 'Organization', name: 'Volia', url: 'https://volia.fr' },
        url: 'https://volia.fr/integrations/zapier',
        inLanguage: 'fr-FR',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReaderHeader />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
          <Link href="/integrations" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition">
            <ArrowLeft size={14} /> Intégrations
          </Link>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="flex items-center gap-3 text-xs text-content-tertiary mb-4">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 inline-flex items-center gap-1">
              <Zap size={11} /> Zapier
            </span>
            <span>·</span>
            <span>5 000+ apps</span>
            <span>·</span>
            <span>REST Hooks compatible</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            Volia × <span className="text-orange-500">Zapier</span>
          </h1>

          <p className="text-lg text-content-secondary leading-relaxed mb-8">
            Connectez Volia à plus de 5 000 applications (Slack, HubSpot, Notion, Google Sheets, Stripe…)
            sans écrire une ligne de code. 11 triggers, 5 actions, setup en 2 minutes via les Webhooks
            Premium de Zapier.
          </p>

          {/* Note transparency */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-12 text-sm">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800">
              <strong>Note :</strong> Volia est en cours de soumission au Zapier Marketplace officiel.
              En attendant, vous pouvez déjà brancher tous les events Volia via les <strong>Webhooks
              by Zapier</strong> (Catch Hook pour les triggers, POST request pour les actions) — c&apos;est
              exactement le même résultat fonctionnel, simplement en 1 étape de plus au setup.
            </div>
          </div>

          {/* TOC */}
          <nav className="rounded-2xl border border-line bg-surface-card p-5 mb-12">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2">Sommaire</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm list-disc list-inside text-content-secondary">
              <li><a href="#setup" className="hover:text-orange-500">Setup pas-à-pas (2 min)</a></li>
              <li><a href="#triggers" className="hover:text-orange-500">11 Triggers (Volia → Zapier)</a></li>
              <li><a href="#actions" className="hover:text-orange-500">5 Actions (Zapier → Volia)</a></li>
              <li><a href="#popular-zaps" className="hover:text-orange-500">Zaps populaires</a></li>
              <li><a href="#security" className="hover:text-orange-500">Sécurité &amp; signature HMAC</a></li>
              <li><a href="#limits" className="hover:text-orange-500">Limites &amp; bonnes pratiques</a></li>
            </ul>
          </nav>

          {/* Setup */}
          <section id="setup" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
              <Sparkles size={22} className="text-orange-500" /> Setup pas-à-pas
            </h2>
            <ol className="space-y-4">
              <li className="rounded-xl border border-line bg-surface-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/15 text-orange-600 font-bold text-sm flex items-center justify-center">1</span>
                  <div>
                    <h3 className="font-semibold text-content-primary mb-1">Créez une clé API Volia</h3>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      Allez sur <Link href="/settings#api" className="text-violet-400 hover:underline">Paramètres → API</Link>,
                      cliquez sur <em>Créer une clé</em>, copiez la clé <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated text-violet-300">pk_xxxxxxxx</code>.
                      <strong className="block mt-1 text-amber-700">Elle ne sera plus jamais visible après cette étape.</strong>
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-line bg-surface-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/15 text-orange-600 font-bold text-sm flex items-center justify-center">2</span>
                  <div>
                    <h3 className="font-semibold text-content-primary mb-1">Pour un Trigger (Volia → Zapier)</h3>
                    <p className="text-sm text-content-secondary leading-relaxed mb-2">
                      Dans Zapier, créez un Zap avec trigger <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">Webhooks by Zapier → Catch Hook</code>.
                      Copiez l&apos;URL fournie (type <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">https://hooks.zapier.com/hooks/catch/...</code>).
                    </p>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      Côté Volia, allez sur <Link href="/settings/webhooks" className="text-violet-400 hover:underline">Paramètres → Webhooks</Link> →
                      <em> Nouveau webhook</em>, sélectionnez l&apos;event (ex: <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">crm.deal.won</code>),
                      collez l&apos;URL Zapier, validez. Zapier reçoit instantanément un échantillon pour mapper les champs.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-line bg-surface-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/15 text-orange-600 font-bold text-sm flex items-center justify-center">3</span>
                  <div>
                    <h3 className="font-semibold text-content-primary mb-1">Pour une Action (Zapier → Volia)</h3>
                    <p className="text-sm text-content-secondary leading-relaxed mb-2">
                      Dans Zapier, ajoutez une étape <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">Webhooks by Zapier → POST</code>.
                    </p>
                    <ul className="text-sm text-content-secondary list-disc list-inside space-y-1">
                      <li><strong>URL :</strong> <code className="text-xs">https://volia.fr/api/v1/...</code> (endpoint cible — voir section Actions)</li>
                      <li><strong>Payload Type :</strong> JSON</li>
                      <li><strong>Headers :</strong> <code className="text-xs">Authorization: Bearer pk_votre_clé</code></li>
                      <li><strong>Data :</strong> mappez les champs depuis les étapes précédentes</li>
                    </ul>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          {/* Triggers */}
          <section id="triggers" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
              <ArrowRight size={22} className="text-orange-500 rotate-[-45deg]" />
              Triggers — Volia → Zapier
            </h2>
            <p className="text-content-secondary mb-6">
              11 events Volia push'és vers Zapier dès qu&apos;ils surviennent. Chaque payload est signé
              HMAC-SHA256 (header <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">X-Volia-Signature</code>).
            </p>

            <div className="space-y-6">
              {TRIGGERS.map((t) => (
                <div key={t.id} className="rounded-2xl border border-line bg-surface-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-line flex items-center gap-2 flex-wrap bg-surface-elevated/50">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-500">Trigger</span>
                    <code className="text-sm font-mono text-content-primary">{t.id}</code>
                    <span className="text-xs text-content-tertiary">— {t.label}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-content-secondary leading-relaxed mb-3">{t.desc}</p>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Payload JSON</p>
                      <pre className="text-xs text-content-secondary font-mono p-3 rounded-lg bg-surface-base border border-line overflow-x-auto leading-relaxed">
                        {t.sample}
                      </pre>
                    </div>
                    <div className="text-xs flex items-start gap-2 text-violet-400">
                      <Sparkles size={12} className="flex-shrink-0 mt-0.5" />
                      <span><strong>Use case :</strong> {t.usecase}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-content-tertiary mt-4">
              Liste exhaustive et payloads : <Link href="/api/v1/webhooks/events" className="text-violet-400 hover:underline">GET /api/v1/webhooks/events</Link>.
              D&apos;autres events (campaign.sent, email.bounced, sms.*, sequence.completed, prospect.enriched/opt_out, search.completed) sont prévus dans nos prochains sprints.
            </p>
          </section>

          {/* Actions */}
          <section id="actions" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
              <ArrowRight size={22} className="text-orange-500" />
              Actions — Zapier → Volia
            </h2>
            <p className="text-content-secondary mb-6">
              5 endpoints REST appelables depuis Zapier pour modifier vos données Volia.
              Auth via <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">Authorization: Bearer pk_xxx</code>.
            </p>

            <div className="space-y-4">
              {ACTIONS.map((a) => (
                <div key={a.label} className="rounded-xl border border-line bg-surface-card p-5">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-500">Action</span>
                    <strong className="text-sm text-content-primary">{a.label}</strong>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-blue-500/15 text-blue-600 border border-blue-500/30">
                      {a.method}
                    </span>
                    <code className="text-xs font-mono text-content-secondary">{a.path}</code>
                  </div>
                  <p className="text-sm text-content-secondary leading-relaxed mb-2">{a.desc}</p>
                  <p className="text-xs text-content-tertiary mb-2">
                    <strong>Paramètres :</strong> <code className="font-mono">{a.params}</code>
                  </p>
                  <p className="text-xs text-violet-400 flex items-start gap-2">
                    <Sparkles size={11} className="flex-shrink-0 mt-0.5" />
                    <span>{a.usecase}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-800 flex items-start gap-3">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Les endpoints d&apos;Actions REST publiques sont en cours de finalisation pour la v1.
                En attendant, vous pouvez déjà <strong>recevoir</strong> tous les events Volia côté Zapier
                via les Triggers Webhooks (REST Hooks pattern), qui couvrent 80% des cas d&apos;usage automation.
              </span>
            </div>
          </section>

          {/* Popular Zaps */}
          <section id="popular-zaps" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles size={22} className="text-orange-500" />
              6 Zaps populaires
            </h2>
            <p className="text-content-secondary mb-6">
              Les workflows que nos clients automatisent le plus souvent. Inspirez-vous, copiez-collez.
            </p>
            <div className="space-y-3">
              {POPULAR_ZAPS.map((z, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface-card p-5">
                  <h3 className="font-semibold text-content-primary mb-2">{z.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                    {z.steps.map((s, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono">{s}</span>
                        {idx < z.steps.length - 1 && <ArrowRight size={11} className="text-content-tertiary" />}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-content-tertiary leading-relaxed">{z.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section id="security" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center gap-2">
              <Webhook size={22} className="text-orange-500" />
              Sécurité &amp; signature HMAC
            </h2>
            <p className="text-content-secondary leading-relaxed mb-4">
              Chaque payload Volia est signé HMAC-SHA256 avec le <code className="text-xs">secret</code> retourné
              à la création du webhook. Vérifiez la signature côté Zapier (via un step <em>Code by Zapier</em>) ou
              côté votre app pour empêcher tout spoof.
            </p>
            <div className="rounded-2xl border border-line bg-surface-card overflow-hidden">
              <div className="px-4 py-2 border-b border-line bg-surface-elevated text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Headers reçus
              </div>
              <pre className="text-xs text-content-secondary font-mono p-4 overflow-x-auto">
{`Content-Type: application/json
User-Agent: Volia-Webhooks/1.0
X-Volia-Event: crm.deal.won
X-Volia-Signature: t=1716724800,v1=<HMAC-SHA256>
X-Volia-Timestamp: 1716724800
X-Volia-Delivery: <uuid>`}
              </pre>
            </div>
            <p className="text-xs text-content-tertiary mt-3">
              Inspiré du <a href="https://stripe.com/docs/webhooks/signatures" target="_blank" rel="noopener" className="text-violet-400 hover:underline inline-flex items-center gap-1">format Stripe <ExternalLink size={10} /></a> :
              concaténez <code>timestamp + &quot;.&quot; + body</code>, signez HMAC-SHA256 avec le secret, comparez à la valeur <code>v1</code>.
            </p>
          </section>

          {/* Limits */}
          <section id="limits" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Limites &amp; bonnes pratiques</h2>
            <ul className="list-disc list-inside space-y-2 text-content-secondary leading-relaxed">
              <li>Max <strong>50 webhooks actifs</strong> par compte (révoquez les inutilisés).</li>
              <li>Max <strong>5 clés API actives</strong> par compte. Une clé révoquée est inutilisable immédiatement.</li>
              <li>Timeout livraison webhook : <strong>10 secondes</strong>. Au-delà, Volia logge l&apos;échec et retry sur le batch suivant.</li>
              <li>Pour les events à fort volume (email.opened, sms.delivered), pensez à filtrer côté Zapier ou utilisez plutôt <code className="text-xs">campaign.completed</code> qui agrège les stats finales.</li>
              <li>Webhooks et API disponibles à partir du plan <strong>Solo 19€/mois</strong>. Volume illimité de calls API dans les limites du plan (searches/enrichments/exports).</li>
              <li>En cas de fuite de clé API : révoquez immédiatement depuis <Link href="/settings#api" className="text-violet-400 hover:underline">Paramètres → API</Link>, créez-en une nouvelle, mettez à jour vos Zaps.</li>
            </ul>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-600/20 to-amber-600/20 border border-orange-500/30 p-8 text-center">
            <Zap size={32} className="text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Prêt à automatiser ?</h2>
            <p className="text-content-secondary mb-6 max-w-xl mx-auto">
              Créez votre première clé API, configurez votre premier webhook, lancez votre premier Zap — le tout en moins de 5 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/settings#api"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition shadow-lg shadow-orange-500/30">
                <Key size={16} /> Créer une clé API
              </Link>
              <Link href="/settings/webhooks"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-line text-sm font-semibold transition">
                <Webhook size={16} /> Mes webhooks
              </Link>
              <Link href="/api"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-line text-sm font-semibold transition">
                <Code size={16} /> Doc API
              </Link>
            </div>
          </div>
        </article>
      </main>

      <ReaderFooter />
    </div>
  );
}
