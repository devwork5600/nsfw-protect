import type Stripe from 'stripe';
import { prisma } from '@nsfw/db';
import { stripe, getSubscriptionPeriod } from './helpers';
import { sendPlanUpdatedEmail } from './emails';

const STATUS_MAP: Record<
  string,
  'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'UNPAID'
> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'CANCELED',
  unpaid: 'UNPAID',
  paused: 'UNPAID',
};

export async function upsertSubscription(stripeSub: Stripe.Subscription) {
  // Ensure we have the full subscription data
  let sub = stripeSub;
  if (!sub.items || !sub.items.data.length) {
    sub = await stripe.subscriptions.retrieve(stripeSub.id);
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const customer = await prisma.customer.findUnique({
    where: {
      stripeCustomerId: customerId,
    },
  });

  if (!customer) {
    console.warn(`[Stripe Webhook] No customer found for stripeCustomerId: ${customerId}`);
    return null;
  }

  const priceId = sub.items.data[0].price.id;

  let planTier: 'STARTER' | 'PRO' | 'FREE' = 'FREE';
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
    planTier = 'PRO';
  } else if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) {
    planTier = 'STARTER';
  }

  const mappedStatus = STATUS_MAP[sub.status];
  if (!mappedStatus) {
    console.warn(
      `[Stripe Webhook] Unmapped subscription status "${sub.status}", defaulting to CANCELED`,
    );
  }
  const subscriptionStatus = mappedStatus || 'CANCELED';
  const { start: currentPeriodStart, end: currentPeriodEnd } = getSubscriptionPeriod(sub);

  return await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: sub.id,
    },
    create: {
      customerId: customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plan: planTier,
      status: subscriptionStatus,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodStart,
      currentPeriodEnd,
    },
    update: {
      plan: planTier,
      status: subscriptionStatus,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });
}

export async function handleSubscriptionUpsert(stripeSub: Stripe.Subscription) {
  // Check if plan changed
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
    include: { customer: { include: { user: true } } },
  });

  // Once a subscription is CANCELED it's terminal — Stripe never reactivates a
  // canceled subscription object. Delivery order isn't guaranteed, so a
  // customer.subscription.updated event generated just before the cancellation
  // can still arrive after customer.subscription.deleted; don't let it
  // resurrect the row.
  if (existingSub?.status === 'CANCELED') {
    console.warn(
      `[Stripe Webhook] Ignoring stale subscription upsert for already-canceled subscription ${stripeSub.id}`,
    );
    return;
  }

  const newSub = await upsertSubscription(stripeSub);

  // New billing period started → unlock plan changes
  const { start: newPeriodStart } = getSubscriptionPeriod(stripeSub);
  if (existingSub && existingSub.currentPeriodStart.getTime() !== newPeriodStart.getTime()) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSub.id },
      data: { planChangedAt: null },
    });
  }

  if (existingSub && newSub && existingSub.plan !== newSub.plan && existingSub.customer.user) {
    await sendPlanUpdatedEmail(existingSub, newSub, stripeSub);
  }

  console.log(`[Stripe Webhook] Processed subscription upsert for ${stripeSub.id}`);
}

export async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: stripeSub.id,
    },
    data: {
      status: 'CANCELED',
    },
  });
  console.log(`[Stripe Webhook] Subscription ${stripeSub.id} canceled`);
}
