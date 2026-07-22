import type Stripe from 'stripe';
import { prisma } from '@nsfw/db';
import { stripe } from './helpers';
import { upsertSubscription } from './subscription';
import { sendPaymentSuccessEmail } from './emails';

export async function handleInvoiceEvent(event: Stripe.Event) {
  const stripeInvoice = event.data.object as Stripe.Invoice;

  // The `subscription` field was removed from the top-level Invoice object in
  // this API version — it now lives under parent.subscription_details.
  const subscriptionDetails =
    stripeInvoice.parent?.type === 'subscription_details'
      ? stripeInvoice.parent.subscription_details
      : null;
  const subscriptionRef = subscriptionDetails?.subscription;
  const subscriptionId =
    typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;

  if (!subscriptionId) {
    console.log(
      `[Stripe Webhook] Invoice ${stripeInvoice.id} has no subscription attached. Skipping.`,
    );
    return;
  }

  let subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  // If subscription not found, try to create it from Stripe data
  if (!subscription) {
    console.log(
      `[Stripe Webhook] Subscription not found for invoice ${stripeInvoice.id}. Attempting to fetch from Stripe...`,
    );
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    subscription = await upsertSubscription(stripeSub);
  }

  if (!subscription) {
    console.warn(
      `[Stripe Webhook] Could not process invoice ${stripeInvoice.id}: Subscription ${subscriptionId} not found or customer missing.`,
    );
    return;
  }

  const isPaid = event.type === 'invoice.payment_succeeded';

  // Track whether this invoice was already marked paid *before* this event, so a
  // Stripe webhook retry doesn't re-send the confirmation email below.
  const existingInvoice = await prisma.invoice.findUnique({
    where: { stripeInvoiceId: stripeInvoice.id },
  });
  const alreadyNotified = existingInvoice?.paid === true;

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
      amountPaid: stripeInvoice.amount_paid,
      currency: stripeInvoice.currency,
      paid: isPaid,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
      pdfUrl: stripeInvoice.invoice_pdf,
    },
  });

  // Invoice events aren't guaranteed to arrive in order relative to
  // customer.subscription.deleted — don't let a stale/retried invoice event
  // resurrect a subscription that has already been canceled.
  if (subscription.status !== 'CANCELED') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: isPaid ? 'ACTIVE' : 'PAST_DUE' },
    });
  }

  console.log(
    `[Stripe Webhook] Invoice ${stripeInvoice.id} ${isPaid ? 'paid' : 'marked unpaid'} for subscription ${subscription.id}`,
  );

  if (isPaid && !alreadyNotified) {
    await sendPaymentSuccessEmail(subscription, stripeInvoice);
  }
}
