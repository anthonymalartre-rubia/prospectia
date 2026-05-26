// GET  /api/crm/deals     → liste des deals (?pipeline_id, ?status, ?stage_id)
// POST /api/crm/deals     → crée un deal (title + pipeline_id + stage_id required)

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess } from '@/lib/crm';

const VALID_STATUS = ['open', 'won', 'lost'];

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
  const pipelineId = url.searchParams.get('pipeline_id');
  const stageId = url.searchParams.get('stage_id');
  const status = url.searchParams.get('status');

  let query = supabase
    .from('crm_deals')
    .select(
      `id, title, value_cents, currency, expected_close_date, notes, status, closed_at, position,
       pipeline_id, stage_id, contact_id, metadata, created_at, updated_at,
       contact:crm_contacts(id, name, email, company),
       stage:crm_stages(id, name, color, probability, closing_type, position)`
    )
    .order('position', { ascending: true });

  if (pipelineId) query = query.eq('pipeline_id', pipelineId);
  if (stageId) query = query.eq('stage_id', stageId);
  if (status && VALID_STATUS.includes(status)) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('[api/crm/deals] GET error', error);
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
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const pipelineId = typeof body.pipeline_id === 'string' ? body.pipeline_id : '';
  const stageId = typeof body.stage_id === 'string' ? body.stage_id : '';

  if (!title || !pipelineId || !stageId) {
    return NextResponse.json(
      { success: false, error: 'title, pipeline_id et stage_id sont requis' },
      { status: 400 }
    );
  }

  // Vérifie que le stage appartient bien au pipeline (et donc à l'user via RLS)
  const { data: stage, error: stageErr } = await supabase
    .from('crm_stages')
    .select('id, pipeline_id, closing_type')
    .eq('id', stageId)
    .eq('pipeline_id', pipelineId)
    .maybeSingle();
  if (stageErr || !stage) {
    return NextResponse.json(
      { success: false, error: 'Stage introuvable ou ne correspond pas au pipeline' },
      { status: 400 }
    );
  }

  const valueCents = Number.isFinite(body.value_cents)
    ? Math.max(0, Math.round(body.value_cents))
    : 0;
  const currency = typeof body.currency === 'string' ? body.currency.trim().slice(0, 8) : 'EUR';
  const contactId = typeof body.contact_id === 'string' ? body.contact_id : null;
  const expectedCloseDate =
    typeof body.expected_close_date === 'string' && body.expected_close_date
      ? body.expected_close_date
      : null;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

  // Si on insère directement dans un stage closing, on aligne status + closed_at
  let status = 'open';
  let closedAt = null;
  if (stage.closing_type === 'won') {
    status = 'won';
    closedAt = new Date().toISOString();
  } else if (stage.closing_type === 'lost') {
    status = 'lost';
    closedAt = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      user_id: user.id,
      contact_id: contactId,
      pipeline_id: pipelineId,
      stage_id: stageId,
      title: title.slice(0, 200),
      value_cents: valueCents,
      currency,
      expected_close_date: expectedCloseDate,
      notes,
      status,
      closed_at: closedAt,
      position: Number.isInteger(body.position) ? body.position : 0,
    })
    .select(
      `id, title, value_cents, currency, expected_close_date, notes, status, closed_at, position,
       pipeline_id, stage_id, contact_id, metadata, created_at, updated_at,
       contact:crm_contacts(id, name, email, company),
       stage:crm_stages(id, name, color, probability, closing_type, position)`
    )
    .single();

  if (error) {
    console.error('[api/crm/deals] POST error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
