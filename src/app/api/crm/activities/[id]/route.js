// PATCH  /api/crm/activities/[id]  → update content, due_at, completed_at
// DELETE /api/crm/activities/[id]
//
// Gating Business plan + auth + RLS. RLS doit garantir que l'user
// ne peut PATCH/DELETE que ses propres activities (user_id = auth.uid()).

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

export async function PATCH(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates = {};
  if (typeof body.content === 'string') {
    const c = body.content.trim();
    if (!c) {
      return NextResponse.json(
        { success: false, error: 'content ne peut pas être vide' },
        { status: 400 }
      );
    }
    updates.content = c;
  }
  if (body.due_at !== undefined) {
    updates.due_at = body.due_at ? String(body.due_at) : null;
  }
  if (body.completed_at !== undefined) {
    // Si on reçoit `true`, on stocke now()
    if (body.completed_at === true) {
      updates.completed_at = new Date().toISOString();
    } else if (body.completed_at === false || body.completed_at === null) {
      updates.completed_at = null;
    } else if (typeof body.completed_at === 'string') {
      updates.completed_at = body.completed_at;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Aucune modification fournie' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('crm_activities')
    .update(updates)
    .eq('id', id)
    .select('id, type, content, due_at, completed_at, deal_id, contact_id, created_at')
    .single();

  if (error) {
    console.error('[api/crm/activities/[id]] PATCH error', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Activité introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const { id } = await params;
  const { error } = await supabase.from('crm_activities').delete().eq('id', id);

  if (error) {
    console.error('[api/crm/activities/[id]] DELETE error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
