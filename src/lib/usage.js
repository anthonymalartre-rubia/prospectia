// src/lib/usage.js
import { getPlan, isLimitReached } from './plans';
import { sendEmail } from './email';
import { createNotification, NOTIF_TYPES } from './notifications';
import { usageWarningEmail, usageLimitReachedEmail } from './emailTemplates';
import { getEffectivePlan } from './trial';
import { getQuotaMemberIds } from './teams';
import { getSupabaseAdmin } from './supabase-admin';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcule l'usage cumulé d'une team (somme des usages individuels de chaque member)
 * pour le mois en cours. Si le user n'est pas dans une team, retourne son propre usage.
 *
 * @returns {Promise<{ searches: number, enrichments: number, exports: number, verifications: number }>}
 */
async function getTeamUsageSum(supabase, userId) {
  const memberIds = await getQuotaMemberIds(userId);
  const month = getCurrentMonth();

  if (memberIds.length <= 1) {
    // Pas de team → comportement classique
    return getUsage(supabase, userId);
  }

  const { data } = await supabase
    .from('usage_tracking')
    .select('searches, enrichments, exports, verifications')
    .in('user_id', memberIds)
    .eq('month', month);

  const sum = { searches: 0, enrichments: 0, exports: 0, verifications: 0 };
  (data || []).forEach((row) => {
    sum.searches += row.searches || 0;
    sum.enrichments += row.enrichments || 0;
    sum.exports += row.exports || 0;
    sum.verifications += row.verifications || 0;
  });
  return sum;
}

// Get or create usage record for current month
export async function getUsage(supabase, userId) {
  const month = getCurrentMonth();

  const { data } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  if (data) return data;

  // Create if not exists
  const { data: newData } = await supabase
    .from('usage_tracking')
    .insert({ user_id: userId, month })
    .select()
    .single();

  return newData || { searches: 0, enrichments: 0, exports: 0 };
}

// Get user plan
// Inclut le trial : un user en trial 14j voit son plan Pro renvoyé tant que
// trial_ends_at est dans le futur. À l'expiration (ou si converti déjà payant),
// on retombe sur profile.plan.
export async function getUserPlan(supabase, userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('plan, trial_plan, trial_started_at, trial_ends_at, trial_converted_at')
    .eq('id', userId)
    .single();

  return getPlan(getEffectivePlan(data));
}

// Check if user can perform an action
// Avant : 2 roundtrips séquentiels (getUserPlan puis getUsage) = ~300-600ms.
// Cumulé sur un waterfall de 80 prospects = 24-48s perdus. Maintenant en parallèle.
//
// Multi-utilisateurs (Business) : si l'user appartient à une team, on aggrège
// l'usage de tous les members. Le quota Business est partagé.
export async function checkLimit(supabase, userId, action) {
  const [plan, usage] = await Promise.all([
    getUserPlan(supabase, userId),
    getTeamUsageSum(supabase, userId),
  ]);
  const limit = plan.limits[`${action}_per_month`];
  const current = usage[action] || 0;

  return {
    allowed: !isLimitReached(limit, current),
    current,
    limit,
    plan: plan.id,
    remaining: limit === -1 ? -1 : Math.max(0, limit - current),
  };
}

// Increment usage counter and send warning emails if thresholds are crossed
export async function incrementUsage(supabase, userId, action, amount = 1) {
  const month = getCurrentMonth();

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('id, ' + action)
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  const previousCount = existing ? (existing[action] || 0) : 0;
  const newCount = previousCount + amount;

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ [action]: newCount, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, month, [action]: amount });
  }

  // ─── Usage warning emails ──────────────────────────────────────────────────
  // Send emails when crossing the 80% or 100% threshold.
  // We check that the previous count was below the threshold to avoid duplicates.
  try {
    const plan = await getUserPlan(supabase, userId);
    const limitKey = `${action}_per_month`;
    const limit = plan.limits[limitKey];

    // Skip for unlimited plans
    if (limit === -1) return;

    const prevPercent = Math.floor((previousCount / limit) * 100);
    const newPercent = Math.floor((newCount / limit) * 100);

    // Determine which threshold was just crossed
    let thresholdCrossed = null;
    if (newPercent >= 100 && prevPercent < 100) {
      thresholdCrossed = 100;
    } else if (newPercent >= 80 && prevPercent < 80) {
      thresholdCrossed = 80;
    }

    if (thresholdCrossed) {
      // ─── Fetch user email via auth.admin ─────────────────────────────────
      // user_profiles n'a PAS de colonne email / full_name (cf. schéma).
      // Avant on faisait .select('email, full_name') qui retournait null
      // sans erreur → email d'alerte jamais envoyé. On lit maintenant
      // depuis auth.users via le service role (pattern utilisé aussi
      // dans /api/cron/expire-trials et /api/cron/drip-onboarding).
      const supabaseAdmin = getSupabaseAdmin();
      const { data: { user: authUser } = {} } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.email;
      const fullName =
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        email?.split('@')[0] ||
        'utilisateur';

      if (email) {
        const limitType = action; // 'searches', 'enrichments', 'exports'
        let template;
        if (thresholdCrossed === 100) {
          template = usageLimitReachedEmail(fullName, plan.name, limitType);
        } else {
          template = usageWarningEmail(fullName, thresholdCrossed, plan.name, limitType);
        }
        sendEmail({ to: email, subject: template.subject, html: template.html })
          .catch((err) => console.error(`[usage] ${thresholdCrossed}% email failed:`, err));
      }

      // ─── In-app notification (en plus de l'email) ────────────────────────
      // L'utilisateur la verra dans le NotificationBell la prochaine fois
      // qu'il ouvre le dashboard, même s'il n'ouvre pas son mail.
      const actionLabel = {
        searches: 'recherches',
        enrichments: 'enrichissements',
        exports: 'exports',
      }[action] || action;

      if (thresholdCrossed === 100) {
        createNotification(userId, {
          type: NOTIF_TYPES.QUOTA_REACHED,
          title: `Quota ${actionLabel} atteint`,
          body: `Vous avez utilisé 100% de vos ${actionLabel} ce mois sur le plan ${plan.name}. Passez à un plan supérieur pour continuer.`,
          link: '/settings#plan',
          metadata: { action, plan: plan.name, threshold: 100 },
        }).catch((err) => console.error('[usage] notif 100% failed:', err));
      } else {
        createNotification(userId, {
          type: NOTIF_TYPES.QUOTA_WARNING,
          title: `Quota ${actionLabel} bientôt atteint (80%)`,
          body: `Plus que 20% disponible ce mois sur le plan ${plan.name}.`,
          link: '/settings#plan',
          metadata: { action, plan: plan.name, threshold: 80 },
        }).catch((err) => console.error('[usage] notif 80% failed:', err));
      }
    }
  } catch (emailErr) {
    // Never let email errors affect usage tracking
    console.error('[usage] Warning email error:', emailErr);
  }
}
