// Helper fire-and-forget pour logger des activités CRM depuis le module Campagnes.
//
// Objectif : créer une vue 360° dans le CRM. Quand on envoie un email à un
// contact qui existe AUSSI dans le CRM (même user_id / owner_id, même email),
// on insère une activity dans crm_activities pour qu'elle apparaisse dans la
// timeline du contact et (si trouvé) du deal lié.
//
// ⚠️ Sécurité : on filtre STRICTEMENT par user_id = ownerId du campaign, pour
// éviter de logger dans le CRM d'un autre user (data leak cross-tenant).
//
// ⚠️ Robustesse : ne JAMAIS faire échouer le cron d'envoi. Toute erreur est
// catchée et loggée, le helper retourne null en cas de problème.

/**
 * Log une activity "email envoyé" dans le CRM si le destinataire matche un contact CRM.
 *
 * @param {object} args
 * @param {object} args.supabaseAdmin  - Client Supabase service_role
 * @param {string} args.ownerId        - user_id propriétaire du campaign (filtre CRM)
 * @param {string} args.recipientEmail - Email du destinataire
 * @param {object} args.campaign       - { id, name, subject, ... }
 * @param {string} [args.providerId]   - ID Resend (preuve d'envoi)
 * @returns {Promise<{logged: boolean, activity_id?: string, contact_id?: string, deal_id?: string|null} | null>}
 */
export async function logEmailSentToCrm({ supabaseAdmin, ownerId, recipientEmail, campaign, providerId }) {
  try {
    if (!supabaseAdmin || !ownerId || !recipientEmail || !campaign?.id) {
      return null;
    }

    const emailLower = String(recipientEmail).trim().toLowerCase();
    if (!emailLower) return null;

    // 1) Lookup contact CRM (strict user_id match → pas de data leak)
    const { data: contact, error: contactErr } = await supabaseAdmin
      .from('crm_contacts')
      .select('id')
      .eq('user_id', ownerId)
      .ilike('email', emailLower)
      .maybeSingle();

    if (contactErr) {
      console.warn('[crm-activity-logger] contact lookup error', contactErr.message);
      return null;
    }
    if (!contact) {
      // Pas de contact CRM correspondant → no-op silencieux
      return null;
    }

    // 2) Lookup deal ouvert lié à ce contact (optionnel)
    let dealId = null;
    const { data: deal } = await supabaseAdmin
      .from('crm_deals')
      .select('id')
      .eq('user_id', ownerId)
      .eq('contact_id', contact.id)
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (deal) dealId = deal.id;

    // 3) Insert activity (email envoyé = completed)
    const nowIso = new Date().toISOString();
    const subject = campaign.subject || campaign.name || 'sans objet';

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('crm_activities')
      .insert({
        user_id: ownerId,
        contact_id: contact.id,
        deal_id: dealId,
        type: 'email',
        content: `Email envoyé : ${subject}`,
        completed_at: nowIso,
        metadata: {
          source: 'campagne',
          campaign_id: campaign.id,
          campaign_name: campaign.name || null,
          provider_id: providerId || null,
        },
      })
      .select('id')
      .single();

    if (insertErr) {
      console.warn('[crm-activity-logger] insert error', insertErr.message);
      return null;
    }

    return {
      logged: true,
      activity_id: inserted.id,
      contact_id: contact.id,
      deal_id: dealId,
    };
  } catch (err) {
    // Fire-and-forget : on n'échoue jamais le caller
    console.error('[crm-activity-logger] unexpected error', err);
    return null;
  }
}

// ─── Webhook events (Resend / Twilio) ────────────────────────────────────────
//
// Quand Resend ou Twilio nous notifie d'un événement (open, click, delivered,
// bounce…), on logge une activité CRM correspondante pour enrichir la timeline
// du contact + on bump son engagement_score. Tout en fire-and-forget.

// Templating français des contenus d'activité par type d'événement.
const EMAIL_EVENT_CONTENT = {
  delivered: 'Email délivré',
  opened: 'Email ouvert',
  clicked: 'Lien cliqué dans l\'email',
  bounced: 'Email rejeté (bounce)',
  complained: 'Plainte spam reçue',
  replied: 'Réponse reçue à l\'email',
  failed: 'Échec d\'envoi de l\'email',
};

const SMS_EVENT_CONTENT = {
  delivered: 'SMS délivré',
  failed: 'Échec de livraison SMS',
  undelivered: 'SMS non délivré',
  sent: 'SMS envoyé',
};

// Score d'engagement par event email. Click > Open > Reply > Delivered.
// Bounce/complained = pénalité (négatif).
const EMAIL_ENGAGEMENT_DELTA = {
  delivered: 0,
  opened: 1,
  clicked: 5,
  replied: 10,
  bounced: -5,
  complained: -10,
};

const SMS_ENGAGEMENT_DELTA = {
  delivered: 1,
  failed: -2,
  undelivered: -2,
};

/**
 * Helper interne : trouve le contact CRM + deal lié pour un destinataire.
 * Retourne { contact_id, deal_id } ou null si pas de match (no-op silencieux).
 */
async function findCrmContactAndDeal(supabaseAdmin, ownerId, { email, phone }) {
  if (!supabaseAdmin || !ownerId) return null;
  if (!email && !phone) return null;

  let query = supabaseAdmin.from('crm_contacts').select('id').eq('user_id', ownerId);
  if (email) {
    query = query.ilike('email', String(email).trim().toLowerCase());
  } else {
    query = query.eq('phone', String(phone).trim());
  }
  const { data: contact } = await query.maybeSingle();
  if (!contact) return null;

  let dealId = null;
  const { data: deal } = await supabaseAdmin
    .from('crm_deals')
    .select('id')
    .eq('user_id', ownerId)
    .eq('contact_id', contact.id)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (deal) dealId = deal.id;

  return { contact_id: contact.id, deal_id: dealId };
}

/**
 * Log un événement webhook email (delivered/opened/clicked/bounced/complained)
 * dans la timeline CRM du contact, et bump son engagement_score.
 *
 * @param {object} args
 * @param {object} args.supabaseAdmin
 * @param {string} args.ownerId
 * @param {string} args.recipientEmail
 * @param {object} args.campaign      - { id, name, subject?, ... }
 * @param {string} args.eventType     - 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'replied'
 * @param {string} [args.providerId]  - ID Resend
 * @returns {Promise<{logged: boolean, activity_id?: string, contact_id?: string} | null>}
 */
export async function logEmailEventToCrm({
  supabaseAdmin,
  ownerId,
  recipientEmail,
  campaign,
  eventType,
  providerId,
}) {
  try {
    if (!eventType || !EMAIL_EVENT_CONTENT[eventType]) return null;
    if (!campaign?.id) return null;

    const match = await findCrmContactAndDeal(supabaseAdmin, ownerId, { email: recipientEmail });
    if (!match) return null;

    const subject = campaign.subject || campaign.name || 'sans objet';
    const baseContent = EMAIL_EVENT_CONTENT[eventType];
    const content = `${baseContent} : ${subject}`;

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('crm_activities')
      .insert({
        user_id: ownerId,
        contact_id: match.contact_id,
        deal_id: match.deal_id,
        type: 'email',
        content,
        completed_at: new Date().toISOString(),
        metadata: {
          source: 'campagne',
          event_type: eventType,
          campaign_id: campaign.id,
          campaign_name: campaign.name || null,
          provider_id: providerId || null,
        },
      })
      .select('id')
      .single();

    if (insErr) {
      console.warn('[crm-activity-logger] email event insert error', insErr.message);
      return null;
    }

    // Bump engagement score (atomique via RPC)
    const delta = EMAIL_ENGAGEMENT_DELTA[eventType] || 0;
    if (delta !== 0) {
      const { error: rpcErr } = await supabaseAdmin.rpc('bump_crm_contact_engagement', {
        contact_uuid: match.contact_id,
        delta,
      });
      if (rpcErr) console.warn('[crm-activity-logger] engagement bump error', rpcErr.message);
    }

    return { logged: true, activity_id: inserted.id, contact_id: match.contact_id };
  } catch (err) {
    console.error('[crm-activity-logger] logEmailEventToCrm error', err);
    return null;
  }
}

/**
 * Log un événement webhook SMS (delivered/failed) dans la timeline CRM.
 *
 * @param {object} args
 * @param {object} args.supabaseAdmin
 * @param {string} args.ownerId
 * @param {string} args.recipientPhone
 * @param {object} args.campaign     - { id, name, body?, ... }
 * @param {string} args.eventType    - 'delivered' | 'failed' | 'undelivered' | 'sent'
 * @param {string} [args.providerId] - MessageSid Twilio
 * @returns {Promise<{logged: boolean, activity_id?: string, contact_id?: string} | null>}
 */
export async function logSmsEventToCrm({
  supabaseAdmin,
  ownerId,
  recipientPhone,
  campaign,
  eventType,
  providerId,
}) {
  try {
    if (!eventType || !SMS_EVENT_CONTENT[eventType]) return null;
    if (!campaign?.id) return null;

    const match = await findCrmContactAndDeal(supabaseAdmin, ownerId, { phone: recipientPhone });
    if (!match) return null;

    const baseContent = SMS_EVENT_CONTENT[eventType];
    const content = campaign.name ? `${baseContent} : ${campaign.name}` : baseContent;

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('crm_activities')
      .insert({
        user_id: ownerId,
        contact_id: match.contact_id,
        deal_id: match.deal_id,
        type: 'sms',
        content,
        completed_at: new Date().toISOString(),
        metadata: {
          source: 'campagne',
          event_type: eventType,
          campaign_id: campaign.id,
          campaign_name: campaign.name || null,
          provider_id: providerId || null,
        },
      })
      .select('id')
      .single();

    if (insErr) {
      console.warn('[crm-activity-logger] sms event insert error', insErr.message);
      return null;
    }

    const delta = SMS_ENGAGEMENT_DELTA[eventType] || 0;
    if (delta !== 0) {
      const { error: rpcErr } = await supabaseAdmin.rpc('bump_crm_contact_engagement', {
        contact_uuid: match.contact_id,
        delta,
      });
      if (rpcErr) console.warn('[crm-activity-logger] engagement bump error', rpcErr.message);
    }

    return { logged: true, activity_id: inserted.id, contact_id: match.contact_id };
  } catch (err) {
    console.error('[crm-activity-logger] logSmsEventToCrm error', err);
    return null;
  }
}
