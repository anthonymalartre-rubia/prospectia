// POST /api/admin/prospection/email-campaigns/[id]/send
//
// Action : génère un email_sends pour chaque contact NON opt-out NON
// déjà envoyé de la liste, et passe la campagne en status 'sending'.
// Le cron /api/cron/process-email-campaigns fera l'envoi par batch.
//
// Body : { scheduled_at? } pour planification, sinon envoi immédiat.

import { NextResponse } from 'next/server';
import { requireCampagnesAccess } from '@/lib/campagnes-access-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { trackOnboardingStep } from '@/lib/onboarding';
import { detectTimezone, getNextSendWindow } from '@/lib/timezone-detector';
import { unlockAchievement } from '@/lib/achievements';

export async function POST(request, { params }) {
  const auth = await requireCampagnesAccess();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at).toISOString() : null;

  // Vérifie la campagne — on récupère aussi smart_scheduling pour décider si
  // on doit calculer un scheduled_for par destinataire.
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, name, list_id, status, smart_scheduling')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  if (campaign.status === 'sending' || campaign.status === 'sent') {
    return NextResponse.json({ error: 'Campagne déjà en cours / envoyée' }, { status: 400 });
  }

  // Use service_role pour le bulk insert (bypass RLS sur email_sends)
  const supabaseAdmin = getSupabaseAdmin();

  // Récup les contacts éligibles (email présent, non opt-out)
  // On chunk par 1000 pour pas exploser la mémoire
  const PAGE_SIZE = 1000;
  let totalQueued = 0;
  let offset = 0;

  // Si smart_scheduling actif on a besoin du phone pour la détection TZ (signal
  // plus fiable que le TLD). Sinon on s'en passe — économie de bytes.
  const contactColumns = campaign.smart_scheduling ? 'id, email, phone' : 'id, email';
  const now = new Date();

  while (true) {
    const { data: contacts, error: cErr } = await supabaseAdmin
      .from('prospect_contacts')
      .select(contactColumns)
      .eq('list_id', campaign.list_id)
      .not('email', 'is', null)
      .eq('opt_out', false)
      // .order('id') indispensable pour que la pagination .range() soit
      // déterministe. Sans ça Postgres peut renvoyer des résultats
      // incohérents entre pages → certains contacts jamais queue-és (bug
      // fix audit 27 mai 2026).
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (cErr) {
      console.error('[campaigns/send] error fetching contacts', cErr);
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }
    if (!contacts || contacts.length === 0) break;

    // Insert sends, ignore les déjà-existants (campaign × contact unique).
    // Si smart_scheduling=true, on précalcule scheduled_for par destinataire
    // depuis sa timezone (détectée via phone/email TLD), sinon NULL = envoi
    // immédiat dès que le cron passe (comportement legacy).
    const rows = contacts.map((c) => {
      const row = {
        campaign_id: id,
        contact_id: c.id,
        email: c.email,
        status: 'pending',
      };
      if (campaign.smart_scheduling) {
        const tz = detectTimezone({ email: c.email, phone: c.phone });
        row.scheduled_for = getNextSendWindow(tz, now).toISOString();
      }
      return row;
    });

    const { error: insErr, count } = await supabaseAdmin
      .from('email_sends')
      .upsert(rows, { ignoreDuplicates: true, count: 'exact' });

    if (insErr) {
      console.error('[campaigns/send] insert error', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    totalQueued += contacts.length;

    if (contacts.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Update status campagne
  const newStatus = scheduledAt && new Date(scheduledAt) > new Date() ? 'scheduled' : 'sending';
  const { error: upErr } = await supabaseAdmin
    .from('email_campaigns')
    .update({
      status: newStatus,
      scheduled_at: scheduledAt,
      started_at: newStatus === 'sending' ? new Date().toISOString() : null,
      total_recipients: totalQueued,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Onboarding : marque first_campaign (fire-and-forget)
  let achievement = null;
  if (totalQueued > 0) {
    trackOnboardingStep(user.id, 'first_campaign');

    // Achievement : first_campaign_sent (best-effort)
    try {
      const ach = await unlockAchievement(
        user.id,
        'first_campaign_sent',
        {
          campaign_id: id,
          campaign_name: campaign.name,
          recipient_count: totalQueued,
        },
        { markToastShown: true } // toast affiché live côté page campaign send
      );
      if (ach?.newly_unlocked) achievement = ach.achievement;
    } catch (err) {
      console.warn('[achievement] unlock failed:', err.message);
    }
  }

  let message;
  if (newStatus === 'scheduled') {
    message = `Campagne planifiée pour ${scheduledAt}. ${totalQueued} destinataires.`;
  } else if (campaign.smart_scheduling) {
    message = `Envoi démarré (planification intelligente activée). ${totalQueued} destinataires : chacun recevra son email dans la fenêtre 9h-17h heure locale, du lundi au vendredi.`;
  } else {
    message = `Envoi démarré. ${totalQueued} destinataires en queue. Cron envoie ~50 mails toutes les 5 min.`;
  }

  return NextResponse.json({
    ok: true,
    queued: totalQueued,
    status: newStatus,
    smart_scheduling: !!campaign.smart_scheduling,
    message,
    achievement,
  });
}
