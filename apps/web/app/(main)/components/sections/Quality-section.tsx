import { BarChart3Icon, SearchIcon, ShieldIcon } from 'lucide-react';
import React from 'react';

const QualitySection = () => {
  return (
    <section className="bg-background py-32 relative overflow-hidden">
      {/* <div className="absolute w-200 h-200 bg-primary/5 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div> */}

      <div className="container mx-auto max-w-360 px-4 text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter mb-6">
          Built for Zero-Failure Environments
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Precision-engineered content moderation that powers the world&apos;s most demanding
          platforms.
        </p>
      </div>

      <div className="container mx-auto max-w-360 px-4 grid md:grid-cols-3 gap-8 relative z-10">
        <div className="p-8 border border-border bg-card space-y-6">
          <ShieldIcon className="w-10 h-10 text-primary" />
          <h3 className="text-xl font-heading font-bold uppercase tracking-widest">
            SOC-2 Type II Certified
          </h3>
          <p className="text-muted-foreground">
            We adhere to the highest industry standards for data security and privacy management.
          </p>
        </div>
        <div className="p-8 border border-border bg-card space-y-6">
          <SearchIcon className="w-10 h-10 text-primary" />
          <h3 className="text-xl font-heading font-bold uppercase tracking-widest">Auto-Scaling</h3>
          <p className="text-muted-foreground">
            From 10 to 10M requests per hour, our serverless architecture scales instantly with zero
            manual config.
          </p>
        </div>
        <div className="p-8 border border-border bg-card space-y-6">
          <BarChart3Icon className="w-10 h-10 text-primary" />
          <h3 className="text-xl font-heading font-bold uppercase tracking-widest">
            Deep Insights
          </h3>
          <p className="text-muted-foreground">
            Granular analytics dashboard to monitor moderation trends and API consumption in
            real-time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QualitySection;
