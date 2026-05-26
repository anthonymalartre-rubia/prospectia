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

  return NextResponse.json({ senders: data || [] });
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
