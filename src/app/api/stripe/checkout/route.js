import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/lib/auth';
import { PLANS, getStripePriceId } from '@/lib/plans';
import { cleanEnv } from '@/lib/envClean';

function getStripe() {
  // cleanEnv : strip espaces, \n, et littéraux \n (2 chars) que Vercel UI
  // peut conserver après un copy-paste imparfait.
  return new Stripe(cleanEnv(process.env.STRIPE_SECRET_KEY), {
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

    const { planId, period: rawPeriod } = await request.json();
    const period = rawPeriod === 'yearly' ? 'yearly' : 'monthly';
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: `Plan inconnu : ${planId}` }, { status: 400 });
    }
    if (planId === 'free') {
      return NextResponse.json({ error: 'Le plan Starter est gratuit, pas besoin de checkout.' }, { status: 400 });
    }
    // Pick price ID selon la période (monthly = price, yearly = priceYearly)
    const stripePriceId = cleanEnv(getStripePriceId(planId, period));
    if (!stripePriceId) {
      const envVar = period === 'yearly'
        ? `STRIPE_${planId.toUpperCase()}_YEARLY_PRICE_ID`
        : `STRIPE_${planId.toUpperCase()}_PRICE_ID`;
      console.error(`[stripe/checkout] Missing ${envVar} for plan ${planId} (${period})`);
      return NextResponse.json(
        { error: `Tarif Stripe indisponible pour ${plan.name} (${period}). Variable ${envVar} à configurer.` },
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
      // idempotency_key : si le user double-clique ou que le réseau retry,
      // Stripe ne crée pas 2 customers pour le même user.
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { supabase_user_id: user.id },
        },
        { idempotencyKey: `customer-create-${user.id}` }
      );
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
      line_items: [{ price: stripePriceId, quantity: 1 }],
      // Carte uniquement — on désactive Klarna (incompatible avec les abos
      // récurrents), Amazon Pay (rare en B2B FR), et Link saved cards
      // (qui pré-affiche des cartes d'autres SaaS, source de confusion).
      // Pour réactiver Link plus tard : ['card', 'link'].
      payment_method_types: ['card'],
      success_url: `${origin}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?upgrade=cancelled`,
      // metadata sur la session : disponible dans checkout.session.completed
      metadata: { supabase_user_id: user.id, plan_id: planId, period },
      // subscription_data.metadata : ATTACHÉ À LA SUBSCRIPTION elle-même
      // → retrouvable dans tous les futurs events subscription.updated /
      //   subscription.deleted / invoice.payment_failed sans dépendre de la DB.
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_id: planId, period },
      },
      allow_promotion_codes: true,
      // Email de facturation Stripe directement à l'user
      customer_update: { address: 'auto', name: 'auto' },
      billing_address_collection: 'auto',
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
