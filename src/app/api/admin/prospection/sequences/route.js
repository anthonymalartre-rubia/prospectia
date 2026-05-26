// GET  /api/admin/prospection/sequences  → liste des séquences du user
// POST /api/admin/prospection/sequences  → crée une séquence + ses steps
//
// Body POST :
//   {
//     name, description?, list_id, email_sender_id,
//     stop_on_reply?: true, daily_limit?: 50,
//     steps: [{ wait_days, subject, body_html }, ...]
//   }

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';

export async function GET() {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select('id, name, description, status, stop_on_reply, daily_limit, list_id, email_sender_id, created_at, started_at, completed_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hydrate stats minimal : nb steps + nb enrollments par status
  const ids = (sequences || []).map((s) => s.id);
  let stepCounts = {};
  let enrollmentStats = {};

  if (ids.length > 0) {
    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('sequence_id')
      .in('sequence_id', ids);
    for (const s of steps || []) {
      stepCounts[s.sequence_id] = (stepCounts[s.sequence_id] || 0) + 1;
    }

    const { data: enrolls } = await supabase
      .from('sequence_enrollments')
      .select('sequence_id, status')
      .in('sequence_id', ids);
    for (const e of enrolls || []) {
      if (!enrollmentStats[e.sequence_id]) {
        enrollmentStats[e.sequence_id] = { total: 0, active: 0, replied: 0, completed: 0, failed: 0, opted_out: 0 };
      }
      enrollmentStats[e.sequence_id].total++;
      if (enrollmentStats[e.sequence_id][e.status] !== undefined) {
        enrollmentStats[e.sequence_id][e.status]++;
      }
    }
  }

  const enriched = (sequences || []).map((s) => ({
    ...s,
    steps_count: stepCounts[s.id] || 0,
    stats: enrollmentStats[s.id] || { total: 0, active: 0, replied: 0, completed: 0, failed: 0, opted_out: 0 },
  }));

  return NextResponse.json({ sequences: enriched });
}

export async function POST(request) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const description = (body.description || '').trim() || null;
  const list_id = body.list_id;
  const email_sender_id = body.email_sender_id || null;
  const stop_on_reply = body.stop_on_reply !== false;
  const daily_limit = Number.isFinite(body.daily_limit) ? Math.max(1, Math.min(500, body.daily_limit)) : 50;
  const steps = Array.isArray(body.steps) ? body.steps : [];

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'name requis (max 120 chars)' }, { status: 400 });
  }
  if (!list_id) {
    return NextResponse.json({ error: 'list_id requis' }, { status: 400 });
  }
  if (steps.length < 1) {
    return NextResponse.json({ error: 'Au moins un step requis' }, { status: 400 });
  }
  if (steps.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 steps' }, { status: 400 });
  }

  // Validation des steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const subject = String(s.subject || '').trim();
    const body_html = String(s.body_html || '').trim();
    const wait_days = Number(s.wait_days) || 0;
    if (!subject || subject.length > 200) {
      return NextResponse.json({ error: `Step ${i + 1} : subject requis (max 200 chars)` }, { status: 400 });
    }
    if (!body_html) {
      return NextResponse.json({ error: `Step ${i + 1} : body_html requis` }, { status: 400 });
    }
    if (wait_days < 0 || wait_days > 60) {
      return NextResponse.json({ error: `Step ${i + 1} : wait_days entre 0 et 60` }, { status: 400 });
    }
    if (i === 0 && wait_days !== 0) {
      return NextResponse.json({ error: 'Le premier step doit avoir wait_days = 0' }, { status: 400 });
    }
  }

  // Vérifie ownership de la liste
  const { data: list } = await supabase
    .from('prospect_lists')
    .select('id')
    .eq('id', list_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });

  // Vérifie sender obligatoire et verified (cf email-campaigns POST)
  if (!email_sender_id) {
    return NextResponse.json(
      {
        error: 'Configurez d\'abord votre domaine d\'envoi',
        action: 'configure_sender',
        link: '/settings/email-senders',
      },
      { status: 400 }
    );
  }
  const { data: sender } = await supabase
    .from('email_senders')
    .select('id, status, domain')
    .eq('id', email_sender_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!sender) {
    return NextResponse.json({ error: 'Sender introuvable' }, { status: 404 });
  }
  if (sender.status !== 'verified') {
    return NextResponse.json(
      { error: `Domaine ${sender.domain} pas encore vérifié`, link: '/settings/email-senders' },
      { status: 400 }
    );
  }

  // Insert sequence
  const { data: seq, error: seqErr } = await supabase
    .from('email_sequences')
    .insert({
      owner_id: user.id,
      name,
      description,
      list_id,
      email_sender_id,
      stop_on_reply,
      daily_limit,
      status: 'draft',
    })
    .select()
    .single();

  if (seqErr) return NextResponse.json({ error: seqErr.message }, { status: 500 });

  // Insert steps
  const stepRows = steps.map((s, idx) => ({
    sequence_id: seq.id,
    step_order: idx + 1,
    wait_days: idx === 0 ? 0 : Number(s.wait_days) || 0,
    subject: String(s.subject || '').trim(),
    body_html: String(s.body_html || '').trim(),
  }));
  const { error: stepsErr } = await supabase.from('sequence_steps').insert(stepRows);
  if (stepsErr) {
    // Rollback best-effort
    await supabase.from('email_sequences').delete().eq('id', seq.id);
    return NextResponse.json({ error: stepsErr.message }, { status: 500 });
  }

  return NextResponse.json({ sequence: seq });
}
