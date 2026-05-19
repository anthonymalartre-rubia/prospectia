import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/lib/auth';
import { PLANS } from '@/lib/plans';

function getStripe() {
  // .trim() est CRITIQUE : si l'env var a été collée avec un \n final dans
  // le dashboard Vercel (très facile à faire), le SDK envoie ce \n dans le
  // header Authorization → HTTP malformé → "StripeConnectionError" opaque.
  return new Stripe(process.env.STRIPE_SECRET_KEY?.trim(), {
    maxNetworkRetries: 1,
    timeout: 15000,
  });
}

export async function POST(request) {
  try {
    // Vérification précoce des env vars (cause #1 historique d'échec)
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[stripe/checkout] STRIPE_SECRET_KEY missing');
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

    const { planId } = await request.json();
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: `Plan inconnu : ${planId}` }, { status: 400 });
    }
    // Trim défensif : même fix que pour la clé secrète, le price ID peut
    // aussi avoir un \n résiduel collé depuis Stripe Dashboard.
    plan.stripePriceId = plan.stripePriceId?.trim();
    if (!plan.stripePriceId) {
      console.error(`[stripe/checkout] Missing STRIPE_${planId.toUpperCase()}_PRICE_ID env var for plan ${planId}`);
      return NextResponse.json(
        { error: `ID de prix Stripe manquant pour le plan ${plan.name}. Variable STRIPE_${planId.toUpperCase()}_PRICE_ID à configurer sur Vercel.` },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // URL de retour : on privilégie l'origin de la requête (suit le domaine
    // réel : prospectia.cloud, www., preview…) plutôt qu'une env var.
    const origin = request.headers.get('origin')
      || process.env.NEXT_PUBLIC_APP_URL
      || 'https://prospectia.cloud';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/dashboard?upgrade=cancelled`,
      metadata: { supabase_user_id: user.id, plan_id: planId },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Logue le détail complet côté serveur
    console.error('[stripe/checkout] error:', {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      raw: err?.raw,
      statusCode: err?.statusCode,
    });
    // Renvoie un message exploitable côté client (Stripe expose des messages
    // utilisateur-safe pour ses propres erreurs).
    const isStripeError = err?.type?.startsWith('Stripe');
    return NextResponse.json(
      {
        error: isStripeError
          ? `Stripe : ${err.message}`
          : `Erreur lors de la création de la session : ${err?.message || 'inconnue'}`,
        code: err?.code,
        type: err?.type,
      },
      { status: 500 }
    );
  }
}
