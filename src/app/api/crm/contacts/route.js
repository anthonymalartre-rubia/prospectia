// GET  /api/crm/contacts        → liste des contacts (search, limit, offset)
// POST /api/crm/contacts        → crée un contact

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 200;

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function GET(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
  const offsetParam = parseInt(url.searchParams.get('offset') || '', 10);
  const limit = Math.min(LIMIT_MAX, isNaN(limitParam) ? LIMIT_DEFAULT : Math.max(1, limitParam));
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

  // Tri (Phase 2.x — engagement) : ?sort=engagement|created &dir=asc|desc.
  // Tolérant : colonnes inexistantes → fallback created_at desc.
  const ALLOWED_SORT = {
    created: 'created_at',
    engagement: 'engagement_score',
  };
  const sortKey = url.searchParams.get('sort') || 'created';
  const dir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const sortColumn = ALLOWED_SORT[sortKey] || 'created_at';
  const ascending = dir === 'asc';

  let query = supabase
    .from('crm_contacts')
    .select(
      'id, name, email, phone, company, position, notes, source, source_ref_id, engagement_score, last_engagement_at, tags, created_at, updated_at',
      { count: 'exact' }
    )
    .order(sortColumn, { ascending, nullsFirst: false })
    .range(offset, offset + limit - 1);

  // Tiebreaker stable : created_at desc en secondaire (sauf si c'est déjà la
  // colonne primaire).
  if (sortColumn !== 'created_at') {
    query = query.order('created_at', { ascending: false });
  }

  if (q) {
    const safe = q.replace(/[%_]/g, '\\$&');
    const like = `%${safe}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},company.ilike.${like}`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[api/crm/contacts] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: data || [],
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
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { success: false, error: 'Le nom est requis' },
      { status: 400 }
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Email invalide' },
      { status: 400 }
    );
  }

  const source = ['manual', 'prospection', 'campagnes', 'import'].includes(body.source)
    ? body.source
    : 'manual';

  const insertPayload = {
    user_id: user.id,
    name: name.slice(0, 200),
    email: email || null,
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : null,
    company: typeof body.company === 'string' ? body.company.trim().slice(0, 200) : null,
    position: typeof body.position === 'string' ? body.position.trim().slice(0, 200) : null,
    notes: typeof body.notes === 'string' ? body.notes.trim() : null,
    source,
    source_ref_id: typeof body.source_ref_id === 'string' ? body.source_ref_id : null,
  };

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[api/crm/contacts] POST error', error);
    // 23505 = unique violation (idx_crm_contacts_user_email_unique)
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Un contact avec cet email existe déjà' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
