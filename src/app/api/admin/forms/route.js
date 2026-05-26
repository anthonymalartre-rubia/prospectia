// ─────────────────────────────────────────────────────────────────
// GET  /api/admin/forms        → liste des forms de l'user (paginated)
// POST /api/admin/forms        → crée un form (gating plan)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { canCreateForm } from '@/lib/forms-gating';
import { generateUniqueSlug, slugify } from '@/lib/forms';

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 200;

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
  const offsetParam = parseInt(url.searchParams.get('offset') || '', 10);
  const status = url.searchParams.get('status'); // optionnel : 'draft'|'published'|'archived'
  const limit = Math.min(LIMIT_MAX, isNaN(limitParam) ? LIMIT_DEFAULT : Math.max(1, limitParam));
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

  let query = supabase
    .from('forms')
    .select(
      'id, slug, name, description, status, schema, crm_auto_create_contact, campagnes_list_id, submission_count, view_count, published_at, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[api/admin/forms] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Ajoute les counts schema (fields, pages) pour l'affichage hub.
  // On NE renvoie PAS le schema brut au client (peut être lourd) — juste les counts.
  const enriched = (data || []).map((f) => {
    const schema = f.schema && typeof f.schema === 'object' ? f.schema : {};
    return {
      ...f,
      fields_count: Array.isArray(schema.fields) ? schema.fields.length : 0,
      pages_count: Array.isArray(schema.pages) ? schema.pages.length : (Array.isArray(schema.fields) && schema.fields.length > 0 ? 1 : 1),
      schema: undefined, // strip
    };
  });

  return NextResponse.json({
    success: true,
    data: enriched,
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    },
  });
}

export async function POST(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  // ─── Gating plan ──────────────────────────────────────────────
  const gate = await canCreateForm(supabase, user.id);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: gate.reason,
        gating: { plan: gate.plan, limit: gate.limit, current: gate.current },
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { success: false, error: 'Le nom du formulaire est requis' },
      { status: 400 }
    );
  }

  const description = typeof body.description === 'string' ? body.description.trim() : null;

  // Slug : soit fourni explicitement (slugify obligatoire + unicité), soit auto.
  let slug;
  if (typeof body.slug === 'string' && body.slug.trim()) {
    slug = await generateUniqueSlug(supabase, slugify(body.slug));
  } else {
    slug = await generateUniqueSlug(supabase, name);
  }

  const insertPayload = {
    user_id: user.id,
    slug,
    name: name.slice(0, 200),
    description: description ? description.slice(0, 2000) : null,
    status: 'draft',
    schema: {},
    settings: {},
  };

  const { data, error } = await supabase
    .from('forms')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[api/admin/forms] POST insert error', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Un formulaire avec ce slug existe déjà' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
