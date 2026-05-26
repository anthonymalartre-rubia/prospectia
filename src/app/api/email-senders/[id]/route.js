// /api/email-senders/[id]
//
// GET    → détail d'un sender (RLS = ownership user)
// DELETE → supprime le domaine côté Resend puis la row Supabase
//
// La suppression Resend est best-effort : si Resend renvoie 404 (domaine déjà
// supprimé ou jamais créé), on supprime quand même la row Volia pour ne pas
// bloquer l'utilisateur.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { deleteResendDomain } from '@/lib/resend-domains';

function mapResendErrorToStatus(err) {
  if (!err) return 500;
  if (err.code === 'resend_unauthorized') return 502;
  if (err.code === 'resend_forbidden') return 502;
  if (err.code === 'resend_rate_limited') return 429;
  return 500;
}

export async function GET(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('email_senders')
    .select(
      'id, domain, resend_domain_id, status, dns_records, from_name, verified_at, last_check_at, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[api/email-senders/[id]] GET error', error);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
  }

  return NextResponse.json({ sender: data });
}

export async function DELETE(_request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Récupère la row pour avoir le resend_domain_id à supprimer.
  const { data: sender, error: fetchErr } = await supabase
    .from('email_senders')
    .select('id, resend_domain_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    console.error('[api/email-senders/[id]] DELETE fetch error', fetchErr);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
  if (!sender) {
    return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
  }

  // Best-effort : supprime côté Resend (idempotent, 404 toléré).
  if (sender.resend_domain_id) {
    try {
      await deleteResendDomain(sender.resend_domain_id);
    } catch (err) {
      console.error('[api/email-senders/[id]] Resend delete error', err);
      return NextResponse.json(
        { error: err.message || 'Erreur suppression côté Resend' },
        { status: mapResendErrorToStatus(err) }
      );
    }
  }

  const { error: delErr } = await supabase
    .from('email_senders')
    .delete()
    .eq('id', id);

  if (delErr) {
    console.error('[api/email-senders/[id]] DELETE row error', delErr);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
