'use client';

import { TrendingUp, ShieldCheck, ShieldAlert, BarChart3, ImageIcon } from 'lucide-react';
import { Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const chartConfig = {
  scans: {
    label: 'Scans',
  },
  safe: {
    label: 'Safe',
    color: 'hsl(var(--chart-1))',
  },
  nsfw: {
    label: 'NSFW',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface UsageStats {
  usage: {
    imageCount: number;
    safeDetections: number;
    nsfwDetections: number;
  };
  limit: number;
  plan: string;
  percentUsed: number;
  remaining: number;
}

export default function UsageClient({ stats }: { stats: UsageStats }) {
  const chartData = [
    { type: 'safe', scans: stats.usage.safeDetections, fill: 'var(--color-chart-1)' },
    { type: 'nsfw', scans: stats.usage.nsfwDetections, fill: 'var(--color-chart-2)' },
  ];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">
          Usage & Metering
        </h2>
        <p className="text-muted-foreground">Monitor your API consumption and scan limits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.imageCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all API keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Limit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.limit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Reset on the 1st of next month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NSFW Detections</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.nsfwDetections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.usage.nsfwDetections / (stats.usage.imageCount || 1)) * 100).toFixed(1)}% of
              total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Images</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.safeDetections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.usage.safeDetections / (stats.usage.imageCount || 1)) * 100).toFixed(1)}% of
              total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Detection Distribution</CardTitle>
            <CardDescription>Current Billing Period</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square min-h-[250px] max-h-[250px] w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="scans" label nameKey="type" />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Safe images represent{' '}
              {((stats.usage.safeDetections / (stats.usage.imageCount || 1)) * 100).toFixed(1)}% of
              traffic <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total detection breakdown for{' '}
              {new Date().toLocaleString('default', { month: 'long' })}
            </div>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plan Usage</CardTitle>
                <CardDescription>
                  You are on the{' '}
                  <Badge variant="secondary" className="font-bold">
                    {stats.plan}
                  </Badge>{' '}
                  plan.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats.percentUsed.toFixed(1)}%</span>
                <p className="text-xs text-muted-foreground">Used this month</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="h-4 w-full bg-accent rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  stats.percentUsed > 90
                    ? 'bg-destructive'
                    : stats.percentUsed > 70
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                }`}
                style={{ width: `${stats.percentUsed}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-1">
                  Quota Used
                </p>
                <p className="text-xl font-bold">{stats.usage.imageCount.toLocaleString()}</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-1">
                  Remaining
                </p>
                <p className="text-xl font-bold">{stats.remaining.toLocaleString()}</p>
              </div>
            </div>

            {stats.percentUsed > 80 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
                <ShieldAlert className="size-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Usage Alert</p>
                  <p>You have used over 80% of your monthly quota.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Plan limits reset on the 1st of every month.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
