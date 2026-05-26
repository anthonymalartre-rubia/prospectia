// GET  /api/admin/prospection/sms-campaigns       → liste les campagnes SMS
// POST /api/admin/prospection/sms-campaigns       → crée une campagne SMS (draft)

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { countSmsSegments, estimateSmsCostEur, appendSmsOptOutFooter } from '@/lib/sms';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from('sms_campaigns')
    .select('id, name, body, status, scheduled_at, started_at, completed_at, total_recipients, sent_count, delivered_count, failed_count, estimated_cost_eur, actual_cost_eur, created_at, list_id')
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
  const rawBody = (body.body || '').trim();
  const list_id = body.list_id;
  const sender_name = body.sender_name ? String(body.sender_name).trim().slice(0, 11) : null;
  const sms_sender_id = body.sms_sender_id || null;

  if (!name || !rawBody || !list_id) {
    return NextResponse.json({ error: 'name, body, list_id requis' }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: 'name max 120 chars' }, { status: 400 });
  }

  // Vérifie la liste
  const { data: list } = await supabase
    .from('prospect_lists')
    .select('id, phone_count, opt_out_count')
    .eq('id', list_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });

  // Si sms_sender_id fourni : doit appartenir au user ET être verified.
  // Sinon on garde le fallback compte Volia managé (env TWILIO_*) à l'envoi.
  if (sms_sender_id) {
    const { data: sender } = await supabase
      .from('sms_senders')
      .select('id, status')
      .eq('id', sms_sender_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!sender || sender.status !== 'verified') {
      return NextResponse.json({ error: 'Sender invalide ou pas vérifié' }, { status: 400 });
    }
  }

  // Texte final (avec footer STOP obligatoire)
  const fullText = appendSmsOptOutFooter(rawBody);
  const segments = countSmsSegments(fullText);
  const totalRecipients = Math.max(0, (list.phone_count || 0) - (list.opt_out_count || 0));
  const estimatedCost = Math.round(estimateSmsCostEur(fullText) * totalRecipients * 100) / 100;

  const { data, error } = await supabase
    .from('sms_campaigns')
    .insert({
      owner_id: user.id,
      list_id,
      name,
      body: rawBody, // on stocke le brut, le footer sera ré-ajouté à l'envoi
      sender_name,
      sms_sender_id,
      status: 'draft',
      total_recipients: totalRecipients,
      estimated_cost_eur: estimatedCost,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    campaign: data,
    segments,
    estimated_cost_per_recipient_eur: estimateSmsCostEur(fullText),
  });
}
