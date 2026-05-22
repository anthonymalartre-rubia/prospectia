// POST /api/referrals/apply-bonus
// Applique 1 mois bonus à l'abonnement Stripe en cours.
// Crée un coupon dynamique (100% off, 1 mois) et l'attache au customer.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { applyReferralBonusToCustomer } from '@/lib/stripe-coupons';

export async function POST() {
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await applyReferralBonusToCustomer(user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
