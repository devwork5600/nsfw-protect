import { Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DocsKeysPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1
            className="text-4xl font-heading font-bold tracking-tighter text-foreground"
            id="api-keys"
          >
            API Keys
          </h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            API keys are the primary method of authenticating requests to the NSFWGuard API. Each
            key is cryptographically generated and hashed for storage — the raw key is only
            displayed once during creation.
          </p>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="generating-keys"
          >
            Generating Keys
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Navigate to{' '}
            <Link href="/dashboard/api-keys" className="text-primary hover:underline">
              Dashboard → API Keys
            </Link>{' '}
            and click &quot;Generate New Key&quot;. When a new key is generated, all previously
            active keys are automatically revoked
          </p>
          <ul className="list-disc pl-6 text-muted-foreground font-sans space-y-2 marker:text-primary">
            <li>
              Keys use the format{' '}
              <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
                sk_&lt;48 hex chars&gt;
              </code>
            </li>
            <li>Only the first 7 characters (prefix) are stored in plaintext for identification</li>
            <li>The full key is hashed with SHA-256 before storage</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="using-keys"
          >
            Using Keys in Requests
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Include your API key in the{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              X-API-Key
            </code>{' '}
            header of every request:
          </p>
        </div>

        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground group flex items-center gap-2"
            id="key-rotation"
          >
            Key Rotation
            <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            We recommend rotating your API keys regularly. Generating a new key automatically
            revokes all previous keys. Revoked keys will immediately return{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              401 Unauthorized
            </code>
            .
          </p>
        </div>

        {/* Pagination */}
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/quickstart" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
                </span>
                <span className="font-heading font-bold text-sm">Quickstart</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/security" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Next
                </span>
                <span className="font-heading font-bold text-sm">Security</span>
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
            href="#api-keys"
            className="text-sm font-sans text-primary px-4 py-1.5 border-l-2 border-primary bg-primary/5"
          >
            API Keys
          </a>
          <a
            href="#generating-keys"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Generating Keys
          </a>
          <a
            href="#using-keys"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Using Keys
          </a>
          <a
            href="#key-rotation"
            className="text-sm font-sans text-muted-foreground hover:text-foreground px-4 py-1.5 border-l-2 border-transparent hover:border-border transition-colors"
          >
            Key Rotation
          </a>
        </nav>
      </div>
    </div>
  );
}
