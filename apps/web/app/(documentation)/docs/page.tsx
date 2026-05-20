import { ChevronLeft, ChevronRight, Lightbulb, Link as LinkIcon, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      {/* Main Content Area */}
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1
            className="text-4xl font-heading font-bold tracking-tighter text-foreground"
            id="introduction"
          >
            System Overview
          </h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            NSFWGuard provides a high-performance, low-latency API designed to detect and filter
            sensitive content in real-time. Whether you're building a social platform, a
            marketplace, or an enterprise internal tool, our neural engine ensures safety without
            compromising user experience.
          </p>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="authentication"
          >
            Authentication
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            All API requests must include your organization's unique API key in the{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              X-API-Key
            </code>{' '}
            header. You can manage and rotate keys in your{' '}
            <Link href="/dashboard/keys" className="text-primary hover:underline">
              Security Dashboard
            </Link>
            .
          </p>

          <div className="rounded-none border-border border bg-[#111112] overflow-hidden group">
            <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 justify-between">
              <span className="text-xs font-heading uppercase tracking-widest text-muted-foreground font-bold text-primary">
                cURL Request
              </span>
              <Copy className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
            <pre className="p-4 font-mono text-sm text-muted-foreground overflow-x-auto leading-relaxed">
              <code className="block">
                <span className="text-secondary-foreground">curl</span> -X POST
                https://api.nsfw-protect.com/v2/analyze \
              </code>
              <code className="block">
                {' '}
                -H <span className="text-green-400">"X-API-Key: YOUR_API_KEY"</span> \
              </code>
              <code className="block">
                {' '}
                -H <span className="text-green-400">"Content-Type: application/json"</span> \
              </code>
              <code className="block">
                {' '}
                -d{' '}
                <span className="text-green-400">
                  '{'{'} "image_url": "https://example.com/image.jpg", "threshold": 0.85 {'}'}'
                </span>
              </code>
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="response-schema"
          >
            Response Schema
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            The API returns a JSON object containing detection scores across five main categories. A
            score closer to{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              1.0
            </code>{' '}
            indicates a high probability of sensitive content.
          </p>

          <div className="border border-primary/30 bg-primary/5 p-4 md:p-6 flex gap-4">
            <div className="mt-1">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-heading uppercase tracking-widest text-sm font-bold text-primary mb-1">
                Pro Tip
              </h4>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                Use our Webhooks feature to get asynchronous notifications for long-form video
                processing.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="error-handling"
          >
            Error Handling
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            In the event of an error, the API will return standard HTTP status codes along with a
            JSON response containing an error key and a message describing the issue in detail.
          </p>
        </div>

        {/* Pagination */}
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/intro" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
                </span>
                <span className="font-heading font-bold text-sm">Introduction</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/quickstart" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Next
                </span>
                <span className="font-heading font-bold text-sm">Quickstart Guide</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <footer className="pt-12 pb-4 text-xs font-heading uppercase tracking-widest text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
          <span>© {new Date().getFullYear()} NSFWGuard API. Secure. Private. Fast.</span>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </footer>
      </div>

      {/* Right Table of Contents (Sticky) */}
      <div className="hidden xl:block w-64 shrink-0 sticky top-24">
        <div className="mb-4 text-xs font-heading font-bold uppercase tracking-widest text-foreground px-4 border-l-2 border-primary">
          On This Page
        </div>
        <nav className="flex flex-col space-y-1">
          <a
            href="#introduction"
            className="text-sm font-sans text-primary hover:text-primary px-4 py-1.5 border-l-2 border-primary transition-colors bg-primary/5"
          >
            Introduction
          </a>
          <a
            href="#authentication"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Authentication
          </a>
          <a
            href="#response-schema"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Response Schema
          </a>
          <a
            href="#error-handling"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Error Handling
          </a>
        </nav>
      </div>
    </div>
  );
}
