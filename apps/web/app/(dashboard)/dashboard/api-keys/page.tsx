"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, RotateCcw, Check, Eye, EyeOff, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Dummy data for API Keys
const DUMMY_KEYS = [
  { keyPrefix: "sk_live_a1b2", createdAt: new Date("2024-01-15"), name: "Default Key", revoked: false }
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(DUMMY_KEYS);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const isAdmin = false; // Set to true to see admin magic keys

  const handleGenerate = async () => {
    if (keys.length > 0) {
      if (!confirm("Generating a new default key will invalidate your existing default key. Do you want to continue?")) {
        return;
      }
    }

    setIsGenerating(true);

    // Simulate API call
    setTimeout(() => {
      const generatedKey = "sk_live_" + Math.random().toString(36).substring(2, 24);
      setNewKey(generatedKey);
      setShowKey(true);
      toast.success("New API key generated successfully!");
      
      setKeys([{ 
        keyPrefix: generatedKey.substring(0, 12), 
        createdAt: new Date(), 
        name: "Default Key",
        revoked: false
      }]);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const activeKey = keys.find(k => !k.revoked && k.name !== "Magic Unlimited Key");
  const magicKeys = keys.filter(k => !k.revoked && k.name === "Magic Unlimited Key");

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys to access the NSFW detection service.
          </p>
        </div>

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
                      type={showKey ? "text" : "password"}
                      className="pr-10 font-mono"
                    />
                    <button
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button onClick={() => copyToClipboard(newKey)}>
                    <Copy className="size-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-md border">
                  <AlertTriangle className="size-4 text-warning" />
                  <span>
                    Keep this key secret. If you lose it, you will need to generate a new one, which will invalidate this one.
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
                  Create "Magic" API keys with no limits. These are for personal use and home page testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {magicKeys.length > 0 && (
                  <div className="space-y-2">
                    {magicKeys.map((key, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Magic Key {i + 1}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Prefix: {key.keyPrefix}••••••••••••••••
                          </p>
                        </div>
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          Unlimited
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button 
                    disabled={true}
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
                  >
                    Generate Magic Key
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
                  ? "You have an active API key. You can rotate it if needed." 
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
                  onClick={() => handleGenerate()} 
                  disabled={isGenerating}
                  variant={activeKey ? "outline" : "default"}
                >
                  {isGenerating ? (
                    "Generating..."
                  ) : activeKey ? (
                    <>
                      <RotateCcw className="size-4 mr-2" />
                      Rotate API Key
                    </>
                  ) : (
                    "Generate API Key"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
