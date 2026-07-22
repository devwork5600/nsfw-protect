import type Stripe from 'stripe';
import { handleCheckoutCompleted } from './checkout';
import { handleSubscriptionUpsert, handleSubscriptionDeleted } from './subscription';
import { handleInvoiceEvent } from './invoice';

export async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
    case 'invoice.payment_succeeded':
      await handleInvoiceEvent(event);
      break;

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}
