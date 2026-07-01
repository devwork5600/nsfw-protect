'use server';

import { getUser } from '@/lib/auth/auth-session';
import { prisma } from '@nsfw/db';

export async function getUsageStats() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const now = new Date();

  // Get current plan
  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  const plan = customer?.subscriptions[0]?.plan || 'FREE';

  const PLAN_LIMITS: Record<string, number> = {
    FREE: 1000,
    STARTER: 25000,
    PRO: 250000,
    ENTERPRISE: 1000000000,
  };

  const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  // Get usage records for this month
  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      userId: user.id,
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
  });

  const totalImageCount = usageRecords.reduce((sum, record) => sum + record.imageCount, 0);
  const totalNsfwDetections = usageRecords.reduce((sum, record) => sum + record.nsfwDetections, 0);
  const totalRequests = usageRecords.reduce((sum, record) => sum + record.requestCount, 0);

  return {
    plan,
    limit,
    usage: {
      imageCount: totalImageCount,
      nsfwDetections: totalNsfwDetections,
      requestCount: totalRequests,
      safeDetections: totalImageCount - totalNsfwDetections,
    },
    percentUsed: Math.min(100, (totalImageCount / limit) * 100),
    remaining: Math.max(0, limit - totalImageCount),
  };
}
