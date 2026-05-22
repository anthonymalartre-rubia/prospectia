// Helpers pour créer/appliquer des coupons Stripe — utilisé par le programme
// de parrainage pour convertir referral_bonus_months en réduction réelle.
//
// Stratégie : pour chaque mois bonus à appliquer, on crée un coupon
// "100% off pour 1 invoice" et on l'applique au customer Stripe (ou à
// son prochain checkout). Le compteur referral_bonus_months est décrémenté
// à mesure que les coupons sont appliqués.
//
// Alternative possible (non implémentée ici) : utiliser Stripe Customer
// Balance — créditer le solde du customer en centimes. Plus propre mais
// nécessite plus de logique pour gérer les changements de plan.

import Stripe from 'stripe';
import { cleanEnv } from './envClean';
import { getSupabaseAdmin } from './supabase-admin';

function getStripe() {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
}

/**
 * Crée un coupon Stripe "100% off pour 1 facture" et l'attache au customer
 * indiqué. Décrémente le compteur referral_bonus_months.
 *
 * Returns: { ok, coupon_id?, error? }
 */
export async function applyReferralBonusToCustomer(userId) {
  if (!userId) return { ok: false, error: 'missing userId' };
  const supabase = getSupabaseAdmin();

  // Récupère le user_profile + stripe_customer_id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, stripe_customer_id, referral_bonus_months')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'profile not found' };
  if (!profile.stripe_customer_id) return { ok: false, error: 'no Stripe customer (user pas encore payant)' };
  if (!profile.referral_bonus_months || profile.referral_bonus_months <= 0) {
    return { ok: false, error: 'no bonus to apply' };
  }

  const stripe = getStripe();

  try {
    // 1. Crée un coupon "100% off, durée 1 mois"
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'repeating',
      duration_in_months: 1,
      name: `Parrainage Prospectia — ${profile.referral_bonus_months} mois bonus`,
      metadata: {
        source: 'referral_bonus',
        user_id: userId,
        bonus_months_consumed: '1',
      },
    });

    // 2. Attache au customer (sera utilisé sur la prochaine facture)
    await stripe.customers.update(profile.stripe_customer_id, {
      coupon: coupon.id,
    });

    // 3. Décrémente le compteur bonus
    await supabase
      .from('user_profiles')
      .update({ referral_bonus_months: profile.referral_bonus_months - 1 })
      .eq('id', userId);

    return {
      ok: true,
      coupon_id: coupon.id,
      remaining_bonus_months: profile.referral_bonus_months - 1,
    };
  } catch (err) {
    console.error('[stripe-coupons] applyReferralBonusToCustomer error', err);
    return { ok: false, error: err.message };
  }
}
