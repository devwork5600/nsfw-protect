'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, RotateCcw, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { generateApiKey, generateAdminMagicKey } from '@/actions/api-key-actions';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface ApiKey {
  id: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revoked: boolean;
  name?: string;
}

interface ApiKeyClientProps {
  initialKeys: ApiKey[];
  isAdmin?: boolean;
}

export function ApiKeyClient({ initialKeys, isAdmin }: ApiKeyClientProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMagic, setIsGeneratingMagic] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleGenerate = async (magic: boolean = false) => {
    if (!magic && keys.length > 0) {
      if (
        !confirm(
          'Generating a new default key will invalidate your existing default key. Do you want to continue?',
        )
      ) {
        return;
      }
    }

    if (magic) setIsGeneratingMagic(true);
    else setIsGenerating(true);

    try {
      const key = magic ? await generateAdminMagicKey() : await generateApiKey();
      setNewKey(key);
      setShowKey(true);
      toast.success(`${magic ? 'Magic' : 'New'} API key generated successfully!`);

      if (keys.length === 0 || magic) {
        setKeys((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            keyPrefix: key.substring(0, 7),
            createdAt: new Date(),
            lastUsedAt: null,
            revoked: false,
            name: magic ? 'Magic Unlimited Key' : 'Default Key',
          },
        ]);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate API key');
    } finally {
      setIsGenerating(false);
      setIsGeneratingMagic(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const activeKey = keys.find((k) => !k.revoked && k.name !== 'Magic Unlimited Key');
  const magicKeys = keys.filter((k) => !k.revoked && k.name === 'Magic Unlimited Key');

  return (
    <div className="space-y-6">
      {newKey && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your New API Key</CardTitle>
                <CardDescription className="text-destructive font-semibold">
                  Copy this key now. You won't be able to see it again!
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Newly Generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={newKey}
                  type={showKey ? 'text' : 'password'}
                  className="pr-10 font-mono"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <Button onClick={() => copyToClipboard(newKey)}>
                <Copy className="size-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-md border">
              <AlertTriangle className="size-4 text-warning" />
              <span>
                Keep this key secret. If you lose it, you will need to generate a new one, which
                will invalidate this one.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              <CardTitle>Admin Magic Keys</CardTitle>
            </div>
            <CardDescription>
              Create "Magic" API keys with no limits. These are for personal use and home page
              testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {magicKeys.length > 0 && (
              <div className="space-y-2">
                {magicKeys.map((key, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg bg-background"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Magic Key {i + 1}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Prefix: {key.keyPrefix}••••••••••••••••
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-200 bg-amber-50"
                    >
                      Unlimited
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => handleGenerate(true)}
                disabled={isGeneratingMagic}
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
              >
                {isGeneratingMagic ? 'Generating...' : 'Generate Magic Key'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Management</CardTitle>
          <CardDescription>
            {activeKey
              ? 'You have an active API key. You can rotate it if needed.'
              : "You don't have an active API key yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeKey && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Active Key</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Prefix: {activeKey.keyPrefix}••••••••••••••••
                </p>
                <p className="text-xs text-muted-foreground">
                  Created on {new Date(activeKey.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Active
              </Badge>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              variant={activeKey ? 'outline' : 'default'}
            >
              {isGenerating ? (
                'Generating...'
              ) : activeKey ? (
                <>
                  <RotateCcw className="size-4 mr-2" />
                  Rotate API Key
                </>
              ) : (
                'Generate API Key'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
