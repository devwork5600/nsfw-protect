import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DocsBatchPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-heading font-bold tracking-tighter text-foreground">
              Batch Processing
            </h1>
            <Badge
              variant="outline"
              className="rounded-none border-primary/50 text-primary font-heading text-[10px] uppercase tracking-widest"
            >
              Coming Soon
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            Batch processing will allow you to submit multiple images in a single API call for
            asynchronous classification. Ideal for content moderation pipelines and bulk media
            imports.
          </p>
        </div>
        <div className="border border-primary/30 bg-card p-6 space-y-3">
          <h4 className="font-heading uppercase tracking-widest text-sm font-bold text-primary">
            Planned Features
          </h4>
          <ul className="list-disc pl-6 text-muted-foreground font-sans space-y-2 marker:text-primary text-sm">
            <li>Submit up to 100 images per batch request</li>
            <li>Webhook notification on batch completion</li>
            <li>CSV/JSON export of batch results</li>
            <li>Priority queue processing for Pro plans</li>
          </ul>
        </div>
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/image" className="flex-1">
            <Button
              variant="card"
              className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Previous
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
