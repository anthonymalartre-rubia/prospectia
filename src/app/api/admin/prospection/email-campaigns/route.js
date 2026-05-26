// GET  /api/admin/prospection/email-campaigns       → liste les campagnes
// POST /api/admin/prospection/email-campaigns       → crée une campagne (draft)

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';

export async function GET() {
  const auth = await requireCampagnesAccess();
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
  const auth = await requireCampagnesAccess();
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
  // Smart scheduling timezone-aware (cf /lib/timezone-detector.js). On accepte
  // explicitement true/false ; toute autre valeur => false (legacy/safe default).
  const smart_scheduling = body.smart_scheduling === true;

  // A/B testing : 1 (par défaut) à 3 variants de subject. Les variants 2/3 sont
  // optionnels — s'ils sont vides/null, pas d'A/B test (legacy behavior).
  const subject_variant_2 = body.subject_variant_2 ? String(body.subject_variant_2).trim() : null;
  const subject_variant_3 = body.subject_variant_3 ? String(body.subject_variant_3).trim() : null;
  const ab_test_sample_size = Number.isInteger(body.ab_test_sample_size)
    ? Math.max(10, Math.min(10000, body.ab_test_sample_size))
    : 100;

  if (!name || !subject || !body_html || !list_id) {
    return NextResponse.json({ error: 'name, subject, body_html, list_id requis' }, { status: 400 });
  }
  if (name.length > 120 || subject.length > 200) {
    return NextResponse.json({ error: 'name max 120 chars, subject max 200' }, { status: 400 });
  }
  if (subject_variant_2 && subject_variant_2.length > 200) {
    return NextResponse.json({ error: 'subject_variant_2 max 200 chars' }, { status: 400 });
  }
  if (subject_variant_3 && subject_variant_3.length > 200) {
    return NextResponse.json({ error: 'subject_variant_3 max 200 chars' }, { status: 400 });
  }
  // variant 3 ne peut exister sans variant 2 (UX : on ajoute 2 puis 3)
  if (subject_variant_3 && !subject_variant_2) {
    return NextResponse.json({ error: 'subject_variant_2 requis si subject_variant_3 fourni' }, { status: 400 });
  }

  // Vérifie que la liste appartient au user
  const { data: list } = await supabase
    .from('prospect_lists')
    .select('id, contacts_count, email_count, opt_out_count')
    .eq('id', list_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });

  // SÉCURITÉ MULTI-TENANT : email_sender_id est OBLIGATOIRE et doit
  // appartenir au user + être verified. On NE PERMET PAS l'envoi
  // depuis hello@volia.fr (notre domaine) au nom d'un client tiers —
  // ça brûlerait notre réputation, mélangerait les responsabilités
  // légales, et permettrait à n'importe quel client de spammer en
  // notre nom.
  if (!email_sender_id) {
    return NextResponse.json(
      {
        error: 'Configurez d\'abord votre domaine d\'envoi',
        details: 'Pour envoyer une campagne, vous devez connecter votre propre domaine vérifié dans Paramètres > Domaines d\'envoi email.',
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
    return NextResponse.json(
      { error: 'Sender introuvable ou ne vous appartient pas' },
      { status: 404 }
    );
  }
  if (sender.status !== 'verified') {
    return NextResponse.json(
      {
        error: `Domaine ${sender.domain} pas encore vérifié`,
        details: 'Retournez sur la page Domaines d\'envoi pour terminer la configuration DNS.',
        action: 'verify_sender',
        link: `/settings/email-senders`,
      },
      { status: 400 }
    );
  }

  const totalRecipients = (list.email_count || 0) - (list.opt_out_count || 0);

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      owner_id: user.id,
      list_id,
      name,
      subject,
      subject_variant_2,
      subject_variant_3,
      ab_test_sample_size,
      body_html,
      from_name,
      from_email,
      reply_to,
      email_sender_id,
      smart_scheduling,
      status: 'draft',
      total_recipients: totalRecipients,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
