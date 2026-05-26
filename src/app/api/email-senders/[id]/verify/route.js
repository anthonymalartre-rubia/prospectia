// POST /api/email-senders/[id]/verify
//
// Récupère le status actuel du domaine côté Resend (qui re-check les DNS à la
// volée si besoin) puis met à jour la row Supabase :
//   - status mappé : 'verified' | 'pending' | 'failed' | 'temp_failure'
//   - dns_records refreshés (les records peuvent être enrichis post-création)
//   - verified_at posé à now() la première fois qu'on bascule en verified
//   - last_check_at toujours mis à jour

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getResendDomain } from '@/lib/resend-domains';
import { buildPeerEmailAddress } from '@/lib/warmup-peer';

const ALLOWED_STATUSES = new Set(['pending', 'verified', 'failed', 'temp_failure']);

function normalizeStatus(resendStatus) {
  // Resend renvoie : not_started | pending | verified | failed | temporary_failure
  if (!resendStatus) return 'pending';
  if (resendStatus === 'verified') return 'verified';
  if (resendStatus === 'failed') return 'failed';
  if (resendStatus === 'temporary_failure') return 'temp_failure';
  // not_started, pending, ou inconnu → on traite comme pending côté Volia
  return 'pending';
}

function mapResendErrorToStatus(err) {
  if (!err) return 500;
  if (err.code === 'resend_unauthorized') return 502;
  if (err.code === 'resend_forbidden') return 502;
  if (err.code === 'resend_rate_limited') return 429;
  if (err.code === 'resend_not_found') return 404;
  return 500;
}

export async function POST(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: sender, error: fetchErr } = await supabase
    .from('email_senders')
    .select('id, user_id, resend_domain_id, status, verified_at')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    console.error('[api/email-senders/verify] fetch error', fetchErr);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
  if (!sender) {
    return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
  }
  if (!sender.resend_domain_id) {
    return NextResponse.json(
      { error: 'Aucun ID Resend associé à ce domaine (re-créer le domaine).' },
      { status: 400 }
    );
  }

  let resendData;
  try {
    resendData = await getResendDomain(sender.resend_domain_id);
  } catch (err) {
    console.error('[api/email-senders/verify] Resend get error', err);
    return NextResponse.json(
      { error: err.message || 'Erreur côté Resend' },
      { status: mapResendErrorToStatus(err) }
    );
  }

  const newStatus = normalizeStatus(resendData.status);
  if (!ALLOWED_STATUSES.has(newStatus)) {
    // Garde-fou : ne devrait jamais arriver vu le mapping ci-dessus.
    return NextResponse.json({ error: 'Statut inattendu' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const updates = {
    status: newStatus,
    dns_records: resendData.records || [],
    last_check_at: now,
    updated_at: now,
  };
  // verified_at est posé une seule fois (à la première bascule).
  const isFirstVerification = newStatus === 'verified' && !sender.verified_at;
  if (isFirstVerification) {
    updates.verified_at = now;
  }

  const { data, error } = await supabase
    .from('email_senders')
    .update(updates)
    .eq('id', id)
    .select(
      'id, domain, resend_domain_id, status, dns_records, from_name, verified_at, last_check_at, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('[api/email-senders/verify] update error', error);
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  }

  // Auto-start warmup session si on vient juste de passer en verified.
  // Fire-and-forget : on log mais on NE casse PAS la verify si l'insert
  // warmup fail (UNIQUE constraint = warmup déjà démarré, OK).
  if (isFirstVerification && sender.user_id) {
    try {
      const { error: warmupErr } = await supabase
        .from('warmup_sessions')
        .insert({
          sender_id: id,
          user_id: sender.user_id,
          current_day: 1,
          status: 'active',
        });
      if (warmupErr && warmupErr.code !== '23505') {
        // 23505 = unique_violation → déjà existant, on ignore.
        console.error('[api/email-senders/verify] warmup insert error', warmupErr);
      }
    } catch (e) {
      console.error('[api/email-senders/verify] warmup insert exception', e);
    }

    // Auto-enrôle dans le pool peer-to-peer (Phase 3).
    // Idempotent : UNIQUE(sender_id) bloque les doublons (code 23505).
    try {
      const peerEmail = buildPeerEmailAddress(id);
      if (peerEmail) {
        const { error: poolErr } = await supabase
          .from('warmup_peer_pool')
          .insert({
            sender_id: id,
            peer_email: peerEmail,
            active: true,
          });
        if (poolErr && poolErr.code !== '23505') {
          console.error('[api/email-senders/verify] peer pool insert error', poolErr);
        }
      }
    } catch (e) {
      console.error('[api/email-senders/verify] peer pool insert exception', e);
    }
  }

  return NextResponse.json({ sender: data });
}
