// GET    /api/admin/prospection/sequences/[id]  → détail + steps + stats enrollments
// PATCH  /api/admin/prospection/sequences/[id]  → update (status, daily_limit, name, description, stop_on_reply)
// DELETE /api/admin/prospection/sequences/[id]  → supprime (seulement draft / paused / completed)

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';

export async function GET(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!sequence) return NextResponse.json({ error: 'Séquence introuvable' }, { status: 404 });

  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('id, step_order, wait_days, subject, body_html')
    .eq('sequence_id', id)
    .order('step_order', { ascending: true });

  // Stats enrollments par status
  const { data: enrolls } = await supabase
    .from('sequence_enrollments')
    .select('id, contact_id, current_step, status, enrolled_at, next_send_at, last_send_at, replied_at')
    .eq('sequence_id', id)
    .order('enrolled_at', { ascending: false })
    .limit(100);

  const stats = { total: 0, active: 0, replied: 0, completed: 0, failed: 0, opted_out: 0 };
  for (const e of enrolls || []) {
    stats.total++;
    if (stats[e.status] !== undefined) stats[e.status]++;
  }

  // Hydrate les enrolls (top 100) avec email contact pour l'UI
  const contactIds = [...new Set((enrolls || []).map((e) => e.contact_id))];
  let contactMap = {};
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('prospect_contacts')
      .select('id, email, first_name, last_name, company')
      .in('id', contactIds);
    for (const c of contacts || []) contactMap[c.id] = c;
  }
  const enrollments = (enrolls || []).map((e) => ({ ...e, contact: contactMap[e.contact_id] || null }));

  return NextResponse.json({ sequence, steps: steps || [], enrollments, stats });
}

export async function PATCH(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const patch = {};

  if (typeof body.name === 'string') {
    const v = body.name.trim();
    if (!v || v.length > 120) return NextResponse.json({ error: 'name max 120 chars' }, { status: 400 });
    patch.name = v;
  }
  if (typeof body.description === 'string') patch.description = body.description.trim() || null;
  if (typeof body.stop_on_reply === 'boolean') patch.stop_on_reply = body.stop_on_reply;
  if (Number.isFinite(body.daily_limit)) {
    patch.daily_limit = Math.max(1, Math.min(500, body.daily_limit));
  }
  if (typeof body.status === 'string' && ['draft', 'paused'].includes(body.status)) {
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('email_sequences')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sequence: data });
}

export async function DELETE(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { data: seq } = await supabase
    .from('email_sequences')
    .select('status')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!seq) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (seq.status === 'active') {
    return NextResponse.json({ error: 'Mettez la séquence en pause avant de la supprimer.' }, { status: 400 });
  }

  const { error } = await supabase.from('email_sequences').delete().eq('id', id).eq('owner_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
