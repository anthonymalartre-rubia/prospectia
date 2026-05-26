// POST /api/admin/forms/[id]/publish
// Passe le form à status='published' + set published_at = now()
// Le schema doit être valide (au moins 1 field) — on bloque le publish
// d'un form vide pour éviter qu'un user partage un slug rendu blanc.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateFormSchema } from '@/lib/forms';

export async function POST(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('id, schema, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }
  if (!form) {
    return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
  }

  // Garde-fou : on n'autorise pas la publication d'un form sans champs.
  const v = validateFormSchema(form.schema);
  if (!v.valid) {
    return NextResponse.json(
      { success: false, error: 'Schema invalide', details: v.errors },
      { status: 400 }
    );
  }
  const fieldsCount = Array.isArray(form.schema?.fields) ? form.schema.fields.length : 0;
  if (fieldsCount === 0) {
    return NextResponse.json(
      { success: false, error: 'Ajoutez au moins un champ avant de publier le formulaire.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('forms')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, slug, status, published_at')
    .single();

  if (error) {
    console.error('[api/admin/forms/[id]/publish] error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
