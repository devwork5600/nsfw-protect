import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as const;

export function formatPlanName(plan: string) {
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}

export function formatCurrency(amountInCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

export function formatBillingCycle(interval: Stripe.Price.Recurring.Interval | undefined) {
  if (interval === 'month') return 'Monthly';
  if (interval === 'year') return 'Yearly';
  return 'Recurring';
}

export function getDashboardUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.nsfw-protect.com';
}

// Stripe moved current_period_start/end off the Subscription object and onto
// each subscription item (confirmed for the API version this SDK is pinned
// to) — read the period from the first item, not the subscription itself.
export function getSubscriptionPeriod(sub: Stripe.Subscription): { start: Date; end: Date } {
  const item = sub.items.data[0];
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}
