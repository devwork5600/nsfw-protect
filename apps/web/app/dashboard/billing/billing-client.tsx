'use client';

import { useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { manageSubscription, previewSubscriptionChange } from '@/actions/subscription';

const plans = [
  {
    name: 'Free',
    description: 'For hobbyists and small projects.',
    price: '$0',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE || 'price_free',
    features: [
      '100 requests / month',
      'Standard latency',
      'Community support',
      '1 concurrent stream',
    ],
    buttonText: 'Get Started',
    recommended: false,
  },
  {
    name: 'Starter',
    description: 'For growing developers.',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter',
    features: [
      '10,000 requests / month',
      '< 150ms latency SLA',
      'Email support',
      '5 concurrent streams',
      'Basic tag filters',
    ],
    buttonText: 'Upgrade to Starter',
    recommended: true,
  },
  {
    name: 'Pro',
    description: 'For industrial-scale applications.',
    price: '$149',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro',
    features: [
      '100,000 requests / month',
      '< 80ms latency SLA',
      'Priority email support',
      '20 concurrent streams',
      'Custom tag filters',
      'Advanced Audit Logs',
    ],
    buttonText: 'Upgrade to Pro',
    recommended: false,
  },
];

type Subscription = {
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  stripePriceId: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  planChangedAt?: Date | null;
  stripeSubscriptionId?: string;
  status?: string;
};

export default function BillingClient({
  initialSubscription,
  plansConfig,
}: {
  initialSubscription: Subscription;
  plansConfig: { name: string; priceId: string }[];
}) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loading, setLoading] = useState<string | null>(null);

  const isPlanChangeLocked =
    !!subscription.planChangedAt &&
    new Date(subscription.planChangedAt) >= new Date(subscription.currentPeriodStart);

  // Update plans with actual price IDs from server
  const activePlans = plans.map((plan) => {
    const config = plansConfig.find((c) => c.name === plan.name);
    return {
      ...plan,
      priceId: config?.priceId || plan.priceId,
    };
  });

  const [preview, setPreview] = useState<{
    amount: number;
    currency: string;
    priceId: string;
    prorationDate: number;
  } | null>(null);

  const onPlanSelect = async (priceId: string, planName: string) => {
    if (priceId === subscription.stripePriceId) return;

    setLoading(priceId);

    try {
      // Logic for upgrade/downgrade
      const isUpgrade =
        (subscription.plan === 'STARTER' && planName === 'Pro') ||
        (subscription.plan === 'FREE' && (planName === 'Starter' || planName === 'Pro'));

      if (isUpgrade) {
        const previewData = await previewSubscriptionChange(priceId);
        setPreview({
          ...previewData,
          priceId,
        });
      } else {
        await manageSubscription(priceId === 'free' ? null : priceId);
        toast.success('Subscription updated successfully');
        setSubscription({
          ...subscription,
          plan: planName.toUpperCase() as 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
          stripePriceId: priceId,
          cancelAtPeriodEnd: false,
          planChangedAt: new Date(),
        });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setLoading(null);
    }
  };

  const confirmUpgrade = async () => {
    if (!preview) return;
    setLoading(preview.priceId);

    try {
      await manageSubscription(preview.priceId, preview.prorationDate);
      const planName = activePlans.find((p) => p.priceId === preview.priceId)?.name || 'PRO';
      setSubscription({
        ...subscription,
        plan: planName.toUpperCase() as 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
        stripePriceId: preview.priceId,
        cancelAtPeriodEnd: false,
        planChangedAt: new Date(),
      });
      toast.success('Subscription upgraded successfully');
      setPreview(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      setLoading('cancel');
      try {
        await manageSubscription(null);
        setSubscription({
          ...subscription,
          cancelAtPeriodEnd: true,
        });
        toast.success(
          'Subscription cancelled. It will remain active until the end of the billing period.',
        );
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
      } finally {
        setLoading(null);
      }
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-12 pb-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold italic uppercase tracking-tighter">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground tracking-wide">
          Manage your current plan and billing cycles.
        </p>
      </div>

      {subscription?.cancelAtPeriodEnd && (
        <div className="bg-card border border-yellow-500/30 p-4 flex items-center gap-3 text-yellow-500 text-sm font-medium uppercase tracking-widest">
          <AlertCircle className="w-5 h-5" />
          Your subscription will end on{' '}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </div>
      )}

      {isPlanChangeLocked && (
        <div className="bg-card border border-blue-500/30 p-4 flex items-center gap-3 text-blue-400 text-sm font-medium uppercase tracking-widest">
          <AlertCircle className="w-5 h-5" />
          Plan already changed this cycle. Next change available on{' '}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          .
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {activePlans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.name.toUpperCase();
          const isUpgrade =
            (subscription?.plan === 'STARTER' && plan.name === 'Pro') ||
            (subscription?.plan === 'FREE' && (plan.name === 'Starter' || plan.name === 'Pro'));

          const isLoading = loading === plan.priceId;

          return (
            <div
              key={plan.name}
              className={`relative border p-8 flex flex-col justify-between group transition-all duration-500 ${
                isCurrentPlan
                  ? 'border-primary bg-card scale-105 z-10'
                  : 'border-white/10 bg-card hover:border-white/20'
              }`}
            >
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

              {isCurrentPlan ? (
                <div className="space-y-4">
                  <Button
                    disabled
                    className="w-full rounded-none font-bold uppercase tracking-widest py-6 bg-white/10 text-white cursor-default"
                  >
                    Current Plan
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => onPlanSelect(plan.priceId, plan.name)}
                  disabled={!!loading || isPlanChangeLocked}
                  title={
                    isPlanChangeLocked
                      ? `Next plan change available on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : undefined
                  }
                  className={`w-full rounded-none font-bold uppercase tracking-widest py-6 transition-all ${
                    isPlanChangeLocked
                      ? 'opacity-40 cursor-not-allowed'
                      : plan.recommended
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-transparent border border-white/20 hover:border-white text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isUpgrade ? (
                    'Upgrade'
                  ) : (
                    'Downgrade'
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {subscription && !subscription.cancelAtPeriodEnd && (
        <div className="pt-8 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading === 'cancel'}
            className="rounded-none font-bold uppercase tracking-widest text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/5 px-0"
          >
            {loading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Cancel Subscription
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold italic uppercase tracking-tighter">
                Confirm Upgrade
              </h2>
              <p className="text-muted-foreground text-sm tracking-wide">
                You are about to upgrade your plan. Stripe will calculate the unused time on your
                current plan and apply it as a credit.
              </p>
            </div>

            <div className="bg-white/5 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm uppercase tracking-widest font-medium">
                <span className="text-muted-foreground">Due Immediately</span>
                <span className="text-white">
                  {(preview.amount / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: preview.currency,
                  })}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-relaxed">
                This amount covers the difference for the remainder of your current billing period.
                Your next recurring payment will be at the full new plan rate.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setPreview(null)}
                disabled={!!loading}
                className="flex-1 rounded-none border border-white/10 uppercase tracking-widest font-bold text-xs py-6"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUpgrade}
                disabled={!!loading}
                className="flex-1 rounded-none bg-primary hover:bg-primary/90 text-white uppercase tracking-widest font-bold text-xs py-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Pay'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
