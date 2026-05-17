import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, BarChart3, ImageIcon, Key, Zap } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUsageStats } from '@/actions/usage-actions';
import { getApiKeys } from '@/actions/api-key-actions';

export const dynamic = 'force-dynamic';

const DashboardPage = async () => {
  const stats = await getUsageStats();
  const apiKeys = await getApiKeys();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">Overview</h2>
          <p className="text-muted-foreground">Welcome to your NSFWGuard dashboard.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-sm font-bold border-primary text-primary bg-primary/5 uppercase tracking-widest">
          {stats.plan} Plan
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.usage.imageCount.toLocaleString()}</div>
            <div className="mt-4 h-2 w-full bg-primary/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.percentUsed}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.percentUsed.toFixed(1)}% of {stats.limit.toLocaleString()} monthly scans used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">NSFW Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{((stats.usage.nsfwDetections / (stats.usage.imageCount || 1)) * 100).toFixed(1)}%</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.usage.nsfwDetections.toLocaleString()} total detections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="size-3 bg-green-500 rounded-full animate-pulse" />
              <div className="text-2xl font-bold">Operational</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              API latency: ~120ms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/playground">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <ImageIcon className="size-4" />
                Test API
              </Button>
            </Link>
            <Link href="/dashboard/api-keys">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <Key className="size-4" />
                Manage Keys
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <BarChart3 className="size-4" />
                Upgrade Plan
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-green-500" />
              Security Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between items-center text-sm border-b pb-2">
               <span className="text-muted-foreground">Safe Images processed</span>
               <span className="font-bold text-green-600">{stats.usage.safeDetections.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm border-b pb-2">
               <span className="text-muted-foreground">NSFW content blocked</span>
               <span className="font-bold text-destructive">{stats.usage.nsfwDetections.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted-foreground">Active API Keys</span>
               <span className="font-bold">{apiKeys.length}</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
