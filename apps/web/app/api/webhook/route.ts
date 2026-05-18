import Stripe from 'stripe';
import { prisma } from '@nsfw/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

async function getOrCreateSubscription(stripeSub: any) {
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
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
    update: {
      plan: planTier,
      status: subscriptionStatus,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
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
        const stripeSub = event.data.object as any;
        await getOrCreateSubscription(stripeSub);
        console.log(`[Stripe Webhook] Processed ${event.type} for subscription ${stripeSub.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as any;
        await prisma.subscription.update({
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
        const stripeInvoice = event.data.object as any;

        if (!stripeInvoice.subscription) {
          console.log(
            `[Stripe Webhook] Invoice ${stripeInvoice.id} has no subscription attached. Skipping.`,
          );
          break;
        }

        let subscription = await prisma.subscription.findUnique({
          where: {
            stripeSubscriptionId: stripeInvoice.subscription as string,
          },
        });

        // If subscription not found, try to create it from Stripe data
        if (!subscription) {
          console.log(
            `[Stripe Webhook] Subscription not found for invoice ${stripeInvoice.id}. Attempting to fetch from Stripe...`,
          );
          const stripeSub = await stripe.subscriptions.retrieve(
            stripeInvoice.subscription as string,
          );
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
        }

        console.log(
          `[Stripe Webhook] Invoice ${stripeInvoice.id} ${isPaid ? 'paid' : 'marked unpaid'} for subscription ${subscription.id}`,
        );
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
