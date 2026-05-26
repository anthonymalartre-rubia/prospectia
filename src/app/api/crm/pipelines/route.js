// GET  /api/crm/pipelines        → liste des pipelines du user (avec stages joined).
//                                  Si aucun, crée le pipeline par défaut.
// POST /api/crm/pipelines        → crée un pipeline custom (sans stages — à créer
//                                  séparément via PATCH du pipeline ou autre route).
//
// Toutes les routes : gating Business plan + auth + RLS.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkCrmAccess, getOrCreateDefaultPipeline } from '@/lib/crm';

function forbidden() {
  return NextResponse.json(
    { success: false, error: 'CRM réservé au plan Business 99€/mois' },
    { status: 403 }
  );
}

export async function GET() {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = await checkCrmAccess(supabase, user.id);
  if (!hasAccess) return forbidden();

  // Récup tous les pipelines + stages embarqués
  const { data: pipelines, error } = await supabase
    .from('crm_pipelines')
    .select('id, name, color, position, is_default, created_at, updated_at, stages:crm_stages(*)')
    .order('position', { ascending: true });

  if (error) {
    console.error('[api/crm/pipelines] GET error', error);
    return NextResponse.json({ success: false, error: 'Erreur lecture' }, { status: 500 });
  }

  // Si aucun pipeline, on crée le default
  if (!pipelines || pipelines.length === 0) {
    try {
      const created = await getOrCreateDefaultPipeline(supabase, user.id);
      return NextResponse.json({ success: true, data: [created] });
    } catch (err) {
      console.error('[api/crm/pipelines] default pipeline error', err);
      return NextResponse.json(
        { success: false, error: err.message || 'Erreur création pipeline' },
        { status: 500 }
      );
    }
  }

  // Tri des stages par position au sein de chaque pipeline (Supabase ne le fait pas en embed)
  pipelines.forEach((p) => {
    if (Array.isArray(p.stages)) {
      p.stages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  });

  return NextResponse.json({ success: true, data: pipelines });
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
      { success: false, error: 'Le nom du pipeline est requis' },
      { status: 400 }
    );
  }
  const color = typeof body.color === 'string' ? body.color.trim().slice(0, 30) : 'violet';
  const position = Number.isInteger(body.position) ? body.position : 0;

  const { data, error } = await supabase
    .from('crm_pipelines')
    .insert({
      user_id: user.id,
      name: name.slice(0, 120),
      color,
      position,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[api/crm/pipelines] POST error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
