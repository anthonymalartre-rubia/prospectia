import Link from 'next/link';
import { ArrowLeft, Layers, Webhook, Key, Code, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';
import { breadcrumbSchema } from '@/lib/seo-helpers';
import ReaderHeader from '@/components/ReaderHeader';
import ReaderFooter from '@/components/ReaderFooter';

export const metadata = {
  title: 'Volia × Make (Integromat) — Scénarios visuels et webhooks',
  description:
    "Documentation Volia × Make : connectez Volia à 4000+ apps via scénarios visuels, mappez les events webhooks (prospect, deal, reply) vers Google Sheets, HubSpot, Notion, etc.",
  alternates: { canonical: 'https://volia.fr/integrations/make' },
  keywords: [
    'volia make',
    'integromat prospection',
    'make webhook crm',
    'scénario make volia',
    'automatisation prospection france',
  ],
  openGraph: {
    title: 'Volia × Make — Scénarios visuels et webhooks',
    description: 'Connectez Volia à Make en 3 modules. 21 events disponibles, signature HMAC.',
    url: 'https://volia.fr/integrations/make',
  },
};

const breadcrumbs = [
  { label: 'Accueil', href: '/' },
  { label: 'Intégrations', href: '/integrations' },
  { label: 'Make' },
];

const SCENARIOS = [
  {
    title: 'Volia deal won → Google Sheets + Slack + Stripe invoice',
    desc: 'Scénario à 4 modules : Webhook Volia → Add Row Sheets → Send Message Slack → Create Invoice Stripe. Idéal pour automatiser tout l\'onboarding post-signature.',
  },
  {
    title: 'Reply received → HubSpot timeline + Notion task',
    desc: 'Volia push une réponse prospect → Make crée une activity HubSpot ET une tâche Notion pour le SDR. Synchronisation cross-tools instantanée.',
  },
  {
    title: 'Campaign completed → reporting hebdo automatisé',
    desc: 'Volia notifie fin de campagne → Make agrège open rate / CTR / bounces → publie un message Slack formaté + ligne dans Google Sheets reporting.',
  },
];

export default function MakeIntegrationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'TechArticle',
        headline: 'Volia × Make — Documentation scénarios webhooks',
        description: metadata.description,
        author: { '@type': 'Organization', name: 'Volia' },
        publisher: { '@type': 'Organization', name: 'Volia', url: 'https://volia.fr' },
        url: 'https://volia.fr/integrations/make',
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
          <div className="flex items-center gap-3 text-xs text-content-tertiary mb-4">
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 inline-flex items-center gap-1">
              <Layers size={11} /> Make
            </span>
            <span>·</span>
            <span>4 000+ apps</span>
            <span>·</span>
            <span>Scénarios visuels</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            Volia × <span className="text-violet-400">Make</span>
          </h1>

          <p className="text-lg text-content-secondary leading-relaxed mb-12">
            Make (ex-Integromat) propose un éditeur visuel de scénarios bien plus puissant que Zapier
            pour les workflows multi-étapes avec branchements, filtres et transformations JSON.
            Volia s&apos;y branche en 2 modules : <strong>Custom Webhook</strong> pour recevoir les events,
            <strong> HTTP module</strong> pour appeler l&apos;API.
          </p>

          {/* Setup Trigger */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Webhook size={20} className="text-violet-400" />
              Setup Trigger (Volia → Make)
            </h2>
            <ol className="space-y-3 text-sm text-content-secondary">
              <li className="rounded-xl border border-line bg-surface-card p-4">
                <strong className="text-content-primary block mb-1">1. Créez un Custom webhook dans Make</strong>
                Dans Make Scenario builder → ajoutez le module <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">Webhooks → Custom webhook</code>.
                Cliquez sur <em>Add</em>, donnez un nom, copiez l&apos;URL générée
                (type <code className="text-xs">https://hook.eu1.make.com/...</code>).
              </li>
              <li className="rounded-xl border border-line bg-surface-card p-4">
                <strong className="text-content-primary block mb-1">2. Côté Volia, créez le webhook</strong>
                Allez sur <Link href="/settings/webhooks" className="text-violet-400 hover:underline">Paramètres → Webhooks</Link> →
                <em> Nouveau webhook</em>, sélectionnez l&apos;event Volia
                (ex: <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">crm.deal.won</code> ou
                <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">email.replied</code>),
                collez l&apos;URL Make.
              </li>
              <li className="rounded-xl border border-line bg-surface-card p-4">
                <strong className="text-content-primary block mb-1">3. Testez l&apos;URL depuis Volia</strong>
                Cliquez sur l&apos;icône <em>Tester</em> à côté de votre webhook : Volia envoie un payload de test
                (<code className="text-xs">event_type: &quot;test&quot;</code>). Make détecte automatiquement la structure JSON
                et vous permet de mapper les champs dans les modules suivants.
              </li>
              <li className="rounded-xl border border-line bg-surface-card p-4">
                <strong className="text-content-primary block mb-1">4. Construisez le scénario</strong>
                Ajoutez ensuite les modules cibles (Google Sheets, HubSpot, Slack, Notion, etc.) et mappez les valeurs
                Volia (ex: <code className="text-xs">deal_id</code>, <code className="text-xs">value_cents</code>, <code className="text-xs">contact.email</code>)
                via le drag&amp;drop natif de Make.
              </li>
            </ol>
          </section>

          {/* Setup Action */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Code size={20} className="text-violet-400" />
              Setup Action (Make → Volia API)
            </h2>
            <p className="text-sm text-content-secondary mb-3">
              Pour appeler l&apos;API Volia depuis Make (lister des prospects, créer un contact, etc.) :
              utilisez le module <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">HTTP → Make a request</code>.
            </p>
            <div className="rounded-2xl border border-line bg-surface-card p-5">
              <ul className="space-y-2 text-sm text-content-secondary">
                <li><strong className="text-content-primary">URL</strong> : <code className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated">https://volia.fr/api/v1/prospects</code></li>
                <li><strong className="text-content-primary">Method</strong> : GET (ou POST/PATCH selon endpoint)</li>
                <li><strong className="text-content-primary">Headers</strong> :
                  <pre className="mt-1 text-xs font-mono p-2 rounded bg-surface-base border border-line">
{`Authorization: Bearer pk_votre_clé
Content-Type: application/json`}
                  </pre>
                </li>
                <li><strong className="text-content-primary">Parse response</strong> : Yes (auto-JSON)</li>
                <li><strong className="text-content-primary">Query params / Body</strong> : selon endpoint (voir <Link href="/api" className="text-violet-400 hover:underline">doc API</Link>)</li>
              </ul>
            </div>
            <p className="text-xs text-content-tertiary mt-3">
              Astuce : vous pouvez ensuite itérer sur <code>data[]</code> avec un module <em>Iterator</em> pour traiter chaque prospect un à un dans les étapes suivantes.
            </p>
          </section>

          {/* Scénarios populaires */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-violet-400" />
              Scénarios populaires
            </h2>
            <div className="space-y-3">
              {SCENARIOS.map((s, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface-card p-5">
                  <h3 className="font-semibold text-content-primary mb-2">{s.title}</h3>
                  <p className="text-xs text-content-tertiary leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Events disponibles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">21 events disponibles</h2>
            <p className="text-sm text-content-secondary leading-relaxed mb-3">
              La liste complète des events webhook (avec sample payload JSON pour chaque) est accessible publiquement :
            </p>
            <div className="rounded-xl border border-line bg-surface-card p-4 font-mono text-xs text-content-secondary">
              GET <span className="text-violet-400">https://volia.fr/api/v1/webhooks/events</span>
            </div>
            <p className="text-xs text-content-tertiary mt-2">
              Catégories disponibles aujourd&apos;hui : <strong>Prospection</strong> (prospect.created),{' '}
              <strong>Campagnes</strong> (campaign.completed, email.delivered/opened/clicked/replied),{' '}
              <strong>Séquences</strong> (sequence.enrolled),{' '}
              <strong>CRM</strong> (crm.contact.created, crm.deal.created, crm.deal.stage_changed, crm.deal.won, crm.deal.lost),{' '}
              et le wildcard <code className="text-xs">*</code> pour tout recevoir.
              D&apos;autres events (campaign.sent, email.bounced, sms.*, sequence.completed, prospect.enriched/opt_out, search.completed) sont à venir.
            </p>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <Layers size={32} className="text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Lancez votre premier scénario Make</h2>
            <p className="text-content-secondary mb-6 max-w-xl mx-auto">
              Tout est prêt côté Volia. Créez votre clé API, configurez votre webhook, dessinez votre scénario.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/settings/webhooks"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30">
                <Webhook size={16} /> Configurer un webhook
              </Link>
              <Link href="/api"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-line text-sm font-semibold transition">
                <Code size={16} /> Doc API <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <ReaderFooter />
    </div>
  );
}
