// GET /api/v1/webhooks/events
// Liste les event_types disponibles pour les subscriptions webhook.
// Sert principalement aux dropdowns Zapier/Make ("Choose a Trigger Event").
//
// Pas d'auth nécessaire (catalogue statique purement public) — mais on
// garde la même base URL /api/v1/* pour simplifier le mapping côté Zapier.

import { NextResponse } from 'next/server';
import { apiCorsHeaders } from '@/lib/api-auth';
import { WEBHOOK_EVENTS, getAvailableEvents } from '@/lib/webhooks/events';

// Echantillon de payload par event — utile pour Zapier qui demande un
// "sample payload" pour mapper les champs côté UI.
const SAMPLES = {
  '*': { message: 'Wildcard — schéma variable selon l\'event reçu.' },
  'prospect.created': {
    list_id: 'uuid',
    list_name: 'Coiffeurs Paris',
    inserted_count: 25,
    sample: [{ email: 'contact@salon.fr', phone: '+33145678901', first_name: 'Marie Dupont', company: 'Salon Beauté' }],
  },
  'prospect.enriched': { prospect_id: 'uuid', email: 'found@example.com', method: 'waterfall' },
  'prospect.opt_out': { email: 'contact@example.com', reason: 'unsubscribe link clicked' },
  'search.completed': { session_id: 'uuid', results_count: 247, duration_seconds: 42 },
  'campaign.sent': { campaign_id: 'uuid', name: 'Relance Mai', list_id: 'uuid', sent_count: 247 },
  'campaign.completed': { campaign_id: 'uuid', name: 'Relance Mai', total_sent: 247, total_delivered: 241, total_bounced: 6, total_opened: 89, total_clicked: 12 },
  'email.delivered': { campaign_id: 'uuid', to: 'prospect@example.com', delivered_at: '2026-05-26T10:00:00Z' },
  'email.opened': { campaign_id: 'uuid', to: 'prospect@example.com', opened_at: '2026-05-26T10:15:00Z' },
  'email.clicked': { campaign_id: 'uuid', to: 'prospect@example.com', url: 'https://example.com/cta', clicked_at: '2026-05-26T10:16:00Z' },
  'email.bounced': { campaign_id: 'uuid', to: 'prospect@example.com', reason: 'mailbox does not exist' },
  'email.replied': { campaign_id: 'uuid', from_email: 'prospect@example.com', subject: 'Re: ...', body_preview: 'Oui, intéressé...', contact_id: 'uuid', deal_id: 'uuid' },
  'sms.delivered': { campaign_id: 'uuid', to_phone: '+33612345678', delivered_at: '2026-05-26T10:00:00Z' },
  'sms.replied': { campaign_id: 'uuid', from_phone: '+33612345678', body: 'STOP' },
  'sequence.enrolled': { sequence_id: 'uuid', contact_id: 'uuid' },
  'sequence.completed': { sequence_id: 'uuid', contact_id: 'uuid' },
  'crm.contact.created': { contact_id: 'uuid', name: 'Marie Dupont', email: 'marie@example.com' },
  'crm.deal.created': {
    deal_id: 'uuid',
    title: 'Salon Beauté - Abo Pro',
    value_cents: 49000,
    currency: 'EUR',
    pipeline_id: 'uuid',
    stage_id: 'uuid',
    stage_name: 'Lead',
    contact: { id: 'uuid', name: 'Marie Dupont', email: 'marie@example.com' },
  },
  'crm.deal.stage_changed': {
    deal_id: 'uuid',
    title: 'Salon Beauté - Abo Pro',
    from_stage: { id: 'uuid', name: 'Lead' },
    to_stage: { id: 'uuid', name: 'Démo planifiée' },
  },
  'crm.deal.won': { deal_id: 'uuid', title: 'Salon Beauté - Abo Pro', value_cents: 49000, currency: 'EUR', closed_at: '2026-05-26T14:00:00Z' },
  'crm.deal.lost': { deal_id: 'uuid', title: 'Salon Beauté - Abo Pro', closed_at: '2026-05-26T14:00:00Z' },
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: apiCorsHeaders() });
}

export async function GET() {
  // On ne retourne QUE les events réellement émis aujourd'hui (available=true)
  // afin de ne pas promettre à Zapier/Make un Trigger qui ne se déclenchera
  // jamais. Les events `available=false` sont marqués "à venir" dans la doc.
  return NextResponse.json(
    {
      data: getAvailableEvents().map((e) => ({
        id: e.id,
        label: e.label,
        module: e.module,
        description: e.description,
        sample: SAMPLES[e.id] || null,
      })),
    },
    { headers: apiCorsHeaders() }
  );
}

// Référence WEBHOOK_EVENTS importée pour rester compatible avec les futurs
// usages internes qui voudraient TOUS les events (y compris les non émis).
void WEBHOOK_EVENTS;
