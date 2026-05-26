// POST /api/admin/prospection/sequences/[id]/pause
//
// Met la séquence en pause. Les enrollments restent 'active' mais le cron
// les ignore tant que la séquence n'est pas 'active'. Reprise = appeler /start
// (qui ne ré-enrôle pas les contacts déjà présents, juste réactive le status).

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';

export async function POST(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from('email_sequences')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true, sequence: data });
}
