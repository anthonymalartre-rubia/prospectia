import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import {
  useCaseDay1Email,
  templateKillerDay3Email,
  trialExpiringDay7Email,
  finalDemoDay14Email,
} from '@/lib/emailTemplates';

/**
 * GET /api/cron/process-drip-emails
 *
 * Cron Vercel daily (10h UTC = 11h FR hiver / 12h FR été).
 * Envoie les 4 emails de la drip campaign onboarding :
 *
 *   J+1  use_case_d1         — Tutorial 1ère recherche (TOUS les users)
 *   J+3  template_d3         — Template cold email killer (TOUS les users)
 *   J+7  trial_expiring_d7   — Push upgrade Pro (UNIQUEMENT users en trial actif)
 *   J+14 final_demo_d14      — CTA démo Cal.com (TOUS les users non convertis)
 *
 * Le welcome (J+0) n'est PAS envoyé ici — il est déclenché par le flux signup
 * (authSignupConfirm + welcomeEmail).
 *
 * IDEMPOTENCE :
 *   - Chaque step a sa clé écrite dans user_profiles.drip_emails_sent (jsonb array)
 *   - On filtre via NOT (drip_emails_sent ? '<step_key>')
 *   - Si le cron tourne 2× le même jour, le 2e run ne fera rien (clé déjà présente)
 *
 * OPT-OUT :
 *   - On filtre drip_emails_enabled = true. Si l'user a coché OFF dans Settings,
 *     aucun drip ne lui parvient (mais les transactionnels obligatoires
 *     — paiement, mot de passe, RGPD — continuent normalement via leurs propres flux).
 *
 * FENÊTRE DE TIR :
 *   - Pour chaque step à J+N, on cible les users créés il y a >= N jours
 *     (borne supérieure : created_at <= now - N*24h).
 *   - L'idempotence est garantie par le filtre drip_emails_sent ? '<key>' :
 *     un user qui a déjà reçu le step ne le recevra plus.
 *   - Borne inférieure historique enlevée : avec l'ancienne fenêtre 24h,
 *     un signup à 11h le jour J avait son créneau J+1 calé entre 10h-1j et
 *     10h (cron daily à 10h UTC) → l'user était à "il y a 23h" → hors
 *     fenêtre, et le créneau J+2 le mettait à "47h" → encore hors fenêtre.
 *     Résultat : drip J+1 jamais envoyé pour tous les signups après 10h UTC.
 *
 * Sécurité : header Authorization: Bearer CRON_SECRET (cf. vercel.json).
 */
export const dynamic = 'force-dynamic';

function checkCronAuth(request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  return process.env.CRON_SECRET && auth === expected;
}

/**
 * Définition des steps de la drip. Ordre important : on les traite dans
 * cet ordre pour que les logs soient lisibles. Le builder reçoit le profile
 * complet pour pouvoir personnaliser (stats trial, etc.).
 */
const DRIP_STEPS = [
  {
    key: 'use_case_d1',
    daysSinceSignup: 1,
    label: 'J+1 Use case',
    /** Aucun pré-requis : envoyé à tout user actif. */
    isEligible: () => true,
    build: ({ fullName }) => useCaseDay1Email(fullName),
  },
  {
    key: 'template_d3',
    daysSinceSignup: 3,
    label: 'J+3 Template killer',
    isEligible: () => true,
    build: ({ fullName }) => templateKillerDay3Email(fullName),
  },
  {
    key: 'trial_expiring_d7',
    daysSinceSignup: 7,
    label: 'J+7 Trial expiring',
    /**
     * Réservé aux users en trial Pro actif :
     *   - trial_ends_at est dans le futur (trial pas encore expiré)
     *   - trial_converted_at est null (pas encore upgradé)
     * Si l'user a déjà converti ou n'a jamais eu de trial → skip.
     */
    isEligible: ({ profile }) => {
      if (!profile.trial_ends_at) return false;
      if (profile.trial_converted_at) return false;
      const endsAt = new Date(profile.trial_ends_at).getTime();
      return endsAt > Date.now();
    },
    build: ({ fullName, profile, stats }) => {
      const msRemaining = new Date(profile.trial_ends_at).getTime() - Date.now();
      const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      return trialExpiringDay7Email(fullName, {
        prospectsFound: stats.prospectsFound,
        emailsEnriched: stats.emailsEnriched,
        daysRemaining,
      });
    },
  },
  {
    key: 'final_demo_d14',
    daysSinceSignup: 14,
    label: 'J+14 Final demo',
    /**
     * On évite d'envoyer le push démo aux users déjà convertis (clients
     * payants) — ils n'ont pas besoin d'un CTA "réservez une démo".
     */
    isEligible: ({ profile }) => profile.plan === 'free' || !profile.trial_converted_at,
    build: ({ fullName }) => finalDemoDay14Email(fullName),
  },
];

/**
 * Calcule la borne supérieure (created_at <= to) pour un step à J+N.
 * Pas de borne inférieure : tout user créé il y a au moins N jours est éligible,
 * et l'idempotence est garantie par drip_emails_sent ? '<key>'.
 *
 * Voir le bloc FENÊTRE DE TIR plus haut pour la justification du changement.
 */
function windowForStep(daysSinceSignup) {
  const now = Date.now();
  const to = new Date(now - daysSinceSignup * 86400 * 1000).toISOString();
  return { to };
}

export async function GET(request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const startedAt = new Date().toISOString();
  const globalStats = { steps: {}, totalSent: 0, totalSkipped: 0, totalFailed: 0 };

  try {
    for (const step of DRIP_STEPS) {
      const stepStats = { eligible: 0, sent: 0, skipped: 0, failed: 0 };
      const { to } = windowForStep(step.daysSinceSignup);

      // 1. Fetch candidats : créés il y a au moins N jours, opt-in actif,
      //    pas encore destinataires de ce step précis (idempotence via jsonb ?).
      //    Le filtre `drip_emails_sent` côté SQL utilise l'opérateur jsonb `?`
      //    qui matche "la clé existe dans le tableau" (PostgreSQL natif).
      const { data: profiles, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, created_at, plan, trial_ends_at, trial_converted_at, drip_emails_sent, company_name')
        .eq('drip_emails_enabled', true)
        .lte('created_at', to)
        .not('drip_emails_sent', 'cs', `["${step.key}"]`);

      if (fetchError) {
        console.error(`[cron/drip] fetch error for ${step.key}:`, fetchError);
        globalStats.steps[step.key] = { ...stepStats, error: fetchError.message };
        continue;
      }

      console.log(`[cron/drip] ${step.label}: ${profiles?.length || 0} candidates`);

      for (const profile of profiles || []) {
        try {
          // Double-check côté JS : certains filtres jsonb peuvent rater des
          // edge cases. On revérifie qu'on n'a pas déjà envoyé.
          const already = Array.isArray(profile.drip_emails_sent)
            ? profile.drip_emails_sent.includes(step.key)
            : false;
          if (already) {
            stepStats.skipped++;
            continue;
          }

          // Critère d'éligibilité spécifique au step (trial actif, etc.)
          if (!step.isEligible({ profile })) {
            stepStats.skipped++;
            // On marque quand même la clé pour ne pas re-évaluer demain ce
            // même user (sinon il serait recalculé tous les jours sans fin).
            await markStepSent(supabase, profile.id, profile.drip_emails_sent, step.key);
            continue;
          }

          stepStats.eligible++;

          // Récupère l'email + le nom auth (les profils n'ont pas l'email).
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          if (!userData?.user?.email) {
            stepStats.skipped++;
            await markStepSent(supabase, profile.id, profile.drip_emails_sent, step.key);
            continue;
          }
          const email = userData.user.email;
          const fullName =
            userData.user.user_metadata?.full_name ||
            userData.user.user_metadata?.name ||
            null;
          const firstName = fullName ? fullName.split(' ')[0] : null;

          // Stats user (uniquement nécessaires pour J+7 trial expiring).
          // On les charge à la demande pour économiser des queries.
          let userStats = { prospectsFound: 0, emailsEnriched: 0 };
          if (step.key === 'trial_expiring_d7') {
            userStats = await fetchUserStats(supabase, profile.id);
          }

          const tpl = step.build({
            fullName: firstName || fullName,
            profile,
            stats: userStats,
          });

          const result = await sendEmail({
            to: email,
            subject: tpl.subject,
            html: tpl.html,
            tags: [
              { name: 'category', value: 'drip_onboarding' },
              { name: 'step', value: step.key },
            ],
          });

          if (result.success) {
            await markStepSent(supabase, profile.id, profile.drip_emails_sent, step.key);
            stepStats.sent++;
          } else {
            stepStats.failed++;
            console.warn(`[cron/drip] ${step.key} send failed for ${email}:`, result.error);
          }

          // Throttle Resend : 50ms = 20 emails/sec, safe pour le plan free.
          await new Promise((r) => setTimeout(r, 50));
        } catch (err) {
          stepStats.failed++;
          console.error(`[cron/drip] ${step.key} error for ${profile.id}:`, err);
        }
      }

      globalStats.steps[step.key] = stepStats;
      globalStats.totalSent += stepStats.sent;
      globalStats.totalSkipped += stepStats.skipped;
      globalStats.totalFailed += stepStats.failed;
    }

    const finishedAt = new Date().toISOString();
    console.log('[cron/drip] done', { startedAt, finishedAt, ...globalStats });
    return NextResponse.json({ ok: true, startedAt, finishedAt, ...globalStats });
  } catch (err) {
    console.error('[cron/drip] fatal:', err);
    return NextResponse.json({ error: 'fatal', details: err?.message }, { status: 500 });
  }
}

/**
 * Ajoute la step key au tableau drip_emails_sent du profil (idempotent).
 * On lit le tableau existant, on append si absent, on save. Évite la
 * concaténation jsonb naïve qui pourrait créer des doublons.
 */
async function markStepSent(supabase, userId, existing, stepKey) {
  const arr = Array.isArray(existing) ? existing : [];
  if (arr.includes(stepKey)) return;
  const next = [...arr, stepKey];
  await supabase
    .from('user_profiles')
    .update({ drip_emails_sent: next, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Compte les prospects récupérés et emails enrichis par l'user.
 * Utilisé pour personnaliser le J+7 trial expiring.
 */
async function fetchUserStats(supabase, userId) {
  try {
    const { count: prospectsFound } = await supabase
      .from('prospects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    const { count: emailsEnriched } = await supabase
      .from('prospects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('email', 'is', null);
    return {
      prospectsFound: prospectsFound || 0,
      emailsEnriched: emailsEnriched || 0,
    };
  } catch (err) {
    console.warn('[cron/drip] fetchUserStats failed:', err);
    return { prospectsFound: 0, emailsEnriched: 0 };
  }
}
