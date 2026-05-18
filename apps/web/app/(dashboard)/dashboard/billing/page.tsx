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
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE || 'price_free',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(),
  };

  return <BillingClient initialSubscription={subscription} />;
}
