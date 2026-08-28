'use server';

import Stripe from 'stripe';
import { getUser } from '@/lib/auth/auth-session';
import { prisma } from '@nsfw/db';
import { revalidatePath } from 'next/cache';
import { getPlanForPriceId, isAllowedPriceId, PLAN_ORDER } from '@/lib/stripe/helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export async function previewSubscriptionChange(priceId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  if (!isAllowedPriceId(priceId)) throw new Error('Invalid plan selected');

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!customer || !customer.subscriptions[0]) {
    throw new Error('No active subscription found');
  }

  const subscription = customer.subscriptions[0];

  // Retrieve upcoming invoice to see proration
  const prorationDate = Math.floor(Date.now() / 1000);

  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: customer.stripeCustomerId,
    subscription: subscription.stripeSubscriptionId,
    subscription_details: {
      items: [
        {
          id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0]
            .id,
          price: priceId,
        },
      ],
      proration_date: prorationDate,
    },
  });

  // Calculate the immediate amount to pay
  // This is the sum of the positive amounts in the upcoming invoice that relate to the current period
  // but simpler is to just look at the invoice total if we are using 'always_invoice'

  return {
    amount: upcomingInvoice.amount_due,
    currency: upcomingInvoice.currency,
    prorationDate,
  };
}

export async function manageSubscription(priceId: string | null, prorationDate?: number) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!customer) throw new Error('Customer not found');

  if (priceId !== null && !isAllowedPriceId(priceId)) throw new Error('Invalid plan selected');

  const subscription = customer.subscriptions[0];

  // If no active subscription, we should use createCheckoutSession instead
  if (!subscription) {
    throw new Error('No active subscription found to manage.');
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

  if (priceId !== null && priceId !== subscription.stripePriceId) {
    if (
      subscription.planChangedAt &&
      subscription.planChangedAt >= subscription.currentPeriodStart
    ) {
      const unlockDate = subscription.currentPeriodEnd.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      throw new Error(
        `You've already changed your plan this billing cycle. You can change again after ${unlockDate}.`,
      );
    }
  }

  if (priceId === null) {
    // CANCEL SUBSCRIPTION
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  } else {
    // UPGRADE OR DOWNGRADE
    const currentPriceId = subscription.stripePriceId;

    // If they are on the same plan, just ensure it's not set to cancel
    if (priceId === currentPriceId) {
      if (subscription.cancelAtPeriodEnd) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: false },
        });
      }
      return;
    }

    // Determine if it's an upgrade or downgrade by comparing tier order —
    // priceId is already validated against the self-serve allow-list above,
    // and a currentPriceId that isn't STARTER/PRO (e.g. no real subscription
    // yet) is treated as FREE, the bottom of the order.
    const newPlan = getPlanForPriceId(priceId) as 'STARTER' | 'PRO';
    const currentPlan = getPlanForPriceId(currentPriceId) ?? 'FREE';

    // Industry standard: Upgrades are invoiced immediately (always_invoice)
    // Downgrades can be invoiced at the end of the period (create_prorations or none)
    let prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior = 'always_invoice';

    const isUpgrade = PLAN_ORDER.indexOf(newPlan) > PLAN_ORDER.indexOf(currentPlan);

    if (!isUpgrade) {
      // Downgrade behavior:
      // Option A: "none" - Change happens now, no credit for unused time.
      // Option B: "create_prorations" - Change happens now, credit for unused time added to next invoice.
      // We'll use "always_invoice" for upgrades and "create_prorations" for downgrades to be fair.
      prorationBehavior = 'create_prorations';
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
      proration_date: prorationDate,
      // Ensure we don't cancel at period end if we are changing plans
      cancel_at_period_end: false,
    });

    // Update the database immediately so the UI reflects the change
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: newPlan,
        stripePriceId: priceId as string,
        cancelAtPeriodEnd: false,
        planChangedAt: new Date(),
      },
    });

    // Note: The database will also be synced by the customer.subscription.updated webhook for redundancy
  }

  revalidatePath('/dashboard/billing');
  revalidatePath('/billing');
}

export async function cancelSubscription() {
  return manageSubscription(null);
}
