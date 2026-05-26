// ─────────────────────────────────────────────────────────────────
// GET    /api/admin/forms/[id]   → détail + fields + stats summary
// PUT    /api/admin/forms/[id]   → update (name, description, schema, settings, ...)
// DELETE /api/admin/forms/[id]   → soft delete (archived) ou hard si ?hard=true
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateUniqueSlug, slugify, validateFormSchema } from '@/lib/forms';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const { data: form, error } = await supabase
    .from('forms')
    .select(
      `id, slug, name, description, status, schema, settings,
       crm_auto_create_contact, campagnes_list_id,
       submission_count, view_count, published_at, created_at, updated_at,
       fields:form_fields(id, field_key, field_type, label, placeholder, help_text, required, position, page, options, validation, conditional_logic)`
    )
    .eq('id', id)
    .eq('user_id', user.id) // belt + suspenders (en plus du RLS)
    .maybeSingle();

  if (error) {
    console.error('[api/admin/forms/[id]] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!form) {
    return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
  }

  // Stats summary — count responses derniers 30j (rapide, indexé)
  const { count: responsesLast30d } = await supabase
    .from('form_responses')
    .select('id', { count: 'exact', head: true })
    .eq('form_id', id)
    .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  return NextResponse.json({
    success: true,
    data: {
      ...form,
      stats: {
        total_views: form.view_count,
        total_submissions: form.submission_count,
        submissions_last_30d: responsesLast30d || 0,
        conversion_rate: form.view_count > 0
          ? Math.round((form.submission_count / form.view_count) * 10000) / 100
          : 0,
      },
    },
  });
}

export async function PUT(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Vérifie que le form appartient à l'user (RLS le fait aussi, mais on
  // veut un 404 explicite plutôt qu'un 0-rows update silencieux).
  const { data: existing, error: existingError } = await supabase
    .from('forms')
    .select('id, slug, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingError) {
    return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
  }

  const updates = {};

  if (body.name !== undefined) {
    const n = typeof body.name === 'string' ? body.name.trim() : '';
    if (!n) {
      return NextResponse.json(
        { success: false, error: 'Le nom ne peut pas être vide' },
        { status: 400 }
      );
    }
    updates.name = n.slice(0, 200);
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === 'string'
      ? body.description.trim().slice(0, 2000) || null
      : null;
  }

  if (body.slug !== undefined && typeof body.slug === 'string' && body.slug.trim()) {
    const newSlugBase = slugify(body.slug);
    if (newSlugBase !== existing.slug) {
      updates.slug = await generateUniqueSlug(supabase, newSlugBase, id);
    }
  }

  if (body.schema !== undefined) {
    const v = validateFormSchema(body.schema);
    if (!v.valid) {
      return NextResponse.json(
        { success: false, error: 'Schema invalide', details: v.errors },
        { status: 400 }
      );
    }
    updates.schema = body.schema;
  }

  if (body.settings !== undefined) {
    if (body.settings !== null && (typeof body.settings !== 'object' || Array.isArray(body.settings))) {
      return NextResponse.json(
        { success: false, error: 'settings doit être un objet JSON' },
        { status: 400 }
      );
    }
    updates.settings = body.settings || {};
  }

  if (body.crm_auto_create_contact !== undefined) {
    updates.crm_auto_create_contact = !!body.crm_auto_create_contact;
  }

  if (body.campagnes_list_id !== undefined) {
    updates.campagnes_list_id = body.campagnes_list_id || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Aucune modification fournie' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[api/admin/forms/[id]] PUT error', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Slug déjà utilisé' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const url = new URL(request.url);
  const hard = url.searchParams.get('hard') === 'true';

  if (hard) {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[api/admin/forms/[id]] DELETE hard error', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, mode: 'hard' });
  }

  // Soft delete : status = 'archived'
  const { data, error } = await supabase
    .from('forms')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status')
    .single();

  if (error) {
    console.error('[api/admin/forms/[id]] DELETE soft error', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: 'soft', data });
}
