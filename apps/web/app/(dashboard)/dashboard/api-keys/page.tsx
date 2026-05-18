import React from 'react';
import { getApiKeys, isSubscribed } from '@/actions/api-key-actions';
import { ApiKeyClient } from './api-keys-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/auth/auth-session';
import { prisma } from '@nsfw/db';

export default async function ApiKeysPage() {
  const user = await getUser();
  const dbUser = user ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
  const isAdmin = dbUser?.role === 'admin';

  const subscribed = await isSubscribed();
  const apiKeys = await getApiKeys();

  if (!subscribed && !isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              You need an active subscription to generate and use API keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/billing">
              <Button>Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys to access the NSFW detection service.
          </p>
        </div>

        <ApiKeyClient initialKeys={apiKeys} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
