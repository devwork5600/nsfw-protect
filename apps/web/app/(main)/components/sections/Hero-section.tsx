import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="container mx-auto max-w-360 px-4 py-24 grid lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <Badge
          variant="outline"
          className="border-primary/50 text-primary uppercase font-heading tracking-widest rounded-none bg-primary/10 px-3 py-1"
        >
          v4.0 API is now live
        </Badge>
        <h1 className="text-5xl lg:text-7xl font-heading font-bold tracking-tighter leading-[1.1] text-foreground">
          The API that developers <span className="text-primary italic">actually</span> want to use
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-sans leading-relaxed">
          Integrate in minutes, protect forever with our military-grade content moderation
          infrastructure. Built for scale, optimized for latency.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="h-14 px-8 text-base font-heading font-bold tracking-widest uppercase  w-full sm:w-auto"
          >
            Start Building Free
          </Button>
          <Link href="/docs" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-heading tracking-widest uppercase  w-full"
            >
              Read the Docs
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden lg:overflow-visible">
        {/* The Code block Card representing 'Test our models' */}
        <Card className="rounded-none border-border bg-card shadow-2xl relative z-10 overflow-hidden group">
          <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
              <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
              <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
            </div>
            <div className="ml-4 text-xs font-mono text-muted-foreground">terminal // bash</div>
          </div>
          <CardContent className="p-6">
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto text-primary/80">
              <code className="block text-accent-foreground">
                <span className="text-muted-foreground">$</span> curl -X POST
                &quot;https://api.nsfw-protect.com/classify&quot; \
              </code>
              <code className="block ml-4">
                {' '}
                -H <span className="text-green-400">&quot;X-API-Key: $API_KEY&quot;</span> \
              </code>
              <code className="block ml-4">
                {' '}
                -F <span className="text-green-400">&quot;image=@image.jpg&quot;</span>
              </code>
              <code className="block mt-4 text-muted-foreground">{'{'}</code>
              <code className="block text-muted-foreground">
                {' '}
                &quot;status&quot;: <span className="text-green-400">&quot;done&quot;</span>,
              </code>
              <code className="block text-muted-foreground"> &quot;result&quot;: [</code>
              <code className="block text-muted-foreground">
                {' '}
                {'{'} &quot;label&quot;: <span className="text-destructive">&quot;nsfw&quot;</span>,
                &quot;score&quot;: <span className="text-primary">0.998</span> {'}'},
              </code>
              <code className="block text-muted-foreground">
                {' '}
                {'{'} &quot;label&quot;: <span className="text-green-400">&quot;sfw&quot;</span>,
                &quot;score&quot;: <span className="text-primary">0.002</span> {'}'}
              </code>
              <code className="block text-muted-foreground"> ]</code>
              <code className="block text-muted-foreground">{'}'}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HeroSection;
