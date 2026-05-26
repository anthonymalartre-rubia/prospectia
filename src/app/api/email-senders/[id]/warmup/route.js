// /api/email-senders/[id]/warmup
//
// GET  → renvoie l'état warmup du sender (phase, current_day, quota, date fin estimée)
// POST → démarre manuellement une warmup_session pour ce sender (utile pour les
//        senders legacy déjà verified avant l'ajout de la feature). Idempotent :
//        renvoie la session existante si déjà présente.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  calculateCurrentDay,
  getCurrentPhase,
  countTodaySendsForSender,
  estimateCompletionDate,
  getWarmupProgressPercent,
  WARMUP_DURATION_DAYS,
} from '@/lib/warmup';

async function buildWarmupPayload(supabase, session, senderId) {
  if (!session) return { warmup: null };

  const currentDay = calculateCurrentDay(session.started_at);
  const effectiveDay = Math.min(currentDay, WARMUP_DURATION_DAYS);
  const phase = getCurrentPhase(effectiveDay);
  const completionDate = estimateCompletionDate(session.started_at);

  const todayAlreadySent = phase
    ? await countTodaySendsForSender(supabase, senderId)
    : 0;
  const todayQuotaRemaining = phase
    ? Math.max(0, phase.maxPerDay - todayAlreadySent)
    : null; // null = warmup terminé

  // Stats peer-to-peer (best-effort, ne fait pas échouer la réponse)
  let peer = null;
  try {
    const { data: peerRow } = await supabase
      .from('warmup_peer_pool')
      .select('id, peer_email, active, total_sent, total_received, total_opened, total_clicked, total_replied, joined_at')
      .eq('sender_id', senderId)
      .maybeSingle();

    // Compteur jour : exchanges envoyés OU reçus aujourd'hui par ce peer
    let exchangesToday = 0;
    if (peerRow?.id) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();
      const { count } = await supabase
        .from('warmup_exchanges')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', todayStartIso)
        .or(`from_peer_id.eq.${peerRow.id},to_peer_id.eq.${peerRow.id}`);
      exchangesToday = count || 0;
    }

    // Taille du pool actif (info publique style "vous contribuez à N+ domaines")
    const { count: poolCount } = await supabase
      .from('warmup_peer_pool')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    peer = peerRow
      ? {
          ...peerRow,
          exchanges_today: exchangesToday,
          pool_size: poolCount || 0,
        }
      : { enrolled: false, pool_size: poolCount || 0 };
  } catch (e) {
    console.warn('[api/email-senders/warmup] peer stats fetch failed', e?.message);
  }

  return {
    warmup: {
      id: session.id,
      sender_id: session.sender_id,
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      current_day: effectiveDay,
      total_days: WARMUP_DURATION_DAYS,
      progress_percent: getWarmupProgressPercent(effectiveDay),
      phase,
      today_sent: todayAlreadySent,
      today_quota_remaining: todayQuotaRemaining,
      estimated_completion_at: completionDate.toISOString(),
      peer,
    },
  };
}

export async function GET(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Vérifie l'ownership (RLS) en lisant le sender d'abord.
  const { data: sender, error: sErr } = await supabase
    .from('email_senders')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();

  if (sErr || !sender) {
    return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
  }

  const { data: session } = await supabase
    .from('warmup_sessions')
    .select('id, sender_id, started_at, completed_at, current_day, status')
    .eq('sender_id', id)
    .maybeSingle();

  const payload = await buildWarmupPayload(supabase, session, id);
  return NextResponse.json(payload);
}

export async function POST(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: sender, error: sErr } = await supabase
    .from('email_senders')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();

  if (sErr || !sender) {
    return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
  }
  if (sender.status !== 'verified') {
    return NextResponse.json(
      { error: 'Le domaine doit être vérifié avant de démarrer le warmup.' },
      { status: 400 }
    );
  }

  // Déjà existante ? On la renvoie telle quelle (idempotent).
  const { data: existing } = await supabase
    .from('warmup_sessions')
    .select('id, sender_id, started_at, completed_at, current_day, status')
    .eq('sender_id', id)
    .maybeSingle();

  if (existing) {
    const payload = await buildWarmupPayload(supabase, existing, id);
    return NextResponse.json(payload);
  }

  const { data: session, error: insErr } = await supabase
    .from('warmup_sessions')
    .insert({
      sender_id: id,
      user_id: user.id,
      current_day: 1,
      status: 'active',
    })
    .select('id, sender_id, started_at, completed_at, current_day, status')
    .single();

  if (insErr) {
    console.error('[api/email-senders/[id]/warmup] POST insert error', insErr);
    return NextResponse.json({ error: 'Erreur création warmup' }, { status: 500 });
  }

  const payload = await buildWarmupPayload(supabase, session, id);
  return NextResponse.json(payload, { status: 201 });
}
