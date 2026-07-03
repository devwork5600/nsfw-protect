import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

const CTASection = () => {
  return (
    <section className="border-t border-border bg-primary/5 py-32 text-center mx-2">
      <div className="container mx-auto max-w-4xl px-4 space-y-8">
        <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter">
          Ready to secure your community?
        </h2>
        <p className="text-xl text-muted-foreground">
          Join 2,000+ developers building safer digital spaces with NSFWGuard. No credit card
          required to start.
        </p>
        <div className="pt-8 flex justify-center">
          <Link href={'/billing'} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="h-16 px-6 sm:px-12 text-base sm:text-lg font-heading font-bold tracking-widest uppercase  w-full sm:w-auto"
            >
              Get Your API Key Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
