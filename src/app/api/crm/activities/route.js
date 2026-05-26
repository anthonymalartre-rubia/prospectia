// GET  /api/crm/activities    → liste activities filtrées par ?deal_id ou ?contact_id
// POST /api/crm/activities    → crée une activity liée à deal_id et/ou contact_id

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

const VALID_TYPES = ['note', 'call', 'email', 'meeting', 'task'];
const LIMIT_DEFAULT = 100;
const LIMIT_MAX = 500;

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

export async function GET(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const url = new URL(request.url);
  const dealId = url.searchParams.get('deal_id');
  const contactId = url.searchParams.get('contact_id');
  const type = url.searchParams.get('type');
  const scope = url.searchParams.get('scope'); // 'all' (user-wide, requiert plan Business)
  const status = url.searchParams.get('status'); // 'open' | 'completed' | 'overdue'
  const withRelations = url.searchParams.get('with_relations') === '1';
  const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
  const limit = Math.min(LIMIT_MAX, isNaN(limitParam) ? LIMIT_DEFAULT : Math.max(1, limitParam));

  // Si pas de scope=all, on exige deal_id ou contact_id (compat existante)
  if (scope !== 'all' && !dealId && !contactId) {
    return NextResponse.json(
      { success: false, error: 'deal_id ou contact_id est requis' },
      { status: 400 }
    );
  }

  // Sélection avec ou sans relations (deal/contact) pour la page /app/crm/activities
  const selectClause = withRelations
    ? `id, type, content, due_at, completed_at, deal_id, contact_id, created_at,
       deal:crm_deals(id, title, status),
       contact:crm_contacts(id, name, company)`
    : 'id, type, content, due_at, completed_at, deal_id, contact_id, created_at';

  let query = supabase
    .from('crm_activities')
    .select(selectClause)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Scope=all → on filtre explicitement par user_id (sécurité défense en profondeur ;
  // RLS doit aussi le faire).
  if (scope === 'all') {
    query = query.eq('user_id', user.id);
  }
  if (dealId) query = query.eq('deal_id', dealId);
  if (contactId) query = query.eq('contact_id', contactId);
  if (type && VALID_TYPES.includes(type)) query = query.eq('type', type);

  // Filtres status (uniquement pertinents pour les tasks, mais on les applique
  // côté SQL pour limiter le payload)
  const nowIso = new Date().toISOString();
  if (status === 'completed') {
    query = query.not('completed_at', 'is', null);
  } else if (status === 'open') {
    query = query.is('completed_at', null);
  } else if (status === 'overdue') {
    query = query.is('completed_at', null).lt('due_at', nowIso);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[api/crm/activities] GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  const body = await request.json().catch(() => ({}));
  const type = body.type;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const dealId = typeof body.deal_id === 'string' ? body.deal_id : null;
  const contactId = typeof body.contact_id === 'string' ? body.contact_id : null;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { success: false, error: `type doit être l'un de : ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json(
      { success: false, error: 'content est requis' },
      { status: 400 }
    );
  }
  if (!dealId && !contactId) {
    return NextResponse.json(
      { success: false, error: 'deal_id ou contact_id est requis' },
      { status: 400 }
    );
  }

  const dueAt = typeof body.due_at === 'string' && body.due_at ? body.due_at : null;
  const completedAt =
    typeof body.completed_at === 'string' && body.completed_at ? body.completed_at : null;

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      user_id: user.id,
      deal_id: dealId,
      contact_id: contactId,
      type,
      content,
      due_at: dueAt,
      completed_at: completedAt,
    })
    .select()
    .single();

  if (error) {
    console.error('[api/crm/activities] POST error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
