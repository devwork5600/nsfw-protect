import * as React from 'react';
import type Stripe from 'stripe';
import { prisma } from '@nsfw/db';
import { sendEmail, SubscriptionSuccessTemplate, PlanUpdatedTemplate } from '@nsfw/email';
import {
  stripe,
  formatPlanName,
  formatCurrency,
  formatBillingCycle,
  getDashboardUrl,
  PLAN_ORDER,
} from './helpers';

type PlanChangeSubscription = {
  plan: string;
  customer: {
    user: {
      email: string;
      name: string | null;
      firstName: string | null;
    } | null;
  };
};

function displayName(user: { email: string; name: string | null; firstName: string | null }) {
  return user.name || user.firstName || user.email.split('@')[0];
}

export async function sendPlanUpdatedEmail(
  existingSub: PlanChangeSubscription,
  newSub: { plan: string },
  stripeSub: Stripe.Subscription,
) {
  const user = existingSub.customer.user;
  if (!user) return;

  try {
    const oldIndex = PLAN_ORDER.indexOf(existingSub.plan as (typeof PLAN_ORDER)[number]);
    const newIndex = PLAN_ORDER.indexOf(newSub.plan as (typeof PLAN_ORDER)[number]);

    let changeType: 'upgrade' | 'downgrade' | 'update' = 'update';
    if (newIndex > oldIndex) changeType = 'upgrade';
    else if (newIndex < oldIndex) changeType = 'downgrade';

    const dashboardUrl = getDashboardUrl();

    // Fetch the price details for the new plan
    const price = await stripe.prices.retrieve(stripeSub.items.data[0].price.id);
    const formattedPrice = `${formatCurrency(price.unit_amount || 0, price.currency)}${
      price.recurring?.interval === 'month'
        ? '/mo'
        : price.recurring?.interval === 'year'
          ? '/yr'
          : ''
    }`;

    // For downgrades, the "effective date" is usually the end of the current period
    const effectiveDate =
      changeType === 'downgrade'
        ? new Date(stripeSub.items.data[0].current_period_end * 1000).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

    await sendEmail({
      to: user.email,
      subject: `Plan ${changeType === 'upgrade' ? 'Upgraded' : changeType === 'downgrade' ? 'Downgraded' : 'Updated'} - NSFWGuard`,
      react: React.createElement(PlanUpdatedTemplate, {
        username: displayName(user),
        oldPlanName: formatPlanName(existingSub.plan),
        newPlanName: formatPlanName(newSub.plan),
        changeType,
        newPrice: formattedPrice,
        effectiveDate,
        dashboardUrl: `${dashboardUrl}/dashboard`,
      }),
    });
  } catch (emailErr) {
    console.error('[Stripe Webhook] Failed to send plan update email:', emailErr);
  }
}

export async function sendPaymentSuccessEmail(
  subscription: { id: string; customerId: string; plan: string; stripePriceId: string },
  stripeInvoice: Stripe.Invoice,
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: subscription.customerId },
      include: { user: true },
    });
    const user = customer?.user;
    if (!user) return;

    const amount = formatCurrency(
      stripeInvoice.amount_paid ?? stripeInvoice.total,
      stripeInvoice.currency,
    );
    const planName = formatPlanName(subscription.plan);

    // The invoice line item's own price field was removed from this API version,
    // so read the billing interval from the subscription's price instead.
    const price = await stripe.prices.retrieve(subscription.stripePriceId);
    const billingCycle = formatBillingCycle(price.recurring?.interval);

    await sendEmail({
      to: user.email,
      subject: `Payment Successful - Welcome to ${planName}`,
      react: React.createElement(SubscriptionSuccessTemplate, {
        username: displayName(user),
        planName,
        amount,
        billingCycle,
        dashboardUrl: getDashboardUrl(),
      }),
    });
  } catch (emailErr) {
    console.error('[Stripe Webhook] Failed to send payment confirmation email:', emailErr);
  }
}
