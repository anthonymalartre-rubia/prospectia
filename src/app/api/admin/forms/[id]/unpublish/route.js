// POST /api/admin/forms/[id]/unpublish
// Repasse le form à status='draft' (sans toucher published_at — on garde
// la date de première publication pour les stats / audit).

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request, { params }) {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('forms')
    .update({ status: 'draft' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, slug, status, published_at')
    .single();

  if (error) {
    console.error('[api/admin/forms/[id]/unpublish] error', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Formulaire introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
