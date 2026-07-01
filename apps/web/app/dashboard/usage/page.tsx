import React from 'react';
import { getUsageStats } from '@/actions/usage-actions';
import UsageClient from './usage-client';

export const dynamic = 'force-dynamic';

export default async function UsagePage() {
  const stats = await getUsageStats();

  return <UsageClient stats={stats} />;
}
