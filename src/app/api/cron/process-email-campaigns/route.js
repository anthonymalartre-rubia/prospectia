// Cron Vercel qui process les email_sends en status 'pending'.
//
// Stratégie :
//   - Tourne toutes les 5 min (vercel.json)
//   - Récupère max BATCH_SIZE sends pending les plus anciens
//   - Pour chaque : récupère le contact + campaign + applique template +
//     envoie via Resend + update le status du send
//   - Recalcule les stats de la campagne à la fin
//   - Si une campagne n'a plus aucun send pending → status 'sent'
//
// Protégé par CRON_SECRET (header Authorization Bearer).

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { applyTemplate, appendOptOutFooter } from '@/lib/campaign-templates';
import { cleanEnv } from '@/lib/envClean';
import { logEmailSentToCrm } from '@/lib/crm-activity-logger';
import { buildCampaignReplyAddress } from '@/lib/inbound-domain';
import { emitWebhookEvent } from '@/lib/webhooks/emitter';
import { reportError } from '@/lib/errorReporting';
import {
  calculateCurrentDay,
  getCurrentPhase,
  countTodaySendsForSender,
  WARMUP_DURATION_DAYS,
} from '@/lib/warmup';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Pro tier requis si > 10s sur free, mais 60 ici par sécurité

// Resend rate limit : ~10 emails/sec. On reste prudent (5/sec = 50 max par batch sur 10s)
const BATCH_SIZE = 50;

export async function GET(request) {
  try {
    return await handleCron(request);
  } catch (err) {
    // Capture Sentry + Vercel logs. Un cron qui crash silencieusement
    // = email queue bloquée sans alerte → on remonte tout à Sentry.
    reportError(err, { cron: 'process-email-campaigns' });
    return NextResponse.json(
      { error: err?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

async function handleCron(request) {
  // Auth via CRON_SECRET
  const expected = cleanEnv(process.env.CRON_SECRET);
  const provided = request.headers.get('authorization');
  if (expected && provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // 1) Auto-promote les campagnes 'scheduled' arrivées à échéance → 'sending'
  await supabase
    .from('email_campaigns')
    .update({ status: 'sending', started_at: new Date().toISOString() })
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  // 2) Récup le batch de sends pending (les plus anciens).
  //
  // Filtre smart-scheduling : on ne pickup un send que si
  //   - scheduled_for IS NULL (legacy / smart_scheduling=false)
  //   - OU scheduled_for <= NOW() (fenêtre 9h-17h heure locale atteinte)
  //
  // Les sends planifiés dans le futur restent en pending et seront récupérés
  // au cron qui tourne dans leur fenêtre. L'index partiel
  // idx_email_sends_scheduled_for accélère le scan.
  const nowIso = new Date().toISOString();
  const { data: sends, error: fetchErr } = await supabase
    .from('email_sends')
    .select('id, campaign_id, contact_id, email')
    .eq('status', 'pending')
    .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    console.error('[cron/email-campaigns] fetch error', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!sends || sends.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Rien en queue' });
  }

  // 3) Charge en bulk les campaigns et contacts dont on a besoin
  const campaignIds = [...new Set(sends.map((s) => s.campaign_id))];
  const contactIds = [...new Set(sends.map((s) => s.contact_id))];

  const [{ data: campaigns }, { data: contacts }] = await Promise.all([
    supabase.from('email_campaigns').select('id, owner_id, name, subject, subject_variant_2, subject_variant_3, ab_test_sample_size, ab_test_winner_variant, ab_test_picked_at, body_html, from_name, from_email, reply_to, status, email_sender_id').in('id', campaignIds),
    supabase.from('prospect_contacts').select('id, email, phone, first_name, last_name, company, position_title, custom_fields, opt_out').in('id', contactIds),
  ]);

  const campaignMap = new Map((campaigns || []).map((c) => [c.id, c]));
  const contactMap = new Map((contacts || []).map((c) => [c.id, c]));

  // 3.bis) Bulk fetch des email_senders verified référencés par ces campaigns.
  // On ne charge QUE les senders status='verified' : un sender supprimé ou non
  // vérifié provoquera un fail explicite du send (cf. plus bas).
  const senderIds = [...new Set(
    (campaigns || [])
      .map((c) => c.email_sender_id)
      .filter(Boolean)
  )];
  let senderMap = new Map();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from('email_senders')
      .select('id, user_id, domain, from_name, status, verified_at')
      .in('id', senderIds)
      .eq('status', 'verified');
    senderMap = new Map((senders || []).map((s) => [s.id, s]));
  }

  // 3.ter) WARMUP — pour chaque sender concerné, on charge sa session de warmup
  // active (s'il y en a une). On calcule le current_day et le quota restant
  // pour aujourd'hui. Ce quota sera décrémenté à chaque envoi successful pour
  // limiter les sends dans CE batch et éviter de dépasser la limite jour.
  //
  // Senders sans warmup_session = legacy ou jamais en warmup → quota infini.
  const warmupQuotaBySender = new Map(); // senderId → remaining today (Infinity si pas de warmup)
  const warmupSessionMap = new Map(); // senderId → row warmup_session active
  const warmupSessionsToComplete = []; // ids des sessions à marquer 'completed'
  const warmupSessionsToUpdateDay = []; // [{id, current_day}] à update si jour avancé

  if (senderIds.length > 0) {
    const { data: warmupSessions } = await supabase
      .from('warmup_sessions')
      .select('id, sender_id, started_at, current_day, status')
      .in('sender_id', senderIds)
      .eq('status', 'active');

    for (const session of warmupSessions || []) {
      const computedDay = calculateCurrentDay(session.started_at);

      if (computedDay > WARMUP_DURATION_DAYS) {
        // Warmup terminé → on marque la session completed et quota infini.
        warmupSessionsToComplete.push(session.id);
        warmupQuotaBySender.set(session.sender_id, Infinity);
        continue;
      }

      if (computedDay !== session.current_day) {
        warmupSessionsToUpdateDay.push({ id: session.id, current_day: computedDay });
      }

      const phase = getCurrentPhase(computedDay);
      if (!phase) {
        warmupQuotaBySender.set(session.sender_id, Infinity);
        continue;
      }

      const alreadySent = await countTodaySendsForSender(supabase, session.sender_id);
      const remaining = Math.max(0, phase.maxPerDay - alreadySent);
      warmupQuotaBySender.set(session.sender_id, remaining);
      warmupSessionMap.set(session.sender_id, { ...session, current_day: computedDay, phase });
    }
  }

  // Persiste les updates de session warmup (best-effort, ne bloque pas).
  if (warmupSessionsToComplete.length > 0) {
    await supabase
      .from('warmup_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in('id', warmupSessionsToComplete);
  }
  for (const upd of warmupSessionsToUpdateDay) {
    await supabase
      .from('warmup_sessions')
      .update({ current_day: upd.current_day, updated_at: new Date().toISOString() })
      .eq('id', upd.id);
  }

  let warmupThrottled = 0; // compteur pour le log de retour

  // 3.quater) Pre-filtre des sends pour respecter le warmup quota.
  // On itère dans l'ordre (FIFO sur created_at) et on garde les sends tant que
  // le sender a du quota. Le surplus reste 'pending' et sera retraité au prochain
  // cron (le lendemain, quota frais).
  const sendsToProcess = [];
  const senderRemainingBatch = new Map(warmupQuotaBySender); // copie mutable

  for (const send of sends) {
    const campaign = campaignMap.get(send.campaign_id);
    const senderId = campaign?.email_sender_id;

    // Pas de sender configuré OU sender pas en warmup → on laisse passer.
    // La logique de fail "no verified sender" s'appliquera dans la boucle d'envoi.
    if (!senderId || !senderRemainingBatch.has(senderId)) {
      sendsToProcess.push(send);
      continue;
    }

    const remaining = senderRemainingBatch.get(senderId);
    if (remaining === Infinity || remaining > 0) {
      sendsToProcess.push(send);
      if (remaining !== Infinity) {
        senderRemainingBatch.set(senderId, remaining - 1);
      }
    } else {
      // Quota épuisé pour ce sender → on skip ce send (reste pending).
      warmupThrottled++;
    }
  }

  if (sendsToProcess.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      warmup_throttled: warmupThrottled,
      message: 'Tous les envois en queue sont throttlés par le warmup (quota jour atteint).',
    });
  }

  // 3.quinquies) A/B testing — pour chaque campagne en A/B (subject_variant_2
  // non-null), on calcule l'état courant :
  //   - sentSoFar : nombre de sends 'sent'/'delivered'/etc. déjà partis
  //     (exclut 'pending' et 'failed' pour ne pas biaiser)
  //   - winnerVariant : 1/2/3 si déjà picked, null sinon
  //   - variantCount : 2 ou 3 (selon que subject_variant_3 est null ou pas)
  //
  // Si sentSoFar >= sample_size ET winner pas encore picked, on pick le winner
  // immédiatement (sur les stats à ce moment) et on update la campagne.
  // Tous les sends suivants du batch utiliseront le winner.
  const abStateByCampaign = new Map();
  for (const cid of campaignIds) {
    const c = campaignMap.get(cid);
    if (!c || !c.subject_variant_2) continue; // pas d'A/B
    const variantCount = c.subject_variant_3 ? 3 : 2;
    const sampleSize = c.ab_test_sample_size || 100;
    let winnerVariant = c.ab_test_winner_variant || null;

    // Compte les sends "réels" (non pending, non failed) pour décider phase
    let sentSoFar = 0;
    try {
      const { count } = await supabase
        .from('email_sends')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', cid)
        .in('status', ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'replied']);
      sentSoFar = count || 0;
    } catch (e) {
      console.warn('[cron/email-campaigns] AB sentSoFar count failed', cid, e?.message);
    }

    // Pick le winner si on a atteint le sample et pas encore picked
    if (!winnerVariant && sentSoFar >= sampleSize) {
      try {
        const { data: variantStats } = await supabase
          .from('email_sends')
          .select('subject_variant, status, opened_at')
          .eq('campaign_id', cid)
          .in('status', ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'replied']);

        // Agrégation manuelle (open rate = opened / sent) par variant
        const agg = {};
        for (const row of variantStats || []) {
          const v = row.subject_variant || 1;
          if (!agg[v]) agg[v] = { sent: 0, opened: 0 };
          agg[v].sent += 1;
          if (row.opened_at) agg[v].opened += 1;
        }

        let bestVariant = 1;
        let bestRate = -1;
        for (const v of Object.keys(agg)) {
          const rate = agg[v].sent > 0 ? agg[v].opened / agg[v].sent : 0;
          if (rate > bestRate) {
            bestRate = rate;
            bestVariant = parseInt(v, 10);
          }
        }
        winnerVariant = bestVariant;
        await supabase
          .from('email_campaigns')
          .update({ ab_test_winner_variant: winnerVariant, ab_test_picked_at: new Date().toISOString() })
          .eq('id', cid)
          .is('ab_test_winner_variant', null); // safe : pas d'overwrite si concurrent
        // Met à jour le map en mémoire pour cohérence du reste du batch
        c.ab_test_winner_variant = winnerVariant;
        c.ab_test_picked_at = new Date().toISOString();
      } catch (e) {
        console.warn('[cron/email-campaigns] AB winner pick failed', cid, e?.message);
      }
    }

    abStateByCampaign.set(cid, { variantCount, sampleSize, winnerVariant, sentSoFar });
  }

  // Counter mutable des envois "in-flight" dans CE batch pour repartir les
  // variants en phase 1 (sentSoFar + inFlight)
  const inFlightByCampaign = new Map();

  // 4) Envoie chaque send (filtré par warmup quota)
  const results = await Promise.all(sendsToProcess.map(async (send) => {
    const campaign = campaignMap.get(send.campaign_id);
    const contact = contactMap.get(send.contact_id);

    if (!campaign || !contact) {
      return updateSendStatus(supabase, send.id, 'failed', { error: 'Campaign or contact missing' });
    }
    if (campaign.status === 'paused') {
      return null; // skip silencieusement, sera retraité quand reprise
    }
    if (contact.opt_out) {
      return updateSendStatus(supabase, send.id, 'failed', { error: 'Contact opt-out' });
    }

    // A/B testing — choix du variant de subject
    //   Phase 1 (sentSoFar + inFlight < sample_size) : on round-robin entre variants
    //   Phase 2 (winner picked) : on utilise toujours le winner
    //   Pas d'A/B : variant = 1 (subject classique)
    let chosenVariant = 1;
    const abState = abStateByCampaign.get(campaign.id);
    if (abState) {
      if (abState.winnerVariant) {
        chosenVariant = abState.winnerVariant;
      } else {
        const inFlight = inFlightByCampaign.get(campaign.id) || 0;
        const position = abState.sentSoFar + inFlight;
        if (position >= abState.sampleSize) {
          // Sample atteint mais winner pas encore picked dans CE batch
          // (sera picked au prochain cron run) → on continue le round-robin
          // pour ne pas tout envoyer sur variant 1.
          chosenVariant = (position % abState.variantCount) + 1;
        } else {
          chosenVariant = (position % abState.variantCount) + 1;
        }
        inFlightByCampaign.set(campaign.id, inFlight + 1);
      }
    }

    // Résolution du subject template en fonction du variant choisi
    let rawSubject = campaign.subject;
    if (chosenVariant === 2 && campaign.subject_variant_2) rawSubject = campaign.subject_variant_2;
    else if (chosenVariant === 3 && campaign.subject_variant_3) rawSubject = campaign.subject_variant_3;

    // Templating
    const subject = applyTemplate(rawSubject, contact, '');
    let html = applyTemplate(campaign.body_html, contact, '');

    // Ajoute le lien opt-out RGPD
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://volia.fr';
    const optOutUrl = `${baseUrl}/api/prospection/opt-out?c=${contact.id}&cmp=${campaign.id}`;
    html = appendOptOutFooter(html, optOutUrl, campaign.name);

    // Résolution du From en mode multi-tenant STRICT (sécurité) :
    //   - campaign.email_sender_id NULL ou sender absent du map = FAIL
    //     On NE PEUT PAS envoyer depuis hello@volia.fr (domaine Volia)
    //     au nom d'un client tiers — ça brûlerait notre réputation
    //     domaine, mélangerait les responsabilités légales/RGPD, et
    //     permettrait à n'importe quel client de spammer en notre nom.
    //   - sender_id présent + verified     → From="{sender.from_name}
    //     <noreply@{sender.domain}>" (toujours le domaine du customer)
    //
    // Conséquence : un user qui n'a pas configuré son propre domaine
    // d'envoi (cf /settings/email-senders) ne peut PAS envoyer de
    // campagne. L'API POST /api/admin/prospection/email-campaigns
    // bloque déjà la création sans email_sender_id verified ; ici on
    // est la dernière ligne de défense pour les campagnes legacy
    // ou en cas de sender supprimé en cours de queue.
    if (!campaign.email_sender_id) {
      return updateSendStatus(supabase, send.id, 'failed', {
        error: 'No verified sender configured (configure your domain at /settings/email-senders)',
      });
    }
    const sender = senderMap.get(campaign.email_sender_id);
    if (!sender) {
      return updateSendStatus(supabase, send.id, 'failed', {
        error: 'Sender not verified or deleted',
      });
    }
    const displayName = sender.from_name || campaign.from_name || 'Volia';
    const fromHeader = `${displayName} <noreply@${sender.domain}>`;

    // Résolution du reply-to :
    //   - Priorité 1 : campaign.reply_to (override explicite par l'utilisateur,
    //     ex: "anthony@cabinet-dupont.fr") → les replies arrivent direct chez
    //     le client, pas chez nous → on perd l'auto-create CRM mais on
    //     respecte le choix.
    //   - Priorité 2 (défaut) : adresse inbound Volia par-campagne
    //     `c-{campaign_id_hex}@reply.volia.fr` → Resend Inbound capte, le
    //     webhook /api/webhooks/resend/inbound parse le local-part pour
    //     retrouver la campagne et auto-crée le contact + deal CRM.
    //
    //   NOTE : reply.volia.fr est NOTRE infrastructure inbound (pas le
    //   domaine du client). On a le droit légal/RGPD car on agit comme
    //   processor pour collecter les replies au nom du client. Le From
    //   reste bien le domaine du client (sender.domain), seul le reply_to
    //   passe par notre catch-all. Pattern standard SaaS (Mailchimp, etc.).
    const replyToHeader = campaign.reply_to || buildCampaignReplyAddress(campaign.id);

    // Tags Resend pour le routage webhook (Resend exige alphanum + _ + -, max 256 chars).
    // On stocke campaign_id + owner_id pour pouvoir dispatcher côté receveur si
    // besoin (le matching primaire reste sur provider_id, c'est juste un bonus debug).
    const tags = [
      { name: 'campaign_id', value: String(campaign.id).replace(/-/g, '_') },
      { name: 'owner_id', value: String(campaign.owner_id).replace(/-/g, '_') },
    ];

    const result = await sendEmail({
      to: contact.email,
      from: fromHeader,
      subject,
      html,
      replyTo: replyToHeader,
      tags,
    });

    if (result.success) {
      // Met aussi à jour last_email_at sur le contact (throttling)
      await supabase.from('prospect_contacts')
        .update({ last_email_at: new Date().toISOString() })
        .eq('id', contact.id);

      // Bridge CRM : log de l'envoi dans la timeline du contact CRM s'il existe.
      // Fire-and-forget : ne fait JAMAIS échouer l'envoi.
      const crmLog = await logEmailSentToCrm({
        supabaseAdmin: supabase,
        ownerId: campaign.owner_id,
        recipientEmail: contact.email,
        campaign,
        providerId: result.id,
      });

      const sendUpdate = await updateSendStatus(supabase, send.id, 'sent', {
        provider_id: result.id,
        sent_at: new Date().toISOString(),
        subject_variant: chosenVariant,
      });
      return { ...sendUpdate, crmLogged: !!crmLog?.logged };
    } else {
      return updateSendStatus(supabase, send.id, 'failed', {
        error: result.error || 'Unknown error',
      });
    }
  }));

  const succeeded = results.filter((r) => r?.ok).length;
  const failed = results.filter((r) => r && !r.ok).length;
  const crmActivitiesLogged = results.filter((r) => r?.crmLogged).length;

  // 5) Recalcule les stats des campagnes touchées
  for (const cid of campaignIds) {
    await supabase.rpc('refresh_email_campaign_stats', { campaign_uuid: cid });
  }

  // 6) Marque les campagnes complètes (plus de pending) comme 'sent'
  for (const cid of campaignIds) {
    const { count } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', cid)
      .eq('status', 'pending');
    if ((count || 0) === 0) {
      const { data: completedCampaign } = await supabase
        .from('email_campaigns')
        .update({ status: 'sent', completed_at: new Date().toISOString() })
        .eq('id', cid)
        .eq('status', 'sending')
        .select('id, user_id, name, subject, list_id')
        .maybeSingle();

      // Fire-and-forget : webhook 'campaign_completed' aux abonnés Zapier/Make
      if (completedCampaign?.user_id) {
        const { data: stats } = await supabase
          .from('email_sends')
          .select('status')
          .eq('campaign_id', cid);
        const counts = (stats || []).reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        emitWebhookEvent({
          userId: completedCampaign.user_id,
          event: 'campaign.completed',
          data: {
            campaign_id: completedCampaign.id,
            name: completedCampaign.name,
            subject: completedCampaign.subject,
            list_id: completedCampaign.list_id,
            total_sent: (counts.sent || 0) + (counts.delivered || 0) + (counts.opened || 0) + (counts.clicked || 0) + (counts.bounced || 0) + (counts.replied || 0),
            total_delivered: counts.delivered || 0,
            total_bounced: counts.bounced || 0,
            total_opened: counts.opened || 0,
            total_clicked: counts.clicked || 0,
            total_replied: counts.replied || 0,
          },
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed: sendsToProcess.length,
    succeeded,
    failed,
    warmup_throttled: warmupThrottled,
    campaigns_affected: campaignIds.length,
    crm_activities_logged: crmActivitiesLogged,
  });
}

async function updateSendStatus(supabase, sendId, status, extra = {}) {
  const { error } = await supabase
    .from('email_sends')
    .update({ status, ...extra })
    .eq('id', sendId);
  return { ok: !error, sendId, status, error };
}
