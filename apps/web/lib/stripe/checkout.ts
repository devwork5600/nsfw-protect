import type Stripe from 'stripe';
import { stripe } from './helpers';
import { upsertSubscription } from './subscription';

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscription(subscription);
  console.log(`[Stripe Webhook] Checkout completed for subscription ${subscriptionId}`);
}
