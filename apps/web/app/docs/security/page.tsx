import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DocsSecurityPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-bold tracking-tighter text-foreground">
            Security
          </h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            NSFWGuard is built with a privacy-first architecture. All data is encrypted in transit,
            processed in volatile memory, and purged immediately after classification.
          </p>
        </div>
        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground"
            id="encryption"
          >
            Encryption
          </h2>
          <ul className="list-disc pl-6 text-muted-foreground font-sans space-y-2 marker:text-primary">
            <li>All API traffic is encrypted using TLS 1.3</li>
            <li>API keys are hashed with SHA-256 — we never store raw keys</li>
            <li>Database connections use SSL with certificate verification</li>
          </ul>
        </div>
        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground"
            id="data-handling"
          >
            Data Handling
          </h2>
          <ul className="list-disc pl-6 text-muted-foreground font-sans space-y-2 marker:text-primary">
            <li>Images are resized to 224×224 in memory and processed immediately</li>
            <li>Temporary files are deleted after classification</li>
            <li>Results are stored in Redis with a 1-hour TTL, then purged</li>
            <li>We do not store image content — only metadata for billing</li>
          </ul>
        </div>
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/keys" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
                </span>
                <span className="font-heading font-bold text-sm">API Keys</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/image" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Next
                </span>
                <span className="font-heading font-bold text-sm">Image Analysis</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
