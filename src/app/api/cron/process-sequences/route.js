// Cron Vercel : process les sequence_enrollments dont next_send_at <= now()
// pour les séquences en status 'active'.
//
// Stratégie (alignée sur process-email-campaigns) :
//   - Tourne toutes les 5 min
//   - Récupère max BATCH_SIZE enrollments éligibles
//   - Pour chaque : envoie le step (current_step + 1) via Resend
//   - Insert un row email_sends pour le tracking (replied_at, opens, etc.)
//   - Avance current_step, planifie next_send_at = now + step_suivant.wait_days
//   - Si plus de step suivant → enrollment 'completed'
//
// Respecte sequence.daily_limit (compte les sends du jour pour cette séquence).
//
// Protégé par CRON_SECRET (header Authorization Bearer).

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { applyTemplate, appendOptOutFooter } from '@/lib/campaign-templates';
import { cleanEnv } from '@/lib/envClean';
import { buildSequenceReplyAddress } from '@/lib/inbound-domain';
import { reportError } from '@/lib/errorReporting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 50;

export async function GET(request) {
  try {
    return await handleCron(request);
  } catch (err) {
    reportError(err, { cron: 'process-sequences' });
    return NextResponse.json(
      { error: err?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

async function handleCron(request) {
  const expected = cleanEnv(process.env.CRON_SECRET);
  const provided = request.headers.get('authorization');
  if (expected && provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // 1) Récupère les enrollments actifs dus pour envoi.
  //    On limite aux séquences actuellement 'active' (deux filtres : un sur
  //    enrollment + un sur sequence côté code après chargement).
  const { data: rawEnrolls, error: fetchErr } = await supabase
    .from('sequence_enrollments')
    .select('id, sequence_id, contact_id, current_step, status, next_send_at')
    .eq('status', 'active')
    .lte('next_send_at', nowIso)
    .order('next_send_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    console.error('[cron/sequences] fetch error', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!rawEnrolls || rawEnrolls.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Rien en queue' });
  }

  const seqIds = [...new Set(rawEnrolls.map((e) => e.sequence_id))];
  const contactIds = [...new Set(rawEnrolls.map((e) => e.contact_id))];

  // 2) Bulk fetch sequences (actives seulement), steps, contacts, senders
  const [{ data: sequences }, { data: allSteps }, { data: contacts }] = await Promise.all([
    supabase
      .from('email_sequences')
      .select('id, owner_id, name, email_sender_id, daily_limit, stop_on_reply')
      .in('id', seqIds)
      .eq('status', 'active'),
    supabase
      .from('sequence_steps')
      .select('id, sequence_id, step_order, wait_days, subject, body_html')
      .in('sequence_id', seqIds)
      .order('step_order', { ascending: true }),
    supabase
      .from('prospect_contacts')
      .select('id, email, phone, first_name, last_name, company, position_title, custom_fields, opt_out')
      .in('id', contactIds),
  ]);

  const sequenceMap = new Map((sequences || []).map((s) => [s.id, s]));
  const contactMap = new Map((contacts || []).map((c) => [c.id, c]));
  const stepsBySeq = new Map();
  for (const s of allSteps || []) {
    if (!stepsBySeq.has(s.sequence_id)) stepsBySeq.set(s.sequence_id, []);
    stepsBySeq.get(s.sequence_id).push(s);
  }

  const senderIds = [...new Set(
    (sequences || []).map((s) => s.email_sender_id).filter(Boolean)
  )];
  let senderMap = new Map();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from('email_senders')
      .select('id, user_id, domain, from_name, status')
      .in('id', senderIds)
      .eq('status', 'verified');
    senderMap = new Map((senders || []).map((s) => [s.id, s]));
  }

  // 3) daily_limit : on compte les sends aujourd'hui par séquence.
  //    On joint email_sends → sequence_enrollments → sequence_id.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  const dailySentBySeq = new Map();
  for (const seqId of seqIds) {
    const { data: enrollIdsRows } = await supabase
      .from('sequence_enrollments')
      .select('id')
      .eq('sequence_id', seqId);
    const enrollIds = (enrollIdsRows || []).map((r) => r.id);
    if (enrollIds.length === 0) {
      dailySentBySeq.set(seqId, 0);
      continue;
    }
    // Batche par 200
    let total = 0;
    const BATCH = 200;
    for (let i = 0; i < enrollIds.length; i += BATCH) {
      const chunk = enrollIds.slice(i, i + BATCH);
      const { count } = await supabase
        .from('email_sends')
        .select('id', { count: 'exact', head: true })
        .in('sequence_enrollment_id', chunk)
        .gte('sent_at', todayStartIso);
      total += count || 0;
    }
    dailySentBySeq.set(seqId, total);
  }

  // 4) Itère et envoie
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://volia.fr';
  const results = [];
  let dailyThrottled = 0;
  let skippedNoSequence = 0;

  for (const enroll of rawEnrolls) {
    const sequence = sequenceMap.get(enroll.sequence_id);
    if (!sequence) {
      // Sequence pas active ou supprimée → on skip silencieusement
      skippedNoSequence++;
      continue;
    }

    // Daily limit check
    const dailyLimit = sequence.daily_limit || 50;
    const alreadyToday = dailySentBySeq.get(sequence.id) || 0;
    if (alreadyToday >= dailyLimit) {
      dailyThrottled++;
      continue;
    }

    const contact = contactMap.get(enroll.contact_id);
    if (!contact) {
      await markEnrollmentFailed(supabase, enroll.id, 'Contact introuvable');
      results.push({ ok: false, id: enroll.id, reason: 'no_contact' });
      continue;
    }
    if (contact.opt_out) {
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'opted_out' })
        .eq('id', enroll.id);
      results.push({ ok: false, id: enroll.id, reason: 'opt_out' });
      continue;
    }

    const steps = stepsBySeq.get(sequence.id) || [];
    const nextStepOrder = enroll.current_step + 1;
    const step = steps.find((s) => s.step_order === nextStepOrder);

    if (!step) {
      // Plus de step → completed
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'completed' })
        .eq('id', enroll.id);
      results.push({ ok: true, id: enroll.id, completed: true });
      continue;
    }

    // Sender obligatoire
    if (!sequence.email_sender_id) {
      await markEnrollmentFailed(supabase, enroll.id, 'No sender configured');
      results.push({ ok: false, id: enroll.id, reason: 'no_sender' });
      continue;
    }
    const sender = senderMap.get(sequence.email_sender_id);
    if (!sender) {
      await markEnrollmentFailed(supabase, enroll.id, 'Sender not verified or deleted');
      results.push({ ok: false, id: enroll.id, reason: 'sender_invalid' });
      continue;
    }

    // Templating
    const subject = applyTemplate(step.subject, contact, '');
    let html = applyTemplate(step.body_html, contact, '');

    // Opt-out footer (RGPD) — on réutilise l'endpoint existant côté
    // prospection en passant la séquence comme paramètre cmp.
    const optOutUrl = `${baseUrl}/api/prospection/opt-out?c=${contact.id}&seq=${sequence.id}`;
    html = appendOptOutFooter(html, optOutUrl, sequence.name);

    const fromHeader = `${sender.from_name || 'Volia'} <noreply@${sender.domain}>`;
    const replyToHeader = buildSequenceReplyAddress(enroll.id);
    const tags = [
      { name: 'sequence_id', value: String(sequence.id).replace(/-/g, '_') },
      { name: 'enrollment_id', value: String(enroll.id).replace(/-/g, '_') },
      { name: 'step', value: String(nextStepOrder) },
    ];

    const result = await sendEmail({
      to: contact.email,
      from: fromHeader,
      subject,
      html,
      replyTo: replyToHeader,
      tags,
    });

    if (!result.success) {
      await markEnrollmentFailed(supabase, enroll.id, result.error || 'send_failed');
      // Trace dans email_sends pour debug
      await supabase.from('email_sends').insert({
        sequence_enrollment_id: enroll.id,
        sequence_step_id: step.id,
        contact_id: contact.id,
        email: contact.email,
        status: 'failed',
        error: String(result.error || 'unknown').slice(0, 500),
      });
      results.push({ ok: false, id: enroll.id, reason: 'send_failed' });
      continue;
    }

    // Track le send pour analytics + matching webhook (replied_at, opens, etc.)
    const sendIso = new Date().toISOString();
    await supabase.from('email_sends').insert({
      sequence_enrollment_id: enroll.id,
      sequence_step_id: step.id,
      contact_id: contact.id,
      email: contact.email,
      status: 'sent',
      provider_id: result.id,
      sent_at: sendIso,
    });

    // last_email_at sur le contact (throttling cross-séquences)
    await supabase
      .from('prospect_contacts')
      .update({ last_email_at: sendIso })
      .eq('id', contact.id);

    // Avance l'enrollment
    const nextStep = steps.find((s) => s.step_order === nextStepOrder + 1);
    const nextStatus = nextStep ? 'active' : 'completed';
    const nextSendAt = nextStep
      ? new Date(Date.now() + (nextStep.wait_days || 0) * 24 * 60 * 60 * 1000).toISOString()
      : sendIso;

    await supabase
      .from('sequence_enrollments')
      .update({
        current_step: nextStepOrder,
        last_send_at: sendIso,
        next_send_at: nextSendAt,
        status: nextStatus,
      })
      .eq('id', enroll.id);

    dailySentBySeq.set(sequence.id, (dailySentBySeq.get(sequence.id) || 0) + 1);
    results.push({ ok: true, id: enroll.id, step: nextStepOrder, completed: !nextStep });
  }

  // 5) Marque les séquences sans plus aucun enrollment 'active' comme 'completed'
  for (const seqId of seqIds) {
    const { count } = await supabase
      .from('sequence_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('sequence_id', seqId)
      .eq('status', 'active');
    if ((count || 0) === 0) {
      await supabase
        .from('email_sequences')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', seqId)
        .eq('status', 'active');
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded,
    failed,
    daily_throttled: dailyThrottled,
    skipped_no_sequence: skippedNoSequence,
    sequences_affected: seqIds.length,
  });
}

async function markEnrollmentFailed(supabase, enrollmentId, _reason) {
  await supabase
    .from('sequence_enrollments')
    .update({ status: 'failed' })
    .eq('id', enrollmentId);
}
