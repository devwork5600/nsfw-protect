'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, History, AlertTriangle, GlobeIcon, Share2, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SecurityPage() {
  const handleEnable2FA = () => {
    toast.info('Two-factor authentication setup is coming soon!');
  };

  return (
    <div className="container mx-auto py-10 space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">Security</h2>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="size-5 text-primary" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Manage your social providers and authentication methods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white/2 border-white/10">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-xs">Google Account</p>
                  <p className="text-sm text-muted-foreground">Connected via OAuth 2.0</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-green-500 border-green-500/30 uppercase tracking-widest text-[10px]"
              >
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-white/2 border-white/10">
              <div className="flex items-center gap-3">
                <Mail className="size-8 p-1.5 rounded-full bg-white/10 text-muted-foreground" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-xs">Magic Link</p>
                  <p className="text-sm text-muted-foreground">Passwordless email authentication</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-green-500 border-green-500/30 uppercase tracking-widest text-[10px]"
              >
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5 border-primary/20">
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-wider text-xs">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  Use an app like Google Authenticator or Authy.
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-muted-foreground border-muted-foreground/30 uppercase tracking-widest text-[10px]"
              >
                Disabled
              </Badge>
            </div>
            <Button
              onClick={handleEnable2FA}
              variant="outline"
              className="font-heading uppercase tracking-widest text-xs font-bold w-full"
            >
              Enable 2FA
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              Recent Login Activity
            </CardTitle>
            <CardDescription>Monitor recent access to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm border-b pb-4">
                <div className="flex items-center gap-3">
                  <GlobeIcon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Chrome on Windows</p>
                    <p className="text-xs text-muted-foreground">
                      San Francisco, USA • 192.168.1.1
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Current Session</p>
                  <p className="text-xs text-green-500 font-bold uppercase tracking-widest">
                    Active Now
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Safari on iPhone</p>
                    <p className="text-xs text-muted-foreground">
                      San Francisco, USA • 192.168.1.2
                    </p>
                  </div>
                </div>
                <div className="text-right text-muted-foreground">
                  <p>2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="size-5" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-600 space-y-2 leading-relaxed">
            <p>• Enable two-factor authentication to prevent unauthorized access.</p>
            <p>• Review your API keys regularly and revoke any that are no longer in use.</p>
            <p>• Ensure your recovery email is up to date in your social provider settings.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
