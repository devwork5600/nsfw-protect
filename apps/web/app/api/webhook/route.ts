import Stripe from 'stripe';
import { prisma } from '@nsfw/db';
import { sendEmail, SubscriptionSuccessTemplate, PlanUpdatedTemplate } from '@nsfw/email';
import * as React from 'react';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

function formatPlanName(plan: string) {
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}

async function getOrCreateSubscription(stripeSub: Stripe.Subscription) {
  // Ensure we have the full subscription data
  let sub = stripeSub;
  if (!sub.items || !sub.items.data.length) {
    sub = await stripe.subscriptions.retrieve(stripeSub.id);
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const customer = await prisma.customer.findUnique({
    where: {
      stripeCustomerId: customerId,
    },
  });

  if (!customer) {
    console.warn(`[Stripe Webhook] No customer found for stripeCustomerId: ${customerId}`);
    return null;
  }

  const priceId = sub.items.data[0].price.id;

  let planTier: 'STARTER' | 'PRO' | 'FREE' = 'FREE';
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
    planTier = 'PRO';
  } else if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) {
    planTier = 'STARTER';
  }

  const statusMap: Record<
    string,
    'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'UNPAID'
  > = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    unpaid: 'UNPAID',
  };
  const subscriptionStatus = statusMap[sub.status] || 'ACTIVE';

  return await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: sub.id,
    },
    create: {
      customerId: customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plan: planTier,
      status: subscriptionStatus,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodStart: new Date(
        (sub as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000,
      ),
    },
    update: {
      plan: planTier,
      status: subscriptionStatus,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodStart: new Date(
        (sub as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000,
      ),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new Response('Invalid signature', {
      status: 400,
    });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await getOrCreateSubscription(subscription);
          console.log(`[Stripe Webhook] Checkout completed for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;

        // Check if plan changed
        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSub.id },
          include: { customer: { include: { user: true } } },
        });

        const newSub = await getOrCreateSubscription(stripeSub);

        // New billing period started → unlock plan changes
        const newPeriodStart = new Date(
          (stripeSub as Stripe.Subscription & { current_period_start: number })
            .current_period_start * 1000,
        );
        if (existingSub && existingSub.currentPeriodStart.getTime() !== newPeriodStart.getTime()) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: stripeSub.id },
            data: { planChangedAt: null },
          });
        }

        if (
          existingSub &&
          newSub &&
          existingSub.plan !== newSub.plan &&
          existingSub.customer.user
        ) {
          try {
            const planOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
            const oldIndex = planOrder.indexOf(existingSub.plan);
            const newIndex = planOrder.indexOf(newSub.plan);

            let changeType: 'upgrade' | 'downgrade' | 'update' = 'update';
            if (newIndex > oldIndex) changeType = 'upgrade';
            else if (newIndex < oldIndex) changeType = 'downgrade';

            const dashboardUrl =
              process.env.APP_URL ||
              process.env.NEXT_PUBLIC_APP_URL ||
              'https://app.nsfw-protect.com';

            // Fetch the price details for the new plan
            const price = await stripe.prices.retrieve(stripeSub.items.data[0].price.id);
            const amount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency,
            }).format((price.unit_amount || 0) / 100);

            const interval =
              price.recurring?.interval === 'month'
                ? '/mo'
                : price.recurring?.interval === 'year'
                  ? '/yr'
                  : '';
            const formattedPrice = `${amount}${interval}`;

            // For downgrades, the "effective date" is usually the end of the current period
            const subWithPeriod = stripeSub as Stripe.Subscription & { current_period_end: number };
            const effectiveDate =
              changeType === 'downgrade'
                ? new Date(subWithPeriod.current_period_end * 1000).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });

            await sendEmail({
              to: existingSub.customer.user.email,
              subject: `Plan ${changeType === 'upgrade' ? 'Upgraded' : changeType === 'downgrade' ? 'Downgraded' : 'Updated'} - NSFWGuard`,
              react: React.createElement(PlanUpdatedTemplate, {
                username:
                  existingSub.customer.user.name ||
                  existingSub.customer.user.firstName ||
                  existingSub.customer.user.email.split('@')[0],
                oldPlanName: formatPlanName(existingSub.plan),
                newPlanName: formatPlanName(newSub.plan),
                changeType,
                newPrice: formattedPrice,
                effectiveDate: effectiveDate,
                dashboardUrl: `${dashboardUrl}/dashboard`,
              }),
            });
          } catch (emailErr) {
            console.error('[Stripe Webhook] Failed to send plan update email:', emailErr);
          }
        }

        console.log(`[Stripe Webhook] Processed ${event.type} for subscription ${stripeSub.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: stripeSub.id,
          },
          data: {
            status: 'CANCELED',
          },
        });
        console.log(`[Stripe Webhook] Subscription ${stripeSub.id} canceled`);
        break;
      }

      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        const stripeInvoice = event.data.object as Stripe.Invoice & { subscription?: string };

        if (!stripeInvoice.subscription) {
          console.log(
            `[Stripe Webhook] Invoice ${stripeInvoice.id} has no subscription attached. Skipping.`,
          );
          break;
        }

        let subscription = await prisma.subscription.findUnique({
          where: {
            stripeSubscriptionId: stripeInvoice.subscription,
          },
        });

        // If subscription not found, try to create it from Stripe data
        if (!subscription) {
          console.log(
            `[Stripe Webhook] Subscription not found for invoice ${stripeInvoice.id}. Attempting to fetch from Stripe...`,
          );
          const stripeSub = await stripe.subscriptions.retrieve(stripeInvoice.subscription);
          subscription = await getOrCreateSubscription(stripeSub);
        }

        if (!subscription) {
          console.warn(
            `[Stripe Webhook] Could not process invoice ${stripeInvoice.id}: Subscription ${stripeInvoice.subscription} not found or customer missing.`,
          );
          break;
        }

        const isPaid = event.type === 'invoice.payment_succeeded';

        await prisma.invoice.upsert({
          where: {
            stripeInvoiceId: stripeInvoice.id,
          },
          create: {
            subscriptionId: subscription.id,
            stripeInvoiceId: stripeInvoice.id,
            amountPaid: stripeInvoice.amount_paid,
            currency: stripeInvoice.currency,
            hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
            pdfUrl: stripeInvoice.invoice_pdf,
            paid: isPaid,
          },
          update: {
            paid: isPaid,
            hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
            pdfUrl: stripeInvoice.invoice_pdf,
          },
        });

        if (event.type === 'invoice.payment_failed') {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });
        } else {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'ACTIVE' },
          });
        }

        console.log(
          `[Stripe Webhook] Invoice ${stripeInvoice.id} ${isPaid ? 'paid' : 'marked unpaid'} for subscription ${subscription.id}`,
        );

        // Send confirmation email on successful payment
        if (isPaid) {
          try {
            const customer = await prisma.customer.findUnique({
              where: { id: subscription.customerId },
              include: { user: true },
            });

            if (customer?.user) {
              const amount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: stripeInvoice.currency,
              }).format((stripeInvoice.amount_paid ?? stripeInvoice.total) / 100);

              const planName = formatPlanName(subscription.plan);

              // Determine billing cycle from the invoice line items
              const lineItem = stripeInvoice.lines.data[0] as Stripe.InvoiceLineItem & {
                price: Stripe.Price;
              };
              const interval = lineItem?.price?.recurring?.interval;
              const billingCycle =
                interval === 'month' ? 'Monthly' : interval === 'year' ? 'Yearly' : 'Recurring';

              const dashboardUrl =
                process.env.APP_URL ||
                process.env.NEXT_PUBLIC_APP_URL ||
                'https://app.nsfw-protect.com';

              await sendEmail({
                to: customer.user.email,
                subject: `Payment Successful - Welcome to ${planName}`,
                react: React.createElement(SubscriptionSuccessTemplate, {
                  username:
                    customer.user.name ||
                    customer.user.firstName ||
                    customer.user.email.split('@')[0],
                  planName: planName,
                  amount: amount,
                  billingCycle: billingCycle,
                  dashboardUrl: dashboardUrl,
                }),
              });
            }
          } catch (emailErr) {
            console.error('[Stripe Webhook] Failed to send payment confirmation email:', emailErr);
          }
        }
        break;
      }

      default: {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    }
  } catch (err) {
    console.error(
      `[Stripe Webhook] Error processing event ${event.type} (${event.id}):`,
      err instanceof Error ? err.message : err,
      err,
    );
    return new Response(
      JSON.stringify({
        error: `Webhook handler failed for ${event.type}`,
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return Response.json({
    received: true,
  });
}
