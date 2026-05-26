// PATCH /api/crm/deals/[id]/move
// Body : { stage_id, position }
// Update stage_id + position. Si le nouveau stage a closing_type='won'|'lost',
// met status + closed_at en cohérence. Sinon repasse en 'open'.

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

  const stageId = typeof body.stage_id === 'string' ? body.stage_id : '';
  if (!stageId) {
    return NextResponse.json(
      { success: false, error: 'stage_id est requis' },
      { status: 400 }
    );
  }
  const position = Number.isInteger(body.position) ? body.position : 0;

  // 1. Récup le deal pour vérifier pipeline cohérent + RLS
  const { data: deal, error: dealErr } = await supabase
    .from('crm_deals')
    .select('id, pipeline_id, status')
    .eq('id', id)
    .maybeSingle();
  if (dealErr || !deal) {
    return NextResponse.json({ success: false, error: 'Deal introuvable' }, { status: 404 });
  }

  // 2. Récup le stage cible
  const { data: stage, error: stageErr } = await supabase
    .from('crm_stages')
    .select('id, pipeline_id, closing_type')
    .eq('id', stageId)
    .maybeSingle();
  if (stageErr || !stage) {
    return NextResponse.json({ success: false, error: 'Stage introuvable' }, { status: 404 });
  }
  if (stage.pipeline_id !== deal.pipeline_id) {
    return NextResponse.json(
      { success: false, error: 'Le stage doit appartenir au même pipeline que le deal' },
      { status: 400 }
    );
  }

  // 3. Détermine status + closed_at
  const updates = { stage_id: stageId, position };
  if (stage.closing_type === 'won') {
    updates.status = 'won';
    updates.closed_at = new Date().toISOString();
  } else if (stage.closing_type === 'lost') {
    updates.status = 'lost';
    updates.closed_at = new Date().toISOString();
  } else {
    updates.status = 'open';
    updates.closed_at = null;
  }

  const { data, error } = await supabase
    .from('crm_deals')
    .update(updates)
    .eq('id', id)
    .select(
      `id, title, value_cents, currency, status, closed_at, position,
       pipeline_id, stage_id, contact_id, updated_at,
       stage:crm_stages(id, name, color, probability, closing_type, position)`
    )
    .single();

  if (error) {
    console.error('[api/crm/deals/[id]/move] error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
