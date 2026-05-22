// Helpers du programme de parrainage.
//
// Logique :
// - Chaque user a un referral_code unique (généré par trigger Postgres).
// - Quand quelqu'un signup avec ?ref=XXX, une ligne `referrals` est créée
//   en status 'pending' liée au parrain.
// - Quand le filleul devient payant (webhook Stripe), on passe à 'qualified'
//   et on accorde 1 mois bonus au parrain via referral_bonus_months.
// - Le user peut "consommer" ses bonus pour étendre la durée de son abonnement
//   (logique à implémenter dans /api/stripe/portal ou directement dans le
//   calcul de la prochaine facture — pour la v1 on stocke juste le compteur
//   et l'affiche dans le dashboard).

import { getSupabaseAdmin } from './supabase-admin';

/**
 * Récupère les stats parrainage d'un user.
 */
export async function getReferralStats(userId) {
  if (!userId) return null;
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('referral_code, referral_bonus_months')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return null;

  const { data: refs } = await supabase
    .from('referrals')
    .select('id, status, signed_up_at, qualified_at, referred_email')
    .eq('referrer_id', userId)
    .order('signed_up_at', { ascending: false });

  const list = refs || [];
  const stats = {
    code: profile.referral_code,
    total: list.length,
    pending: list.filter((r) => r.status === 'pending').length,
    qualified: list.filter((r) => r.status === 'qualified').length,
    rewarded: list.filter((r) => r.status === 'rewarded').length,
    bonus_months_earned: profile.referral_bonus_months || 0,
  };

  return { stats, referrals: list };
}

/**
 * Crée une entrée de tracking quand un user signup avec un code de parrainage.
 * Appelé depuis /api/referrals/track après la création du user.
 *
 * Sécurité : on vérifie que :
 *  - le code existe
 *  - le filleul ≠ parrain (anti-fraude)
 *  - le filleul n'a pas déjà un parrain (idempotent)
 */
export async function trackReferralSignup({ referrerCode, referredUserId, referredEmail }) {
  if (!referrerCode || !referredUserId) {
    return { ok: false, error: 'missing args' };
  }
  const supabase = getSupabaseAdmin();

  // 1. Trouver le parrain
  const { data: referrer } = await supabase
    .from('user_profiles')
    .select('id, referral_code')
    .eq('referral_code', referrerCode)
    .maybeSingle();

  if (!referrer) return { ok: false, error: 'invalid code' };
  if (referrer.id === referredUserId) return { ok: false, error: 'self-referral' };

  // 2. Check si déjà une referral pour ce filleul (idempotent)
  const { data: existing } = await supabase
    .from('referrals')
    .select('id, status')
    .eq('referred_id', referredUserId)
    .maybeSingle();

  if (existing) return { ok: true, already_tracked: true, status: existing.status };

  // 3. Update le user_profile pour stocker le code parrain (traçabilité)
  await supabase
    .from('user_profiles')
    .update({ referred_by_code: referrerCode })
    .eq('id', referredUserId);

  // 4. Créer la referral en pending
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: referredUserId,
      referred_email: referredEmail || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, referral: data };
}

/**
 * Qualifie une referral quand le filleul devient payant (webhook Stripe).
 * Accorde 1 mois bonus au parrain ET au filleul (double-side incentive).
 *
 * Appelé depuis /api/stripe/webhook après checkout.session.completed.
 */
export async function qualifyReferral(referredUserId) {
  if (!referredUserId) return { ok: false, error: 'missing id' };
  const supabase = getSupabaseAdmin();

  // Trouve la referral en pending pour ce filleul
  const { data: ref } = await supabase
    .from('referrals')
    .select('id, referrer_id, status, reward_months')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!ref) return { ok: true, no_referral: true };

  const now = new Date().toISOString();
  const rewardMonths = ref.reward_months || 1;

  // 1. Marque la referral comme qualified
  await supabase
    .from('referrals')
    .update({ status: 'qualified', qualified_at: now })
    .eq('id', ref.id);

  // 2. Crédit PARRAIN (+rewardMonths)
  const { data: referrer } = await supabase
    .from('user_profiles')
    .select('referral_bonus_months')
    .eq('id', ref.referrer_id)
    .maybeSingle();

  const referrerBonus = (referrer?.referral_bonus_months || 0) + rewardMonths;
  await supabase
    .from('user_profiles')
    .update({ referral_bonus_months: referrerBonus })
    .eq('id', ref.referrer_id);

  // 3. Crédit FILLEUL (+1 mois en bonus de bienvenue — double-side incentive)
  const { data: referred } = await supabase
    .from('user_profiles')
    .select('referral_bonus_months')
    .eq('id', referredUserId)
    .maybeSingle();

  const referredBonus = (referred?.referral_bonus_months || 0) + 1;
  await supabase
    .from('user_profiles')
    .update({ referral_bonus_months: referredBonus })
    .eq('id', referredUserId);

  return {
    ok: true,
    referrer_id: ref.referrer_id,
    referred_id: referredUserId,
    referrer_new_bonus: referrerBonus,
    referred_new_bonus: referredBonus,
    referral_id: ref.id,
  };
}
