// Cron Vercel — Warmup peer-to-peer (Phase 3).
//
// Tourne toutes les 6h (4 cycles/jour). Pour chaque sender en warmup
// actif :
//   1. Calcule sa phase courante (jour 1-28 → 10/30/100/200 emails/jour)
//   2. Détermine combien d'emails peer-to-peer envoyer aujourd'hui
//      (= ratio WARMUP_PEER_RATIO * maxPerDay - déjà envoyés peer aujourd'hui)
//   3. Sélectionne N peers actifs aléatoires dans le pool (≠ self)
//   4. Envoie via sendEmail() en DEPUIS le domaine du sender VERS le
//      peer_email du destinataire (= warmup-{id}@reply.volia.fr)
//   5. Insère un row warmup_exchanges + simule engagement (open/click/reply)
//      directement en DB pour les stats internes
//
// Pourquoi étaler sur 6h ? Pour ne pas que les peers Volia reçoivent
// un batch concentré (anti-pattern de spam) → on lisse l'envoi sur
// la journée comme un vrai humain.
//
// Protégé par CRON_SECRET (header Authorization Bearer).

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { cleanEnv } from '@/lib/envClean';
import { reportError } from '@/lib/errorReporting';
import {
  calculateCurrentDay,
  getCurrentPhase,
  WARMUP_DURATION_DAYS,
} from '@/lib/warmup';
import {
  computePeerSendBudget,
  randomWarmupSubject,
  randomWarmupBody,
  rollEngagement,
  buildPeerEmailAddress,
} from '@/lib/warmup-peer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// On cap le nombre TOTAL d'envois par cycle (toutes senders confondus)
// pour respecter le rate limit Resend (~10 emails/sec). 60s × 5/sec = 300.
const MAX_TOTAL_SENDS_PER_CYCLE = 200;

// Comme on tourne 4x/jour, on divise le budget quotidien par 4.
// Ex: phase jour 22-28 = 200/jour × 0.8 = 160 peer/jour → 40 par cycle.
const CYCLES_PER_DAY = 4;

export async function GET(request) {
  try {
    return await handleCron(request);
  } catch (err) {
    reportError(err, { cron: 'process-warmup-peer' });
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

  // 1) Récupère TOUTES les warmup_sessions actives + le pool entry du sender
  const { data: activeSessions, error: sessErr } = await supabase
    .from('warmup_sessions')
    .select('id, sender_id, started_at, current_day, status')
    .eq('status', 'active');

  if (sessErr) {
    console.error('[cron/warmup-peer] sessions fetch error', sessErr);
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }
  if (!activeSessions || activeSessions.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Aucune session active.' });
  }

  const senderIds = [...new Set(activeSessions.map((s) => s.sender_id))];

  // 2) Charge les senders verified correspondants (filtre les supprimés / non-verified)
  const { data: senders } = await supabase
    .from('email_senders')
    .select('id, user_id, domain, from_name, status')
    .in('id', senderIds)
    .eq('status', 'verified');
  const senderMap = new Map((senders || []).map((s) => [s.id, s]));

  // 3) Charge TOUS les peers actifs du pool (on a besoin du pool global
  //    pour pouvoir sélectionner des destinataires ≠ self)
  const { data: allPeers } = await supabase
    .from('warmup_peer_pool')
    .select('id, sender_id, peer_email, active')
    .eq('active', true);

  if (!allPeers || allPeers.length < 2) {
    // Besoin d'au moins 2 peers pour un échange (un envoyeur + un receveur).
    return NextResponse.json({
      ok: true,
      processed: 0,
      message: `Pool insuffisant (${allPeers?.length || 0} peer actif). Min 2 requis pour démarrer le peer-to-peer.`,
    });
  }

  const peerBySenderId = new Map(allPeers.map((p) => [p.sender_id, p]));

  // 4) Pré-calcul des envois peer déjà faits aujourd'hui par sender
  //    (pour ne pas dépasser le budget journalier après plusieurs cycles)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  // On récupère tous les exchanges du jour pour les peers de notre liste,
  // puis on agrège par from_peer_id côté JS (plus simple que des group by SQL).
  const peerIds = allPeers.map((p) => p.id);
  const { data: todayExchanges } = await supabase
    .from('warmup_exchanges')
    .select('from_peer_id')
    .gte('sent_at', todayStartIso)
    .in('from_peer_id', peerIds);

  const sentTodayByPeerId = new Map();
  for (const ex of todayExchanges || []) {
    sentTodayByPeerId.set(ex.from_peer_id, (sentTodayByPeerId.get(ex.from_peer_id) || 0) + 1);
  }

  // 5) Boucle d'envoi
  let totalSent = 0;
  let totalSkippedPool = 0;
  let totalSkippedBudget = 0;
  let totalFailed = 0;
  const exchangesToInsert = []; // batch insert à la fin
  const peerCounterBumps = []; // [{ peerId, type }, ...]

  for (const session of activeSessions) {
    if (totalSent >= MAX_TOTAL_SENDS_PER_CYCLE) break;

    const sender = senderMap.get(session.sender_id);
    const fromPeer = peerBySenderId.get(session.sender_id);

    // Pas verified / pool pas créé → on skip silencieusement (le sender
    // pourra retomber dans le pool si l'admin le re-vérifie / l'enrôle).
    if (!sender || !fromPeer) {
      totalSkippedPool++;
      continue;
    }

    // Phase courante du warmup
    const currentDay = calculateCurrentDay(session.started_at);
    if (currentDay > WARMUP_DURATION_DAYS) {
      // Session devrait passer 'completed' (le cron process-email-campaigns
      // s'en charge), on skip ici sans crasher.
      continue;
    }
    const phase = getCurrentPhase(currentDay);
    if (!phase) continue;

    // Budget peer-to-peer du jour
    const alreadySentToday = sentTodayByPeerId.get(fromPeer.id) || 0;
    const remainingDay = computePeerSendBudget(phase, alreadySentToday);
    if (remainingDay <= 0) {
      totalSkippedBudget++;
      continue;
    }

    // Cap par cycle : on lisse sur CYCLES_PER_DAY pour ne pas tout brûler
    // dans le premier cycle de la journée.
    const perCycleCap = Math.max(1, Math.ceil(remainingDay / CYCLES_PER_DAY));
    const targetThisCycle = Math.min(perCycleCap, remainingDay);

    // Sélectionne des destinataires aléatoires (≠ self) dans le pool actif
    const candidates = allPeers.filter((p) => p.id !== fromPeer.id);
    if (candidates.length === 0) {
      totalSkippedPool++;
      continue;
    }

    // Shuffle Fisher-Yates puis pick N
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const recipients = shuffled.slice(0, targetThisCycle);

    for (const toPeer of recipients) {
      if (totalSent >= MAX_TOTAL_SENDS_PER_CYCLE) break;

      const subject = randomWarmupSubject();
      const { html } = randomWarmupBody();
      const displayName = sender.from_name || 'Volia';
      const fromHeader = `${displayName} <warmup@${sender.domain}>`;

      // Tags Resend (alphanum + _ + - max 256). Permet de discriminer
      // les events warmup côté webhook tracking sans devoir lookup par
      // provider_id.
      const tags = [
        { name: 'kind', value: 'warmup_peer' },
        { name: 'from_peer', value: String(fromPeer.id).replace(/-/g, '_') },
        { name: 'to_peer', value: String(toPeer.id).replace(/-/g, '_') },
      ];

      const result = await sendEmail({
        to: toPeer.peer_email,
        from: fromHeader,
        subject,
        html,
        replyTo: buildPeerEmailAddress(toPeer.sender_id) || undefined,
        tags,
      });

      if (!result.success) {
        totalFailed++;
        console.warn(
          `[cron/warmup-peer] send failed from=${fromPeer.id} to=${toPeer.id}: ${result.error}`
        );
        continue;
      }

      totalSent++;

      // Simule l'engagement (probas calibrées dans warmup-peer.js).
      // On set les timestamps directement dans warmup_exchanges plutôt
      // que d'attendre les vrais webhooks Resend — c'est ce qui compte
      // pour nos stats internes. Les webhooks réels mettront aussi à
      // jour ces lignes si l'open tracking est actif, c'est idempotent.
      const { shouldOpen, shouldClick, shouldReply } = rollEngagement();
      const nowMs = Date.now();
      const exchange = {
        from_peer_id: fromPeer.id,
        to_peer_id: toPeer.id,
        resend_message_id: result.id || null,
        sent_at: new Date(nowMs).toISOString(),
        opened_at: shouldOpen ? new Date(nowMs + 10 * 60 * 1000).toISOString() : null,
        clicked_at: shouldClick ? new Date(nowMs + 15 * 60 * 1000).toISOString() : null,
        replied_at: shouldReply ? new Date(nowMs + 20 * 60 * 1000).toISOString() : null,
      };
      exchangesToInsert.push(exchange);

      // Compteurs agrégés sur le peer
      peerCounterBumps.push({ peerId: fromPeer.id, type: 'sent' });
      peerCounterBumps.push({ peerId: toPeer.id, type: 'received' });
      if (shouldOpen) peerCounterBumps.push({ peerId: toPeer.id, type: 'opened' });
      if (shouldClick) peerCounterBumps.push({ peerId: toPeer.id, type: 'clicked' });
      if (shouldReply) peerCounterBumps.push({ peerId: toPeer.id, type: 'replied' });
    }
  }

  // 6) Batch insert des exchanges (1 round-trip plutôt que N)
  if (exchangesToInsert.length > 0) {
    const { error: insErr } = await supabase
      .from('warmup_exchanges')
      .insert(exchangesToInsert);
    if (insErr) {
      console.error('[cron/warmup-peer] exchanges insert error', insErr);
    }
  }

  // 7) Update des compteurs peer (via RPC atomiques). On groupe par
  //    peerId+type pour minimiser les round-trips.
  const bumpAgg = new Map(); // `${peerId}:${type}` → count
  for (const b of peerCounterBumps) {
    const k = `${b.peerId}:${b.type}`;
    bumpAgg.set(k, (bumpAgg.get(k) || 0) + 1);
  }
  // Best-effort, en parallèle. On loop tant qu'il faut bumper N fois.
  // Note : on pourrait optimiser via une UPDATE ... SET col = col + N
  // mais ça nécessiterait des RPC variadiques. La volumétrie ici reste
  // faible (max ~600 bumps/cycle), suffisant pour le MVP.
  const rpcByType = {
    sent: 'bump_warmup_peer_sent',
    received: 'bump_warmup_peer_received',
    opened: 'bump_warmup_peer_opened',
    clicked: 'bump_warmup_peer_clicked',
    replied: 'bump_warmup_peer_replied',
  };

  const bumpPromises = [];
  for (const [k, n] of bumpAgg.entries()) {
    const [peerId, type] = k.split(':');
    const rpcName = rpcByType[type];
    if (!rpcName) continue;
    for (let i = 0; i < n; i++) {
      bumpPromises.push(supabase.rpc(rpcName, { peer_id: peerId }));
    }
  }
  await Promise.allSettled(bumpPromises);

  return NextResponse.json({
    ok: true,
    sessions_processed: activeSessions.length,
    pool_size: allPeers.length,
    sent: totalSent,
    failed: totalFailed,
    skipped_pool: totalSkippedPool,
    skipped_budget: totalSkippedBudget,
    exchanges_logged: exchangesToInsert.length,
  });
}
