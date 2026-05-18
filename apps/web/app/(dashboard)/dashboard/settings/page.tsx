'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Globe, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DUMMY_USER = {
  name: 'John Doe',
  email: 'john@example.com',
};

export default function SettingsPage() {
  const handleSave = () => {
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="container mx-auto py-10 space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and profile.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your account details and how others see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue={DUMMY_USER.name.split(' ')[0]}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  defaultValue={DUMMY_USER.name.split(' ')[1]}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input id="email" defaultValue={DUMMY_USER.email} disabled className="bg-muted" />
                <Badge
                  variant="outline"
                  className="flex items-center bg-green-500/10 text-green-500 border-green-500/20"
                >
                  Verified
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Email cannot be changed for security reasons.
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="font-heading uppercase tracking-widest text-xs font-bold"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label className="text-base">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about suspicious login attempts.
                </p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 size-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label className="text-base">Usage Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly summaries of your API activity.
                </p>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 size-4 bg-white rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions related to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="font-heading uppercase tracking-widest text-xs font-bold"
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
