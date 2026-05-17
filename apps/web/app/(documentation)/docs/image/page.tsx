import { Link as LinkIcon, Copy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsImagePage() {
  return (
    <div className="flex flex-col xl:flex-row gap-12 items-start relative max-w-6xl mx-auto">
      <div className="flex-1 w-full xl:max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-bold tracking-tighter text-foreground">Image Analysis</h1>
          <p className="text-lg text-muted-foreground font-sans leading-relaxed">
            The image classification endpoint accepts JPEG, PNG, and WebP files up to 10MB. Images are resized to 224×224 and analyzed by our neural detection model.
          </p>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold tracking-tighter text-foreground" id="endpoint">Endpoint</h2>
          <div className="rounded-none border-border border bg-[#111112] overflow-hidden">
            <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4">
              <span className="text-xs font-heading uppercase tracking-widest text-primary font-bold">POST /classify</span>
            </div>
            <pre className="p-4 font-mono text-sm text-muted-foreground overflow-x-auto leading-relaxed">
              <code className="block">Content-Type: multipart/form-data</code>
              <code className="block">X-API-Key: your_api_key</code>
              <code className="block mt-2">Body: image (file)</code>
            </pre>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold tracking-tighter text-foreground" id="response">Response</h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Returns a <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">jobId</code> immediately. Poll <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">GET /result/:jobId</code> for classification results containing labels and confidence scores.
          </p>
        </div>
        <div className="pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <Link href="/docs/security" className="flex-1">
            <Button variant="outline" className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Previous</span>
                <span className="font-heading font-bold text-sm">Security</span>
              </div>
            </Button>
          </Link>
          <Link href="/docs/video" className="flex-1">
            <Button variant="outline" className="w-full h-16 justify-between rounded-none border-border group hover:border-primary transition-colors flex-row-reverse text-right">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Next</span>
             
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
