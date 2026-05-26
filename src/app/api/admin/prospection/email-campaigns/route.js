// GET  /api/admin/prospection/email-campaigns       → liste les campagnes
// POST /api/admin/prospection/email-campaigns       → crée une campagne (draft)

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('id, name, subject, status, scheduled_at, started_at, completed_at, total_recipients, sent_count, delivered_count, opened_count, clicked_count, bounced_count, failed_count, replied_count, created_at, list_id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const subject = (body.subject || '').trim();
  const body_html = (body.body_html || '').trim();
  const list_id = body.list_id;
  const from_name = (body.from_name || 'Volia').trim().slice(0, 80);
  const from_email = (body.from_email || 'hello@volia.fr').trim();
  const reply_to = body.reply_to ? String(body.reply_to).trim() : null;
  const email_sender_id = body.email_sender_id || null;

  if (!name || !subject || !body_html || !list_id) {
    return NextResponse.json({ error: 'name, subject, body_html, list_id requis' }, { status: 400 });
  }
  if (name.length > 120 || subject.length > 200) {
    return NextResponse.json({ error: 'name max 120 chars, subject max 200' }, { status: 400 });
  }

  // Vérifie que la liste appartient au user
  const { data: list } = await supabase
    .from('prospect_lists')
    .select('id, contacts_count, email_count, opt_out_count')
    .eq('id', list_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });

  // Si email_sender_id fourni : doit appartenir au user ET être verified.
  // Sinon on garde le fallback Volia (hello@volia.fr) au moment de l'envoi.
  if (email_sender_id) {
    const { data: sender } = await supabase
      .from('email_senders')
      .select('id, status')
      .eq('id', email_sender_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!sender || sender.status !== 'verified') {
      return NextResponse.json({ error: 'Sender invalide ou pas vérifié' }, { status: 400 });
    }
  }

  const totalRecipients = (list.email_count || 0) - (list.opt_out_count || 0);

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      owner_id: user.id,
      list_id,
      name,
      subject,
      body_html,
      from_name,
      from_email,
      reply_to,
      email_sender_id,
      status: 'draft',
      total_recipients: totalRecipients,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
