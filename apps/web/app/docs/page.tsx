import { Lightbulb, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeTabs } from './_components/code-tabs';

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
            sensitive content in real-time. Whether you&apos;re building a social platform, a
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
            All API requests must include your organization&apos;s unique API key in the{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              X-API-Key
            </code>{' '}
            header. You can manage and rotate keys in your{' '}
            <Link href="/dashboard/keys" className="text-primary hover:underline">
              Security Dashboard
            </Link>
            .
          </p>

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
                code: `const form = new FormData();
form.append('image', imageFile);

const response = await fetch('https://api.nsfw-protect.com/classify', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: form,
});

const data = await response.json();
console.log(data);`,
              },
            ]}
          />
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
            The API responds with the classification directly: a{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              result
            </code>{' '}
            array scoring each label between 0 and 1. A score closer to{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              1.0
            </code>{' '}
            on the{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              nsfw
            </code>{' '}
            label indicates a high probability of sensitive content.
          </p>

          <div className="border border-primary/30 bg-card p-4 md:p-6 flex gap-4">
            <div className="mt-1">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading uppercase tracking-widest text-sm font-bold text-primary mb-1">
                Pro Tip
              </h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                Images are automatically resized to 224×224 before analysis, so there&apos;s no need
                to preprocess them on your side.
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
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-end gap-4">
          <Link href="/docs/quickstart" className="w-full md:w-auto md:min-w-72">
            <Button
              variant="card"
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
      </div>
    </div>
  );
}
