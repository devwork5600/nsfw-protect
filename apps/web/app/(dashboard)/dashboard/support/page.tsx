import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy, MessageSquare, BookOpen, FileCode, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

import { FaTwitter, FaGithub } from 'react-icons/fa';

const SupportPage = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">Support</h2>
          <p className="text-muted-foreground">Get technical assistance and access resources.</p>
        </div>
        <Badge
          variant="outline"
          className="px-4 py-1 text-sm font-bold border-green-500 text-green-500 bg-green-500/5 uppercase tracking-widest"
        >
          Priority Support Active
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              Open a Support Ticket
            </CardTitle>
            <CardDescription>
              Our engineers typically respond within 4-8 hours for Starter/Pro plans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g. API Latency Issue" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option>Technical Issue</option>
                  <option>Billing Inquiry</option>
                  <option>Feature Request</option>
                  <option>General Question</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                className="min-h-[150px]"
              />
            </div>
            <Button className="w-full font-heading uppercase tracking-widest text-xs font-bold">
              Submit Ticket
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LifeBuoy className="size-5 text-primary" />
                Quick Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/docs"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
              >
                <BookOpen className="size-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Documentation</span>
              </Link>
              <Link
                href="/dashboard/integration"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
              >
                <FileCode className="size-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">API Reference</span>
              </Link>
              <Link
                href="/status"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
              >
                <AlertCircle className="size-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">System Status</span>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="size-5 text-primary" />
                Direct Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Prefer other channels? Reach us here:</p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full">
                  <FaTwitter className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <FaGithub className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Mail className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary uppercase tracking-tighter italic">
            Enterprise Support
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Need a dedicated support engineer, custom SLA, or on-premise deployment assistance? Our
            Enterprise tier includes 24/7 phone support and a private Slack channel.
          </p>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 font-heading uppercase tracking-widest text-[10px] font-bold h-10 px-8 shrink-0"
          >
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
