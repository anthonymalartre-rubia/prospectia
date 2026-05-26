// Auto-création CRM depuis une réponse inbound (email reply / SMS reply).
//
// Quand un prospect répond à un email ou SMS de campagne, on veut zéro effort
// manuel : le contact apparaît dans le CRM, un deal au stage "Lead" (10%) est
// créé, une activity est loggée, et l'engagement score est incrémenté.
//
// Garanties :
//   - Fire-and-forget : ne lance JAMAIS d'exception (try/catch global).
//     Le caller (webhook) renvoie toujours 200 — un échec ici ne doit pas
//     déclencher de retry chez Resend/Twilio.
//   - Dedup : si le contact existe déjà, on le réutilise. Pareil pour le deal
//     ouvert (open) lié à ce contact.
//   - Cross-tenant safety : tout filtré strictement par user_id = ownerId.
//   - Defensive : si une colonne optionnelle manque (engagement_score, tags),
//     on ignore silencieusement l'update partiel.

import { getOrCreateDefaultPipeline } from './crm';

const ENGAGEMENT_BUMP_REPLY = 10;
const BODY_TRUNCATE = 2000;

function truncate(str, max = BODY_TRUNCATE) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function normalizeEmail(v) {
  if (!v) return null;
  return String(v).trim().toLowerCase();
}

function normalizePhone(v) {
  if (!v) return null;
  return String(v).trim();
}

function guessNameFromEmail(email) {
  if (!email) return null;
  const local = email.split('@')[0] || '';
  if (!local) return null;
  // "john.doe" → "John Doe"
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || null;
}

/**
 * @param {object} args
 * @param {object} args.supabaseAdmin - Client supabase service_role
 * @param {string} args.ownerId       - user_id propriétaire (le sender)
 * @param {'email'|'sms'} args.channel
 * @param {string} args.from          - email ou phone E.164 de l'expéditeur
 * @param {string} args.body          - corps du message (text)
 * @param {string} [args.subject]     - objet (email uniquement)
 * @param {string} [args.replyToProviderId] - provider_id du message original
 *                                            (Resend message_id ou Twilio SID) pour traçage
 * @returns {Promise<{contact_id?: string, deal_id?: string, contact_created?: boolean, deal_created?: boolean, activity_id?: string, error?: string}>}
 */
export async function autoCreateFromReply({
  supabaseAdmin,
  ownerId,
  channel,
  from,
  body,
  subject = null,
  replyToProviderId = null,
}) {
  try {
    if (!supabaseAdmin || !ownerId || !channel || !from) {
      return { error: 'missing required args' };
    }
    if (channel !== 'email' && channel !== 'sms') {
      return { error: `invalid channel: ${channel}` };
    }

    const isEmail = channel === 'email';
    const fromEmail = isEmail ? normalizeEmail(from) : null;
    const fromPhone = !isEmail ? normalizePhone(from) : null;

    // ───────── 1) Lookup or create CRM contact ─────────
    let contact = null;
    let contactCreated = false;

    {
      let query = supabaseAdmin
        .from('crm_contacts')
        .select('id, email, phone, tags, engagement_score')
        .eq('user_id', ownerId);

      if (isEmail) {
        query = query.ilike('email', fromEmail);
      } else {
        query = query.eq('phone', fromPhone);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (error) {
        console.warn('[crm-auto-create] contact lookup error', error.message);
      }
      contact = data || null;
    }

    if (!contact) {
      const insertRow = {
        user_id: ownerId,
        source: 'auto-campagne',
        engagement_score: ENGAGEMENT_BUMP_REPLY,
        last_engagement_at: new Date().toISOString(),
        tags: ['replied'],
      };
      if (isEmail) {
        insertRow.email = fromEmail;
        insertRow.name = guessNameFromEmail(fromEmail);
      } else {
        insertRow.phone = fromPhone;
        insertRow.name = fromPhone; // best effort
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('crm_contacts')
        .insert(insertRow)
        .select('id, email, phone, tags, engagement_score')
        .single();

      if (insertErr || !inserted) {
        console.error('[crm-auto-create] contact insert failed', insertErr?.message);
        return { error: 'contact_insert_failed' };
      }
      contact = inserted;
      contactCreated = true;
    }

    // ───────── 2) Pipeline + Lead stage (probability=10) ─────────
    let leadStageId = null;
    let pipelineId = null;

    try {
      const pipeline = await getOrCreateDefaultPipeline(supabaseAdmin, ownerId);
      pipelineId = pipeline?.id || null;
      const stages = Array.isArray(pipeline?.stages) ? pipeline.stages : [];
      // Priorité : stage nommé "Lead" puis fallback sur probability=10 puis premier ouvert
      const leadByName = stages.find((s) => String(s.name).toLowerCase() === 'lead');
      const leadByProb = stages.find((s) => s.probability === 10 && s.closing_type == null);
      const firstOpen = stages.find((s) => s.closing_type == null);
      leadStageId = (leadByName || leadByProb || firstOpen)?.id || null;
    } catch (e) {
      console.warn('[crm-auto-create] pipeline error', e.message);
    }

    // ───────── 3) Lookup or create open deal ─────────
    let deal = null;
    let dealCreated = false;

    {
      const { data, error } = await supabaseAdmin
        .from('crm_deals')
        .select('id')
        .eq('user_id', ownerId)
        .eq('contact_id', contact.id)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[crm-auto-create] deal lookup error', error.message);
      }
      deal = data || null;
    }

    if (!deal && pipelineId && leadStageId) {
      const { data: insertedDeal, error: dealErr } = await supabaseAdmin
        .from('crm_deals')
        .insert({
          user_id: ownerId,
          contact_id: contact.id,
          pipeline_id: pipelineId,
          stage_id: leadStageId,
          title: `Lead from ${channel === 'email' ? 'email' : 'SMS'} reply`,
          status: 'open',
          value_cents: 0,
          currency: 'EUR',
          metadata: {
            auto_created: true,
            source_channel: channel,
            source_provider_id: replyToProviderId || null,
            source: 'inbound-webhook',
          },
        })
        .select('id')
        .single();
      if (dealErr) {
        console.warn('[crm-auto-create] deal insert error', dealErr.message);
      } else if (insertedDeal) {
        deal = insertedDeal;
        dealCreated = true;
      }
    }

    // ───────── 4) Insert CRM activity (reply received) ─────────
    let activityId = null;
    {
      const nowIso = new Date().toISOString();
      const subjectClean = subject ? String(subject).slice(0, 250) : null;
      const contentHeader =
        channel === 'email'
          ? `Email reçu${subjectClean ? ` : ${subjectClean}` : ''}`
          : `SMS reçu`;
      const content = `${contentHeader}\n\n${truncate(body)}`;

      const { data: act, error: actErr } = await supabaseAdmin
        .from('crm_activities')
        .insert({
          user_id: ownerId,
          contact_id: contact.id,
          deal_id: deal?.id || null,
          type: channel, // 'email' | 'sms'
          content,
          completed_at: nowIso,
          metadata: {
            auto_created_reply: true,
            auto_created: true,
            channel,
            subject: subjectClean,
            from,
            reply_to_provider_id: replyToProviderId || null,
            source: 'inbound-webhook',
          },
        })
        .select('id')
        .single();
      if (actErr) {
        console.warn('[crm-auto-create] activity insert error', actErr.message);
      } else if (act) {
        activityId = act.id;
      }
    }

    // ───────── 5) Bump engagement_score + last_engagement_at + tags ─────────
    if (!contactCreated) {
      try {
        const currentTags = Array.isArray(contact.tags) ? contact.tags : [];
        const hasReplied = currentTags.some(
          (t) => String(t).toLowerCase() === 'replied'
        );
        const nextTags = hasReplied ? currentTags : [...currentTags, 'replied'];

        const currentScore = Number(contact.engagement_score) || 0;
        const update = {
          engagement_score: currentScore + ENGAGEMENT_BUMP_REPLY,
          last_engagement_at: new Date().toISOString(),
          tags: nextTags,
        };
        const { error: upErr } = await supabaseAdmin
          .from('crm_contacts')
          .update(update)
          .eq('id', contact.id)
          .eq('user_id', ownerId);
        if (upErr) {
          console.warn('[crm-auto-create] contact bump error', upErr.message);
        }
      } catch (e) {
        console.warn('[crm-auto-create] contact bump exception', e.message);
      }
    }

    return {
      contact_id: contact.id,
      deal_id: deal?.id || null,
      contact_created: contactCreated,
      deal_created: dealCreated,
      activity_id: activityId,
    };
  } catch (err) {
    console.error('[crm-auto-create] unexpected error', err);
    return { error: err?.message || 'unknown' };
  }
}
