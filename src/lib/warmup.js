// lib/warmup.js
//
// Helpers pour le warmup automatique des domaines d'envoi email.
//
// Version MVP — il ne s'agit PAS de peer-to-peer warming (type Lemwarm /
// Mailwarm où des inboxes amies s'échangent des emails pour générer du
// signal positif). C'est un THROTTLING progressif des vrais envois sur
// 28 jours qui respecte le protocole de warmup standard (Gmail/Outlook
// acceptent mal une montée brutale en volume sur un domaine neuf).
//
// La logique :
//   - À la première vérification d'un sender, on crée une warmup_session
//     (cf. /api/email-senders/[id]/verify)
//   - Le cron process-email-campaigns consulte la session active du
//     sender avant d'envoyer un batch et limite le nombre d'envois du
//     jour selon la phase courante
//   - Au jour 28, la session passe en 'completed' et le throttling
//     est levé (plein régime)
//
// Limites courantes (Resend / domaines neufs) :
//   - Jour 1-7    : 10 emails/j   → soft launch
//   - Jour 8-14   : 30 emails/j   → montée progressive
//   - Jour 15-21  : 100 emails/j  → volume normal
//   - Jour 22-28  : 200 emails/j  → volume cible

export const WARMUP_DURATION_DAYS = 28;

export const WARMUP_PHASES = [
  { days: '1-7', maxPerDay: 10, label: 'Phase 1 : Soft launch' },
  { days: '8-14', maxPerDay: 30, label: 'Phase 2 : Montée progressive' },
  { days: '15-21', maxPerDay: 100, label: 'Phase 3 : Volume normal' },
  { days: '22-28', maxPerDay: 200, label: 'Phase 4 : Volume cible' },
];

/**
 * Retourne la phase courante (objet avec days, maxPerDay, label, phaseNumber).
 * Retourne null si le warmup est terminé (currentDay > 28).
 *
 * @param {number} currentDay - Jour courant du warmup (1..28)
 * @returns {{days: string, maxPerDay: number, label: string, phaseNumber: number} | null}
 */
export function getCurrentPhase(currentDay) {
  if (currentDay <= 0) return null;
  if (currentDay <= 7) return { ...WARMUP_PHASES[0], phaseNumber: 1 };
  if (currentDay <= 14) return { ...WARMUP_PHASES[1], phaseNumber: 2 };
  if (currentDay <= 21) return { ...WARMUP_PHASES[2], phaseNumber: 3 };
  if (currentDay <= 28) return { ...WARMUP_PHASES[3], phaseNumber: 4 };
  return null;
}

/**
 * Calcule le jour courant du warmup depuis la date de début.
 * Jour 1 = jour de démarrage.
 * Cappé à 28 (au-delà, getCurrentPhase renverra null).
 *
 * @param {string|Date} startedAt
 * @returns {number} 1..28+
 */
export function calculateCurrentDay(startedAt) {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(diffDays, WARMUP_DURATION_DAYS + 1));
}

/**
 * Estime la date de fin du warmup (= started_at + 28 jours).
 *
 * @param {string|Date} startedAt
 * @returns {Date}
 */
export function estimateCompletionDate(startedAt) {
  const start = new Date(startedAt);
  return new Date(start.getTime() + WARMUP_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Compte les envois 'sent' du jour (UTC midnight → maintenant) pour un sender.
 *
 * Couvre les deux canaux qui consomment le quota warmup :
 *   - sends via campagnes one-shot : email_sends.campaign_id → email_campaigns.email_sender_id
 *   - sends via séquences         : email_sends.sequence_enrollment_id → sequence_enrollments.sequence_id → email_sequences.email_sender_id
 *
 * Sans le 2e compte, un sender en phase 1 (10/j) pouvait envoyer
 * 50 sequence emails + 10 campaign = 60 emails dans la journée
 * et brûler son warmup (issue P1 #2).
 *
 * Retourne 0 si pas de campagnes ni séquences attachées au sender.
 *
 * @param {object} supabase - client Supabase admin
 * @param {string} senderId - UUID du email_sender
 * @returns {Promise<number>} nombre d'envois 'sent' aujourd'hui pour ce sender (campaigns + sequences)
 */
export async function countTodaySendsForSender(supabase, senderId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  // ── Phase 1 : sends via campagnes ──────────────────────────────────
  // Récupère les campaign_id du sender (limite à 1000 — un user n'aura
  // jamais plus de campagnes que ça associées à un même domaine pendant
  // la fenêtre de warmup).
  let campaignSendsCount = 0;
  const { data: campaigns, error: cErr } = await supabase
    .from('email_campaigns')
    .select('id')
    .eq('email_sender_id', senderId)
    .limit(1000);

  if (!cErr && campaigns && campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id);
    const { count, error: sErr } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', todayStartIso)
      .in('campaign_id', campaignIds);
    if (!sErr) campaignSendsCount = count || 0;
  }

  // ── Phase 2 : sends via séquences (NOUVEAU — fix bug P1 #2) ───────
  // 1) sequences du sender (cap 1000, idem)
  // 2) enrollments de ces sequences (cap large, on batch côté .in())
  // 3) sends 'sent' aujourd'hui rattachés à ces enrollments
  let sequenceSendsCount = 0;
  const { data: sequences, error: seqErr } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('email_sender_id', senderId)
    .limit(1000);

  if (!seqErr && sequences && sequences.length > 0) {
    const sequenceIds = sequences.map((s) => s.id);
    // Fetch tous les enrollments en batchs (cap à 5000 pour éviter explosion mémoire ;
    // au-delà, le warmup est de toute façon terminé et la fonction n'est plus appelée).
    const { data: enrollRows } = await supabase
      .from('sequence_enrollments')
      .select('id')
      .in('sequence_id', sequenceIds)
      .limit(5000);

    const enrollIds = (enrollRows || []).map((r) => r.id);
    if (enrollIds.length > 0) {
      // .in() Supabase est OK jusqu'à ~1000 éléments par requête.
      // On batch par 500 par prudence.
      const CHUNK = 500;
      for (let i = 0; i < enrollIds.length; i += CHUNK) {
        const chunk = enrollIds.slice(i, i + CHUNK);
        const { count, error: sErr2 } = await supabase
          .from('email_sends')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('sent_at', todayStartIso)
          .in('sequence_enrollment_id', chunk);
        if (!sErr2) sequenceSendsCount += count || 0;
      }
    }
  }

  return campaignSendsCount + sequenceSendsCount;
}

/**
 * Calcule le quota restant aujourd'hui pour un sender en warmup.
 *
 * @param {object} supabase
 * @param {string} senderId
 * @param {number} currentDay
 * @returns {Promise<number>} quota restant aujourd'hui (Infinity si warmup terminé)
 */
export async function getRemainingQuotaToday(supabase, senderId, currentDay) {
  const phase = getCurrentPhase(currentDay);
  if (!phase) return Infinity; // warmup terminé → pas de limite

  const alreadySent = await countTodaySendsForSender(supabase, senderId);
  return Math.max(0, phase.maxPerDay - alreadySent);
}

/**
 * Helper UI — pourcentage de progression du warmup (0..100).
 */
export function getWarmupProgressPercent(currentDay) {
  if (currentDay <= 0) return 0;
  if (currentDay >= WARMUP_DURATION_DAYS) return 100;
  return Math.round((currentDay / WARMUP_DURATION_DAYS) * 100);
}
