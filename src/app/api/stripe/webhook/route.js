import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use service role for webhook (no user session)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.supabase_user_id;
      const planId = session.metadata.plan_id;
      if (userId && planId) {
        await supabaseAdmin
          .from('user_profiles')
          .update({
            plan: planId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      // Handle subscription updates (e.g. plan changes, cancellation scheduled)
      // cancel_at_period_end being true means the user will downgrade at period end
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const { data } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (data) {
        await supabaseAdmin
          .from('user_profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
