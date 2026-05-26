// GET    /api/crm/deals/[id]   → deal + contact + stage + pipeline + activities
// PATCH  /api/crm/deals/[id]   → update title, value_cents, expected_close_date, notes, contact_id, currency
// DELETE /api/crm/deals/[id]

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

export async function GET(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const { id } = await params;

  const { data, error } = await supabase
    .from('crm_deals')
    .select(
      `id, title, value_cents, currency, expected_close_date, notes, status, closed_at, position,
       pipeline_id, stage_id, contact_id, created_at, updated_at,
       contact:crm_contacts(id, name, email, phone, company, position),
       stage:crm_stages(id, name, color, probability, closing_type, position),
       pipeline:crm_pipelines(id, name, color),
       activities:crm_activities(id, type, content, due_at, completed_at, created_at)`
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[api/crm/deals/[id]] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Deal introuvable' }, { status: 404 });
  }

  // Tri activities par created_at desc
  if (Array.isArray(data.activities)) {
    data.activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return NextResponse.json({ success: true, data });
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
  if (typeof body.title === 'string') {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json(
        { success: false, error: 'Le titre ne peut pas être vide' },
        { status: 400 }
      );
    }
    updates.title = t.slice(0, 200);
  }
  if (body.value_cents !== undefined) {
    const v = Number(body.value_cents);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { success: false, error: 'value_cents doit être un entier positif' },
        { status: 400 }
      );
    }
    updates.value_cents = Math.round(v);
  }
  if (body.currency !== undefined) {
    updates.currency = typeof body.currency === 'string' ? body.currency.trim().slice(0, 8) : 'EUR';
  }
  if (body.expected_close_date !== undefined) {
    updates.expected_close_date = body.expected_close_date || null;
  }
  if (body.notes !== undefined) {
    updates.notes = typeof body.notes === 'string' ? body.notes.trim() : null;
  }
  if (body.contact_id !== undefined) {
    updates.contact_id = typeof body.contact_id === 'string' ? body.contact_id : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Aucune modification fournie' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('crm_deals')
    .update(updates)
    .eq('id', id)
    .select(
      `id, title, value_cents, currency, expected_close_date, notes, status, closed_at, position,
       pipeline_id, stage_id, contact_id, created_at, updated_at,
       contact:crm_contacts(id, name, email, company),
       stage:crm_stages(id, name, color, probability, closing_type, position)`
    )
    .single();

  if (error) {
    console.error('[api/crm/deals/[id]] PATCH error', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Deal introuvable' }, { status: 404 });
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
  const { error } = await supabase.from('crm_deals').delete().eq('id', id);

  if (error) {
    console.error('[api/crm/deals/[id]] DELETE error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
