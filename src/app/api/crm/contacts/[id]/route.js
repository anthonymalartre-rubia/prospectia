// GET    /api/crm/contacts/[id]   → contact + deals associés
// PATCH  /api/crm/contacts/[id]   → update partiel
// DELETE /api/crm/contacts/[id]   → suppression (CASCADE activities, deals.contact_id → NULL)

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
    .from('crm_contacts')
    .select(
      `id, name, email, phone, company, position, notes, source, source_ref_id, created_at, updated_at,
       deals:crm_deals(id, title, value_cents, currency, status, stage_id, pipeline_id, expected_close_date, created_at)`
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[api/crm/contacts/[id]] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Contact introuvable' }, { status: 404 });
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
  if (typeof body.name === 'string') {
    const n = body.name.trim();
    if (!n) {
      return NextResponse.json(
        { success: false, error: 'Le nom ne peut pas être vide' },
        { status: 400 }
      );
    }
    updates.name = n.slice(0, 200);
  }
  if (body.email !== undefined) {
    if (body.email === null || body.email === '') {
      updates.email = null;
    } else {
      const e = String(body.email).trim().toLowerCase();
      if (!isValidEmail(e)) {
        return NextResponse.json(
          { success: false, error: 'Email invalide' },
          { status: 400 }
        );
      }
      updates.email = e;
    }
  }
  if (body.phone !== undefined) {
    updates.phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : null;
  }
  if (body.company !== undefined) {
    updates.company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) : null;
  }
  if (body.position !== undefined) {
    updates.position = typeof body.position === 'string' ? body.position.trim().slice(0, 200) : null;
  }
  if (body.notes !== undefined) {
    updates.notes = typeof body.notes === 'string' ? body.notes.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Aucune modification fournie' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('crm_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[api/crm/contacts/[id]] PATCH error', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Un contact avec cet email existe déjà' },
        { status: 409 }
      );
    }
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Contact introuvable' }, { status: 404 });
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
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id);

  if (error) {
    console.error('[api/crm/contacts/[id]] DELETE error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
