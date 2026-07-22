import { stripe } from '@/lib/stripe/helpers';
import { processStripeEvent } from '@/lib/stripe/webhook';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

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
    await processStripeEvent(event);
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
