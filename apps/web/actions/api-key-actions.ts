'use server';

import { getUser } from '@/lib/auth/auth-session';
import { prisma } from '@nsfw/db';
import { generateRawApiKey, hashApiKey, getPrefix } from '@/lib/api-keys';
import { revalidatePath } from 'next/cache';

export async function isSubscribed() {
  const user = await getUser();
  if (!user) return false;

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: {
          status: 'ACTIVE',
        },
      },
    },
  });

  return (customer?.subscriptions.length ?? 0) > 0;
}

export async function generateApiKey() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isAdmin = dbUser?.role === 'admin';

  if (!isAdmin) {
    const subscribed = await isSubscribed();
    if (!subscribed) {
      throw new Error('You must have an active subscription to generate an API key.');
    }
  }

  // Invalidate previous keys
  await prisma.apiKey.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  const rawKey = generateRawApiKey();
  const hashedKey = hashApiKey(rawKey);
  const prefix = getPrefix(rawKey);

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: isAdmin ? 'Admin Unlimited Key' : 'Default Key',
      keyPrefix: prefix,
      keyHash: hashedKey,
      environment: 'LIVE',
      isUnlimited: isAdmin,
      requestsPerMinute: isAdmin ? 100000 : 60,
    },
  });

  revalidatePath('/dashboard/api-keys');

  return rawKey; // Return raw key ONLY ONCE during generation
}

export async function generateAdminMagicKey() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== 'admin') {
    throw new Error('Only admins can generate magic keys.');
  }

  await prisma.apiKey.updateMany({
    where: { userId: user.id, name: 'Magic Unlimited Key', revoked: false },
    data: { revoked: true },
  });

  const rawKey = generateRawApiKey();
  const hashedKey = hashApiKey(rawKey);
  const prefix = getPrefix(rawKey);

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: 'Magic Unlimited Key',
      keyPrefix: prefix,
      keyHash: hashedKey,
      environment: 'LIVE',
      isUnlimited: true,
      requestsPerMinute: 1000000,
    },
  });

  revalidatePath('/dashboard/api-keys');

  return rawKey;
}

export async function getApiKeys() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.apiKey.findMany({
    where: { userId: user.id, revoked: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      revoked: true,
      isUnlimited: true,
    },
  });
}
