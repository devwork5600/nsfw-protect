import { Lightbulb, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeTabs } from '../_components/code-tabs';

export default function QuickstartPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1
            className="text-4xl font-heading font-bold tracking-tighter text-foreground"
            id="quickstart"
          >
            Quickstart Guide
          </h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            Get up and running with NSFWGuard in under 5 minutes. This guide walks you through
            generating an API key, making your first request, and interpreting the results.
          </p>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="step-1"
          >
            Step 1: Get Your API Key
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Navigate to your{' '}
            <Link href="/dashboard/api-keys" className="text-primary hover:underline">
              API Keys dashboard
            </Link>{' '}
            and click &quot;Generate New Key&quot;. Your key will only be shown once — store it
            securely
          </p>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="step-2"
          >
            Step 2: Make Your First Request
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>

          <CodeTabs
            tabs={[
              {
                label: 'cURL',
                code: `curl -X POST https://api.nsfw-protect.com/classify \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "image=@photo.jpg"`,
              },
              {
                label: 'Node.js',
                code: `import { readFile } from 'node:fs/promises';

const form = new FormData();
form.append('image', new Blob([await readFile('photo.jpg')], { type: 'image/jpeg' }), 'photo.jpg');

const response = await fetch('https://api.nsfw-protect.com/classify', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: form,
});

const data = await response.json();
console.log(data); // { status: 'done', result: [...] }`,
              },
            ]}
          />
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="step-3"
          >
            Step 3: Read the Response
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            The classification comes back directly in the response — one request, one result. The
            JSON body is identical whichever client you use; each label gets a score between 0 and
            1:
          </p>

          <CodeTabs
            tabs={[
              {
                label: 'Response',
                code: `{
  "status": "done",
  "result": [
    { "label": "nsfw", "score": 0.998 },
    { "label": "sfw", "score": 0.002 }
  ]
}`,
              },
            ]}
          />

          <div className="border border-primary/30 bg-card p-4 md:p-6 flex gap-4">
            <div className="mt-1">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading uppercase tracking-widest text-sm font-bold text-primary mb-1">
                Pro Tip
              </h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                Treat an image as NSFW when the{' '}
                <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                  nsfw
                </code>{' '}
                label&apos;s score exceeds 0.5 — that&apos;s the same threshold our own dashboard
                uses.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card p-4 md:p-6">
            <h3 className="font-heading uppercase tracking-widest text-sm font-bold text-foreground mb-1">
              Handling busy responses
            </h3>
            <p className="text-sm font-sans text-muted-foreground leading-relaxed">
              In rare cases (heavy load), the API answers{' '}
              <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                202
              </code>{' '}
              with{' '}
              <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                {'{ "status": "pending" }'}
              </code>{' '}
              instead of a result. You are not charged for that request — simply retry the same
              upload after a short delay. Note that a{' '}
              <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                202
              </code>{' '}
              passes checks like{' '}
              <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                response.ok
              </code>
              , so check for{' '}
              <code className="font-mono text-xs bg-muted text-primary px-1 border border-border">
                status === &quot;done&quot;
              </code>{' '}
              before reading the result.
            </p>
          </div>
        </div>

        {/* Pagination */}
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
                </span>
                <span className="font-heading font-bold text-sm">System Overview</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/keys" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Next
                </span>
                <span className="font-heading font-bold text-sm">API Keys</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
