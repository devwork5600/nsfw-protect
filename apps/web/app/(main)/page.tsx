
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3Icon,
  GlobeIcon,
  ImageIcon,
  SearchIcon,
  ShieldIcon,
  ZapIcon,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Sections */}
        <section className="container mx-auto max-w-360 px-3 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Badge
              variant="outline"
              className="border-primary/50 text-primary uppercase font-heading tracking-widest rounded-none bg-primary/10 px-3 py-1"
            >
              v4.0 API is now live
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-heading font-bold tracking-tighter leading-[1.1] text-foreground">
              The API that developers{" "}
              <span className="text-primary italic">actually</span> want to use.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-sans leading-relaxed">
              Integrate in minutes, protect forever with our military-grade
              content moderation infrastructure. Built for scale, optimized for
              latency.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-heading font-bold tracking-widest uppercase rounded-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,245,255,0.5)]"
              >
                Start Building Free
              </Button>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-heading tracking-widest uppercase rounded-none border-border hover:bg-accent hover:text-primary hover:border-primary transition-all"
                >
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* The Code block Card representing 'Test our models' */}
            <Card className="rounded-none border-border bg-card shadow-2xl relative z-10 overflow-hidden group">
              <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
                  <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
                  <div className="w-3 h-3 bg-muted-foreground/30 rounded-none square"></div>
                </div>
                <div className="ml-4 text-xs font-mono text-muted-foreground">
                  terminal // bash
                </div>
              </div>
              <CardContent className="p-6">
                <pre className="font-mono text-sm leading-relaxed overflow-x-auto text-primary/80">
                  <code className="block text-accent-foreground">
                    <span className="text-muted-foreground">$</span> curl -X
                    POST &quot;https://api.nsfwguard.io/v4&quot; \
                  </code>
                  <code className="block ml-4">
                    {" "}
                    -H{" "}
                    <span className="text-green-400">
                      &quot;Authorization: Bearer $API_KEY&quot;
                    </span>{" "}
                    \
                  </code>
                  <code className="block ml-4">
                    {" "}
                    -F{" "}
                    <span className="text-green-400">
                      &quot;media=@image.jpg&quot;
                    </span>{" "}
                    \
                  </code>
                  <code className="block ml-4">
                    {" "}
                    -F{" "}
                    <span className="text-green-400">
                      &quot;detect=[&apos;explicit&apos;,
                      &apos;suggestive&apos;]&quot;
                    </span>
                  </code>
                  <code className="block mt-4 text-muted-foreground">{`// Response: 42ms`}</code>
                  <code className="block text-muted-foreground">{"{"}</code>
                  <code className="block text-muted-foreground">
                    {" "}
                    &quot;status&quot;:{" "}
                    <span className="text-green-400">&quot;success&quot;</span>,
                  </code>
                  <code className="block text-muted-foreground">
                    {" "}
                    &quot;result&quot;: {"{"}
                  </code>
                  <code className="block text-muted-foreground">
                    {" "}
                    &quot;safe&quot;:{" "}
                    <span className="text-destructive">false</span>,
                  </code>
                  <code className="block text-muted-foreground">
                    {" "}
                    &quot;score&quot;:{" "}
                    <span className="text-primary">0.998</span>,
                  </code>
                  <code className="block text-muted-foreground">
                    {" "}
                    &quot;flags&quot;: [
                    <span className="text-green-400">
                      &quot;explicit_content&quot;
                    </span>
                    ]
                  </code>
                  <code className="block text-muted-foreground"> {"}"}</code>
                  <code className="block text-muted-foreground">{"}"}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Cyberpunk decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 blur-3xl z-0"></div>
            <div className="absolute top-1/2 -right-12 w-px h-32 bg-primary/50 shadow-[0_0_8px_rgba(0,245,255,1)]"></div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section
          className="border-y border-border bg-accent/30 py-24"
          id="solutions"
        >
          <div className="container mx-auto max-w-360 px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ZapIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
                  Low Latency
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Global average response time under 50ms. Built for scale and
                  lightning speed execution.
                </p>
              </div>

              <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <GlobeIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
                  Global Edge
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  24 points of presence globally ensuring minimal hop count for
                  your users anywhere on earth.
                </p>
              </div>

              <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
                  Multi-Modal
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Unified API for images, video streams, and text-to-image AI
                  prompt moderation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time testing module */}
        <section className="container mx-auto max-w-360 px-4 py-32">
          {/* <HomeTestModule /> */}
        </section>

        {/* Built for Zero-Failure */}
        <section className="border-t border-border bg-background py-32 relative overflow-hidden">
          <div className="absolute w-200 h-200 bg-primary/5 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="container mx-auto max-w-360 px-4 text-center mb-16 relative z-10">
            <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter mb-6">
              Built for Zero-Failure Environments
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Precision-engineered content moderation that powers the
              world&apos;s most demanding platforms.
            </p>
          </div>

          <div className="container mx-auto max-w-360 px-4 grid md:grid-cols-3 gap-8 relative z-10">
            <div className="p-8 border border-border bg-card space-y-6">
              <ShieldIcon className="w-10 h-10 text-primary" />
              <h4 className="text-xl font-heading font-bold uppercase tracking-widest">
                SOC-2 Type II Certified
              </h4>
              <p className="text-muted-foreground">
                We adhere to the highest industry standards for data security
                and privacy management.
              </p>
            </div>
            <div className="p-8 border border-border bg-card space-y-6">
              <SearchIcon className="w-10 h-10 text-primary" />
              <h4 className="text-xl font-heading font-bold uppercase tracking-widest">
                Auto-Scaling
              </h4>
              <p className="text-muted-foreground">
                From 10 to 10M requests per hour, our serverless architecture
                scales instantly with zero manual config.
              </p>
            </div>
            <div className="p-8 border border-border bg-card space-y-6">
              <BarChart3Icon className="w-10 h-10 text-primary" />
              <h4 className="text-xl font-heading font-bold uppercase tracking-widest">
                Deep Insights
              </h4>
              <p className="text-muted-foreground">
                Granular analytics dashboard to monitor moderation trends and
                API consumption in real-time.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-primary/5 py-32 text-center">
          <div className="container mx-auto max-w-4xl px-4 space-y-8">
            <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter">
              Ready to secure your community?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join 2,000+ developers building safer digital spaces with
              NSFWGuard. No credit card required to start.
            </p>
            <div className="pt-8">
              <Link href={"/pricing"}>
                <Button
                  size="lg"
                  className="h-16 px-12 text-lg font-heading font-bold tracking-widest uppercase rounded-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,245,255,0.6)] hover:shadow-[0_0_30px_rgba(0,245,255,1)] transition-all"
                >
                  Get Your API Key Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
