import { Lightbulb, Link as LinkIcon, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
            securely.
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

          <div className="rounded-none border-border border bg-[#111112] overflow-hidden">
            <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 justify-between">
              <span className="text-xs font-heading uppercase tracking-widest text-muted-foreground font-bold text-primary">
                cURL
              </span>
              <Copy className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
            <pre className="p-4 font-mono text-sm text-muted-foreground overflow-x-auto leading-relaxed">
              <code className="block">
                <span className="text-secondary-foreground">curl</span> -X POST
                https://api.nsfwguard.com/classify \
              </code>
              <code className="block">
                {' '}
                -H <span className="text-green-400">&quot;X-API-Key: YOUR_API_KEY&quot;</span> \
              </code>
              <code className="block">
                {' '}
                -F <span className="text-green-400">&quot;image=@photo.jpg&quot;</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="step-3"
          >
            Step 3: Poll for Results
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            The classify endpoint returns a{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              jobId
            </code>
            . Poll the result endpoint to retrieve the classification:
          </p>

          <div className="rounded-none border-border border bg-[#111112] overflow-hidden">
            <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 justify-between">
              <span className="text-xs font-heading uppercase tracking-widest text-muted-foreground font-bold text-primary">
                cURL
              </span>
              <Copy className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
            <pre className="p-4 font-mono text-sm text-muted-foreground overflow-x-auto leading-relaxed">
              <code className="block">
                <span className="text-secondary-foreground">curl</span>{' '}
                https://api.nsfwguard.com/result/YOUR_JOB_ID
              </code>
            </pre>
          </div>

          <div className="border border-primary/30 bg-primary/5 p-4 md:p-6 flex gap-4">
            <div className="mt-1">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-heading uppercase tracking-widest text-sm font-bold text-primary mb-1">
                Pro Tip
              </h4>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                Results are cached in Redis for 1 hour. For high-throughput applications, consider
                implementing a webhook callback instead of polling.
              </p>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs" className="flex-1">
            <Button
              variant="outline"
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
              variant="outline"
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

      {/* Right Table of Contents */}
      <div className="hidden xl:block w-64 shrink-0 sticky top-24">
        <div className="mb-4 text-xs font-heading font-bold uppercase tracking-widest text-foreground px-4 border-l-2 border-primary">
          On This Page
        </div>
        <nav className="flex flex-col space-y-1">
          <a
            href="#quickstart"
            className="text-sm font-sans text-primary hover:text-primary px-4 py-1.5 border-l-2 border-primary transition-colors bg-primary/5"
          >
            Quickstart
          </a>
          <a
            href="#step-1"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Get Your API Key
          </a>
          <a
            href="#step-2"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            First Request
          </a>
          <a
            href="#step-3"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Poll for Results
          </a>
        </nav>
      </div>
    </div>
  );
}
