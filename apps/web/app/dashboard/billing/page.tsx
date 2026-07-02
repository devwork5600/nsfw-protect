import React from 'react';
import { getUser } from '@/lib/auth/auth-session';
import { prisma } from '@nsfw/db';
import BillingClient from './billing-client';

export const dynamic = 'force-dynamic';

export default async function DashboardBillingPage() {
  const user = await getUser();
  if (!user) return null;

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  const subscription = customer?.subscriptions[0] || {
    plan: 'FREE',
    stripePriceId: 'free',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(),
    currentPeriodStart: new Date(),
    planChangedAt: null,
  };

  const plans = [
    {
      name: 'Free',
      priceId: 'free',
    },
    {
      name: 'Starter',
      priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter',
    },
    {
      name: 'Pro',
      priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro',
    },
  ];

  return <BillingClient initialSubscription={subscription} plansConfig={plans} />;
}
