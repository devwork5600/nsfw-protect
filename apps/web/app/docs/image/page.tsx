import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeTabs } from '../_components/code-tabs';

export default function DocsImagePage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-bold tracking-tighter text-foreground">
            Image Analysis
          </h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            The image classification endpoint accepts JPEG, PNG, and WebP files up to 10MB. Images
            are resized to 224×224 and analyzed by our neural detection model.
          </p>
        </div>
        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground"
            id="endpoint"
          >
            Endpoint
          </h2>
          <CodeTabs
            tabs={[
              {
                label: 'cURL',
                code: `curl -X POST https://api.nsfw-protect.com/classify \\
  -H "X-API-Key: your_api_key" \\
  -F "image=@photo.jpg"`,
              },
              {
                label: 'Node.js',
                code: `const form = new FormData();
form.append('image', imageFile); // a File or Blob

const response = await fetch('https://api.nsfw-protect.com/classify', {
  method: 'POST',
  headers: { 'X-API-Key': 'your_api_key' },
  body: form,
});

const data = await response.json();`,
              },
            ]}
          />
        </div>
        <div className="space-y-6">
          <h2
            className="text-2xl font-heading font-bold tracking-tighter text-foreground"
            id="response"
          >
            Response
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            The classification is returned directly in the response, with a score between 0 and 1
            for each label:
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
          <p className="text-muted-foreground font-sans leading-relaxed">
            Under heavy load the API may instead answer{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              202
            </code>{' '}
            with{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              {'{ "status": "pending" }'}
            </code>
            . You are not charged for that request — retry the same upload after a short delay.
          </p>
        </div>
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/security" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
                </span>
                <span className="font-heading font-bold text-sm">Security</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/batch" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Next
                </span>
                <span className="font-heading font-bold text-sm">Batch Processing</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
