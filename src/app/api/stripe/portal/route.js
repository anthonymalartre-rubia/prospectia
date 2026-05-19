import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/lib/auth';

function getStripe() {
  // .trim() critique cf. /api/stripe/checkout : un \n résiduel dans la clé
  // collée depuis le dashboard Vercel cause "StripeConnectionError" opaque.
  return new Stripe(process.env.STRIPE_SECRET_KEY?.trim(), {
    maxNetworkRetries: 1,
    timeout: 15000,
  });
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[stripe/portal] STRIPE_SECRET_KEY missing');
      return NextResponse.json(
        { error: 'Configuration Stripe manquante (STRIPE_SECRET_KEY). Contactez le support.' },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Pas d'abonnement actif" }, { status: 400 });
    }

    const origin = request.headers.get('origin')
      || process.env.NEXT_PUBLIC_APP_URL
      || 'https://prospectia.cloud';

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/portal] error:', {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      raw: err?.raw,
    });
    const isStripeError = err?.type?.startsWith('Stripe');
    return NextResponse.json(
      {
        error: isStripeError
          ? `Stripe : ${err.message}`
          : `Erreur portal : ${err?.message || 'inconnue'}`,
        code: err?.code,
        type: err?.type,
      },
      { status: 500 }
    );
  }
}
