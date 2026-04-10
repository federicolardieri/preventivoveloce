import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendSubscriptionConfirmation } from '@/lib/email';
import { logError } from '@/lib/logger';
import type Stripe from 'stripe';

const PLAN_BY_PRICE: Record<string, 'starter' | 'pro'> = {
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!]: 'starter',
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!]: 'starter',
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]: 'pro',
};

function getPlanFromSubscription(subscription: Stripe.Subscription): 'starter' | 'pro' | 'free' {
  const priceId = subscription.items.data[0]?.price.id;
  return PLAN_BY_PRICE[priceId] ?? 'free';
}

function getDurationDays(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  if (item?.current_period_start && item?.current_period_end) {
    return Math.round((item.current_period_end - item.current_period_start) / 86400);
  }
  // Fallback: 30 giorni per piani mensili
  return 30;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Firma mancante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.user_id;
        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Only activate if subscription is actually active
        if (subscription.status !== 'active' && subscription.status !== 'trialing') break;

        const plan = getPlanFromSubscription(subscription);
        const days = getDurationDays(subscription);

        await supabase.rpc('activate_plan', {
          p_user_id: userId,
          p_plan: plan,
          p_duration_days: days,
        });

        const periodEnd = subscription.items.data[0]?.current_period_end;
        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: userId,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          product_id: subscription.items.data[0]?.price.product as string,
          current_period_start: subscription.items.data[0]?.current_period_start
            ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
            : null,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        // Invia email di conferma solo per piani pagati
        if (plan !== 'free') {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          const email = authUser?.user?.email;
          if (email && periodEnd) {
            await sendSubscriptionConfirmation({
              to: email,
              plan,
              periodEnd: new Date(periodEnd * 1000),
            }).catch((err) => logError('stripe-webhook.confirmation-email', err));
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const plan = getPlanFromSubscription(subscription);
        const days = getDurationDays(subscription);

        if (subscription.status === 'active') {
          await supabase.rpc('activate_plan', {
            p_user_id: userId,
            p_plan: plan,
            p_duration_days: days,
          });
        }

        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: userId,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          product_id: subscription.items.data[0]?.price.product as string,
          current_period_start: subscription.items.data[0]?.current_period_start
            ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
            : null,
          current_period_end: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await supabase.rpc('activate_plan', {
          p_user_id: userId,
          p_plan: 'free',
          p_duration_days: 0,
        });

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // In API 2025-01-27 il subscription ID è sotto invoice.parent
        const invoiceAny = invoice as unknown as Record<string, unknown>;
        const parentDetails = invoiceAny?.parent as Record<string, unknown> | undefined;
        const subscriptionId = (parentDetails?.subscription_details as Record<string, unknown> | undefined)?.subscription as string | undefined;
        if (!subscriptionId) break;

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', subscriptionId);
        break;
      }
    }
  } catch (err) {
    logError('stripe-webhook', err, { event_type: event.type, event_id: event.id });
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
