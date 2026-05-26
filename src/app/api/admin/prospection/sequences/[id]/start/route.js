// POST /api/admin/prospection/sequences/[id]/start
//
// Active une séquence et enrôle TOUS les contacts de la list_id qui :
//   - ont un email valide
//   - ne sont pas opt_out
//   - ne sont pas déjà enrôlés dans cette séquence (UNIQUE constraint)
//
// L'enrollment est créé avec next_send_at = now() (le step 1 a wait_days=0)
// Le cron /api/cron/process-sequences se chargera ensuite des envois.

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';

export async function POST(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { data: seq } = await supabase
    .from('email_sequences')
    .select('id, status, list_id, owner_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!seq) return NextResponse.json({ error: 'Séquence introuvable' }, { status: 404 });
  if (!seq.list_id) return NextResponse.json({ error: 'Aucune liste associée' }, { status: 400 });

  // Vérifie qu'au moins 1 step existe
  const { count: stepsCount } = await supabase
    .from('sequence_steps')
    .select('id', { count: 'exact', head: true })
    .eq('sequence_id', id);
  if (!stepsCount || stepsCount < 1) {
    return NextResponse.json({ error: 'Aucun step défini' }, { status: 400 });
  }

  // Récupère les contacts de la liste (avec email non null, non opt-out)
  // prospect_contacts a list_id ? On vérifie via la table de jointure si besoin.
  // Pattern dans le code existant : prospect_contacts.list_id direct (cf prospect_lists / contacts_count).
  const { data: contacts, error: cErr } = await supabase
    .from('prospect_contacts')
    .select('id, email')
    .eq('list_id', seq.list_id)
    .eq('opt_out', false)
    .not('email', 'is', null);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ error: 'Aucun contact éligible dans la liste' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rows = contacts
    .filter((c) => c.email && c.email.includes('@'))
    .map((c) => ({
      sequence_id: id,
      contact_id: c.id,
      current_step: 0,
      status: 'active',
      next_send_at: now,
    }));

  // Insert avec onConflict pour ignorer les enrollments déjà existants
  // (UNIQUE (sequence_id, contact_id))
  const { error: insErr } = await supabase
    .from('sequence_enrollments')
    .upsert(rows, { onConflict: 'sequence_id,contact_id', ignoreDuplicates: true });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Active la séquence
  const updates = { status: 'active', updated_at: now };
  if (!seq.started_at) updates.started_at = now;
  const { data: updated, error: upErr } = await supabase
    .from('email_sequences')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, enrolled: rows.length, sequence: updated });
}
