// /api/email-senders
//
// GET  → liste les domaines d'envoi du user courant (RLS = isolation par user)
// POST → body { domain, from_name } : crée le domaine côté Resend puis insère
//        la row email_senders avec status='pending' et le snapshot DNS records
//
// Multi-tenant Mailchimp-style : chaque client Volia connecte son propre
// domaine d'envoi, vérifié via Resend Domains API. Volia agit comme hub
// (1 compte Resend, N domaines clients).

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  createResendDomain,
  validateSenderDomain,
} from '@/lib/resend-domains';

function mapResendErrorToStatus(err) {
  if (!err) return 500;
  if (err.code === 'resend_unauthorized') return 502; // problème côté Volia, pas client
  if (err.code === 'resend_forbidden') return 502;
  if (err.code === 'resend_validation') return 422;
  if (err.code === 'resend_rate_limited') return 429;
  return 500;
}

export async function GET() {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('email_senders')
    .select(
      'id, domain, resend_domain_id, status, dns_records, from_name, verified_at, last_check_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/email-senders] GET error', error);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }

  // Bulk fetch des warmup sessions liées pour enrichir la réponse (l'UI affiche
  // une progress bar / phase courante par sender).
  const senders = data || [];
  if (senders.length > 0) {
    const senderIds = senders.map((s) => s.id);
    const { data: sessions } = await supabase
      .from('warmup_sessions')
      .select('id, sender_id, started_at, completed_at, current_day, status')
      .in('sender_id', senderIds);

    const sessionMap = new Map((sessions || []).map((sess) => [sess.sender_id, sess]));

    // Bulk fetch des peer_pool entries (Phase 3 peer-to-peer)
    const { data: peers } = await supabase
      .from('warmup_peer_pool')
      .select('sender_id, peer_email, active, total_sent, total_received, total_opened, total_clicked, total_replied, joined_at')
      .in('sender_id', senderIds);
    const peerMap = new Map((peers || []).map((p) => [p.sender_id, p]));

    // Taille du pool global (info pour le bloc "vous contribuez à X+ domaines")
    const { count: poolCount } = await supabase
      .from('warmup_peer_pool')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    for (const s of senders) {
      const sess = sessionMap.get(s.id) || null;
      if (sess) {
        const peerRow = peerMap.get(s.id) || null;
        sess.peer = peerRow ? { ...peerRow, pool_size: poolCount || 0 } : { enrolled: false, pool_size: poolCount || 0 };
      }
      s.warmup = sess;
    }
  }

  return NextResponse.json({ senders });
}

export async function POST(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validation = validateSenderDomain(body.domain);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const domain = validation.domain;

  const fromName =
    typeof body.from_name === 'string' ? body.from_name.trim().slice(0, 80) : null;

  // Anti-doublon applicatif (le UNIQUE en DB est le garde-fou final).
  const { data: existing } = await supabase
    .from('email_senders')
    .select('id')
    .eq('user_id', user.id)
    .eq('domain', domain)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Ce domaine est déjà connecté à votre compte.' },
      { status: 409 }
    );
  }

  // Limite : max 10 domaines par compte (anti-abus du compte Resend Volia)
  const { count: senderCount } = await supabase
    .from('email_senders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((senderCount || 0) >= 10) {
    return NextResponse.json(
      { error: 'Limite atteinte (10 domaines max par compte).' },
      { status: 400 }
    );
  }

  // 1) Crée le domaine côté Resend → on récupère l'ID + records DNS
  let resendData;
  try {
    resendData = await createResendDomain(domain);
  } catch (err) {
    console.error('[api/email-senders] Resend create error', err);
    return NextResponse.json(
      { error: err.message || 'Erreur création domaine Resend' },
      { status: mapResendErrorToStatus(err) }
    );
  }

  // 2) Persiste dans Supabase (status = 'pending', en attente vérif DNS)
  const { data, error } = await supabase
    .from('email_senders')
    .insert({
      user_id: user.id,
      domain,
      resend_domain_id: resendData.id,
      status: 'pending',
      dns_records: resendData.records || [],
      from_name: fromName,
    })
    .select(
      'id, domain, resend_domain_id, status, dns_records, from_name, verified_at, last_check_at, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('[api/email-senders] POST insert error', error);
    // Best-effort : si l'insert DB échoue, on devrait idéalement supprimer
    // le domaine côté Resend pour éviter un orphelin. On log pour le moment ;
    // l'utilisateur pourra retry et la limite UNIQUE empêchera un doublon.
    return NextResponse.json(
      { error: 'Erreur enregistrement du domaine.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ sender: data }, { status: 201 });
}
