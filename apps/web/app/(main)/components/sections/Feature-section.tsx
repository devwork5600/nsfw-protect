import { GlobeIcon, ImageIcon, ZapIcon } from 'lucide-react';

const FeatureSection = () => {
  return (
    <section className="bg-background py-24" id="solutions">
      <div className="container mx-auto max-w-360 px-4">
        <div className="relative z-10 grid md:grid-cols-3 gap-8">
          <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ZapIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
              Low Latency
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Global average response time under 50ms. Built for scale and lightning speed
              execution.
            </p>
          </div>

          <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <GlobeIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
              Global Edge
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              24 points of presence globally ensuring minimal hop count for your users anywhere on
              earth.
            </p>
          </div>

          <div className="space-y-4 p-8 border border-border bg-card hover:border-primary transition-colors group">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-foreground">
              Multi-Modal
            </h2>
            <p className="text-muted-foreground leading-relaxed">Unified API for images.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
