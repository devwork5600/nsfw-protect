import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getUser } from '@/lib/auth/auth-session';
import { redirect } from 'next/navigation';
import { prisma } from '@nsfw/db';

const plans = [
  {
    name: 'Free',
    description: 'For hobbyists and small projects.',
    price: '$0',
    priceId: null,
    features: [
      '100 requests / month',
      'Standard latency',
      'Community support',
      '1 concurrent stream',
    ],
    buttonText: 'Get Started',
    href: '/auth/register',
    recommended: false,
  },
  {
    name: 'Starter',
    description: 'For growing developers.',
    price: '$29',
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    features: [
      '10,000 requests / month',
      '< 150ms latency SLA',
      'Email support',
      '5 concurrent streams',
      'Basic tag filters',
    ],
    buttonText: 'Get Started',
    href: '/auth/register',
    recommended: true,
  },
  {
    name: 'Pro',
    description: 'For industrial-scale applications.',
    price: '$149',
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    features: [
      '100,000 requests / month',
      '< 80ms latency SLA',
      'Priority email support',
      '20 concurrent streams',
      'Custom tag filters',
      'Advanced Audit Logs',
    ],
    buttonText: 'Get Started',
    href: '/auth/register',
    recommended: false,
  },
];

const comparisons = [
  { feature: 'Monthly Quota', free: '100', starter: '10k', pro: '100k+ ' },
  { feature: 'P99 Latency', free: 'Standard', starter: '< 150ms', pro: '< 80ms' },
  { feature: 'Batch Processing', free: false, starter: true, pro: true },
  { feature: 'Webhooks', free: false, starter: true, pro: true },
  { feature: 'Audit Logs', free: 'None', starter: '30 Days', pro: '90 Days' },
  { feature: 'SLA Guarantee', free: 'None', starter: '99.5%', pro: '99.9%' },
];

const faqs = [
  {
    question: "How is 'per request' defined?",
    answer:
      'Each individual image analysis or 10-second segment of video constitutes one request. Streaming is calculated by frame sampling rate.',
  },
  {
    question: 'Can I upgrade/downgrade mid-cycle?',
    answer:
      'Yes. Plan changes are prorated immediately. You will only pay for the high-tier features for the days you actually used them.',
  },
  {
    question: 'What happens if I exceed my quota?',
    answer:
      'On Pro plans, overages are billed at $0.002 per request. On Starter, the API will return a 429 Error until the next billing cycle.',
  },
  {
    question: 'Is my data used for training?',
    answer:
      'No. NSFWGuard API adheres to strict data privacy standards. Images are processed in volatile memory and discarded instantly unless audit logging is enabled.',
  },
  {
    question: 'Do you offer a sandbox?',
    answer:
      'Our Free plan acts as a permanent sandbox with full access to all core verification models for development and testing purposes.',
  },
  {
    question: 'Which regions are supported?',
    answer:
      'Our edge network has clusters in US-East, US-West, EU-Central, and Asia-Pacific to ensure global low-latency performance.',
  },
];

export default async function PricingPage() {
  const user = await getUser();

  if (user) {
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'PAST_DUE'],
            },
          },
          take: 1,
        },
      },
    });

    if (customer?.subscriptions[0]) {
      redirect('/dashboard/billing');
    }
  }

  return (
    <>
      {/* Hero section */}
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Engineered for <span className="text-primary italic">Precision.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto tracking-wide">
          Scale your visual safety architecture with millisecond latency and industrial-grade
          verification. Transparent pricing for teams of all sizes.
        </p>
        <div className="flex justify-center pt-4">
          <Badge
            variant="outline"
            className="rounded-none border-green-500/30 text-green-500 bg-green-500/5 px-4 py-1 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold"
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            System Operational: 99.99% Uptime
          </Badge>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            return (
              <div
                key={plan.name}
                className={`relative z-10 border p-8 flex flex-col justify-between group transition-all ${
                  plan.recommended
                    ? 'border-primary bg-card scale-105'
                    : 'border-border bg-card hover:border-primary'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                    Recommended
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold italic uppercase tracking-tighter mb-1">
                    {plan.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold italic tracking-tighter">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-muted-foreground ml-2 uppercase text-xs tracking-widest">
                        /mo
                      </span>
                    )}
                  </div>
                  <ul className="space-y-4 mb-12">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm tracking-wide">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className={`w-full rounded-none font-bold uppercase tracking-widest py-6 transition-all ${
                    plan.recommended
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,112,255,0.4)]'
                      : 'bg-transparent border border-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(0,112,255,0.4)]'
                  }`}
                  asChild
                >
                  <Link href={user ? '/dashboard/billing' : '/auth'}>{plan.buttonText}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24 max-w-5xl mx-auto space-y-16">
        <h2 className="text-3xl font-bold text-center italic uppercase tracking-tighter">
          Detailed Feature Comparison
        </h2>
        <div className="relative z-10 border border-border bg-card">
          <div className="grid grid-cols-4 p-6 border-b border-border text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <div>Feature</div>
            <div className="text-center">Free</div>
            <div className="text-center">Starter</div>
            <div className="text-center text-foreground">Pro</div>
          </div>
          {comparisons.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-4 p-6 border-b border-border last:border-0 hover:bg-accent/50 transition-colors group"
            >
              <div className="text-sm font-medium group-hover:text-primary transition-colors">
                {row.feature}
              </div>
              <div className="text-sm text-center text-muted-foreground">
                {typeof row.free === 'boolean' ? (
                  row.free ? (
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  ) : (
                    <X className="w-4 h-4 mx-auto text-red-500/50" />
                  )
                ) : (
                  row.free
                )}
              </div>
              <div className="text-sm text-center text-muted-foreground">
                {typeof row.starter === 'boolean' ? (
                  row.starter ? (
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  ) : (
                    <X className="w-4 h-4 mx-auto text-red-500/50" />
                  )
                ) : (
                  row.starter
                )}
              </div>
              <div className="text-sm text-center">
                {typeof row.pro === 'boolean' ? (
                  row.pro ? (
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  ) : (
                    <X className="w-4 h-4 mx-auto text-red-500/50" />
                  )
                ) : (
                  row.pro
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold italic uppercase tracking-tighter">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Everything you need to know about our billing and API mechanics.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="relative z-10 p-8 border border-border bg-card space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary leading-relaxed">
                {faq.question}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto bg-linear-to-br from-muted to-background border border-border p-12 md:p-20 text-center space-y-8 relative z-10 overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter italic uppercase relative z-10">
            Ready to secure your platform?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto relative z-10 font-sans">
            Join over 2,500+ developers building safer digital environments with NSFWGuard.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 relative z-10">
            <Button
              size="lg"
              className="rounded-none font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/auth/register">Create Developer Account</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-none font-bold uppercase tracking-widest border-muted hover:border-foreground"
            >
              <Link href="/support">Talk to an Engineer</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
