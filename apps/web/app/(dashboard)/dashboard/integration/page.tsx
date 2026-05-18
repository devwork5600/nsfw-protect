'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Code2, Copy, BookOpen, Key, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { toast } from 'sonner';

export default function IntegrationPage() {
  const curlCode = `curl -X POST https://api.nsfwguard.com/v1/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "webhook": "https://your-site.com/webhooks/nsfw"
  }'`;

  const nodeCode = `const response = await fetch('https://api.nsfwguard.com/v1/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg'
  })
});

const result = await response.json();
console.log(result.isSafe); // true/false`;

  const pythonCode = `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'imageUrl': 'https://example.com/image.jpg'
}

response = requests.post(
    'https://api.nsfwguard.com/v1/verify', 
    headers=headers, 
    json=data
)

print(response.json())`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="container mx-auto py-10 space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">
            Integration Guide
          </h2>
          <p className="text-muted-foreground">
            Implement NSFWGuard into your application in minutes.
          </p>
        </div>
        <Link href="/docs" target="_blank">
          <Button variant="outline" className="gap-2">
            <BookOpen className="size-4" />
            Full Documentation
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="size-5 text-primary" />
              API Implementation
            </CardTitle>
            <CardDescription>
              Choose your preferred language to see integration examples.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="node">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <div className="relative group">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                    <code>{curlCode}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(curlCode)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="node">
                <div className="relative group">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                    <code>{nodeCode}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(nodeCode)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="python">
                <div className="relative group">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                    <code>{pythonCode}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(pythonCode)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-5 text-primary" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All API requests must include your API key in the Authorization header.
            </p>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
              <code className="text-xs break-all">Authorization: Bearer YOUR_API_KEY</code>
            </div>
            <Link href="/dashboard/api-keys">
              <Button
                variant="link"
                className="px-0 text-primary h-auto font-bold uppercase tracking-widest text-[10px]"
              >
                Get your API Key &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="size-5 text-green-500" />
              Integration Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm">
                <Badge
                  variant="outline"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-green-500 text-green-500"
                >
                  1
                </Badge>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]">Generate API Key</p>
                  <p className="text-muted-foreground">
                    Create a live key for production environments.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <Badge
                  variant="outline"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-green-500 text-green-500"
                >
                  2
                </Badge>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]">
                    Configure Webhooks
                  </p>
                  <p className="text-muted-foreground">
                    Set up endpoints to receive real-time detection alerts.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <Badge
                  variant="outline"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-muted-foreground text-muted-foreground"
                >
                  3
                </Badge>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]">
                    Implement Client Library
                  </p>
                  <p className="text-muted-foreground">
                    Use our SDKs for enhanced performance and security.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="size-5 text-primary" />
              Endpoint Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">POST</Badge>
                <code className="text-sm font-bold">/v1/verify</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Main endpoint for image and video frame analysis.
              </p>
            </div>
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-sm font-bold">/v1/usage</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Retrieve your current quota and usage statistics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
