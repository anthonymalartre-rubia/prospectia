import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { paymentSuccessEmail, subscriptionCancelledEmail } from '@/lib/emailTemplates';
import { PLANS } from '@/lib/plans';

function getStripe() {
  // .trim() critique : voir /api/stripe/checkout pour le contexte.
  return new Stripe(process.env.STRIPE_SECRET_KEY?.trim());
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET?.trim());
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ─── Idempotence (audit P0 #6) ────────────────────────────────────
  // Stripe retransmet régulièrement les webhooks (retry sur 4xx/5xx, replays).
  // Sans cette garde, un checkout.session.completed reçu 2x = 2 emails de
  // confirmation envoyés au client. Pire, un customer.subscription.deleted
  // retransmis après un nouvel abonnement = downgrade fantôme.
  //
  // On insère event.id dans une table avec PRIMARY KEY ; si l'insert échoue
  // sur conflit, l'event a déjà été traité → on renvoie 200 sans rien faire
  // (Stripe arrête de retry).
  const { error: idempotencyError } = await supabaseAdmin
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type });

  if (idempotencyError) {
    if (idempotencyError.code === '23505') {
      // duplicate key — event déjà traité, ack silencieusement
      console.log(`[webhook] Duplicate event ${event.id} (${event.type}), skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Autre erreur DB : on log mais on continue à traiter pour ne pas perdre
    // l'event. Le pire cas est un double-traitement qu'on cherchait à éviter,
    // mais ça reste mieux qu'un event perdu.
    console.error('[webhook] Idempotency insert failed (non-blocking):', idempotencyError);
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

        // Send payment success email
        try {
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          if (profile?.email) {
            const plan = PLANS[planId] || { name: planId, price: 0 };
            const template = paymentSuccessEmail(
              profile.full_name,
              plan.name,
              session.amount_total || plan.price
            );
            sendEmail({ to: profile.email, subject: template.subject, html: template.html })
              .catch((err) => console.error('[webhook] Payment email failed:', err));
          }
        } catch (emailErr) {
          console.error('[webhook] Payment email error:', emailErr);
        }
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
        .select('id, email, full_name')
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

        // Send subscription cancelled email
        if (data.email) {
          try {
            const template = subscriptionCancelledEmail(data.full_name);
            sendEmail({ to: data.email, subject: template.subject, html: template.html })
              .catch((err) => console.error('[webhook] Cancellation email failed:', err));
          } catch (emailErr) {
            console.error('[webhook] Cancellation email error:', emailErr);
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
