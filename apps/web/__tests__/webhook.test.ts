import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (created before vi.mock factories run) ───────────────────

const mocks = vi.hoisted(() => ({
  // Stripe
  constructEvent: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  pricesRetrieve: vi.fn(),
  // Prisma
  customerFindUnique: vi.fn(),
  subscriptionFindUnique: vi.fn(),
  subscriptionUpsert: vi.fn(),
  subscriptionUpdate: vi.fn(),
  subscriptionUpdateMany: vi.fn(),
  invoiceUpsert: vi.fn(),
  // Email
  sendEmail: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      webhooks: { constructEvent: mocks.constructEvent },
      subscriptions: { retrieve: mocks.subscriptionsRetrieve },
      prices: { retrieve: mocks.pricesRetrieve },
    };
  }),
}));

vi.mock('@nsfw/db', () => ({
  prisma: {
    customer: { findUnique: mocks.customerFindUnique },
    subscription: {
      findUnique: mocks.subscriptionFindUnique,
      upsert: mocks.subscriptionUpsert,
      update: mocks.subscriptionUpdate,
      updateMany: mocks.subscriptionUpdateMany,
    },
    invoice: { upsert: mocks.invoiceUpsert },
  },
}));

vi.mock('@nsfw/email', () => ({
  sendEmail: mocks.sendEmail,
  SubscriptionSuccessTemplate: vi.fn(),
  PlanUpdatedTemplate: vi.fn(),
}));

vi.mock('react', () => ({ createElement: vi.fn() }));

// ─── Import handler AFTER mocks are registered ───────────────────────────────

import { POST } from '../app/api/webhook/route';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const STRIPE_CUSTOMER_ID = 'cus_test_123';
const STRIPE_SUB_ID = 'sub_test_123';
const STRIPE_INVOICE_ID = 'in_test_123';
const PRICE_STARTER = 'price_starter_test';
const PRICE_PRO = 'price_pro_test';

const PERIOD_START = new Date('2026-07-01T00:00:00Z');
const PERIOD_END = new Date('2026-08-01T00:00:00Z');
const PERIOD_START_UNIX = Math.floor(PERIOD_START.getTime() / 1000);
const PERIOD_END_UNIX = Math.floor(PERIOD_END.getTime() / 1000);

const DB_CUSTOMER = {
  id: 'customer_db_id',
  stripeCustomerId: STRIPE_CUSTOMER_ID,
  userId: 'user_db_id',
  user: { id: 'user_db_id', email: 'user@test.com', name: 'Test User', firstName: 'Test' },
};

const DB_SUBSCRIPTION = {
  id: 'subscription_db_id',
  customerId: 'customer_db_id',
  stripeSubscriptionId: STRIPE_SUB_ID,
  stripePriceId: PRICE_STARTER,
  plan: 'STARTER' as const,
  status: 'ACTIVE' as const,
  cancelAtPeriodEnd: false,
  currentPeriodStart: PERIOD_START,
  currentPeriodEnd: PERIOD_END,
  planChangedAt: null,
  customer: { ...DB_CUSTOMER },
};

function makeStripeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: STRIPE_SUB_ID,
    customer: STRIPE_CUSTOMER_ID,
    status: 'active',
    items: { data: [{ price: { id: PRICE_STARTER, recurring: { interval: 'month' } } }] },
    cancel_at_period_end: false,
    current_period_start: PERIOD_START_UNIX,
    current_period_end: PERIOD_END_UNIX,
    ...overrides,
  };
}

function makeStripeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: STRIPE_INVOICE_ID,
    subscription: STRIPE_SUB_ID,
    amount_paid: 2900,
    total: 2900,
    currency: 'usd',
    hosted_invoice_url: 'https://invoice.stripe.com/test',
    invoice_pdf: 'https://invoice.stripe.com/test.pdf',
    lines: {
      data: [{ price: { id: PRICE_STARTER, recurring: { interval: 'month' } } }],
    },
    ...overrides,
  };
}

function makeEvent(type: string, data: Record<string, unknown>) {
  return { id: 'evt_test_123', type, data: { object: data } };
}

function makeRequest(body: string = '{}', sig: string = 'test-sig') {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': sig },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/webhook', () => {
  beforeEach(() => {
    mocks.sendEmail.mockResolvedValue({ success: true });
    mocks.subscriptionUpsert.mockResolvedValue(DB_SUBSCRIPTION);
    mocks.subscriptionUpdate.mockResolvedValue(DB_SUBSCRIPTION);
    mocks.subscriptionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.invoiceUpsert.mockResolvedValue({});
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER);
    mocks.subscriptionFindUnique.mockResolvedValue(null);
  });

  // ── Signature verification ─────────────────────────────────────────────────

  it('returns 400 when stripe signature is invalid', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid signature');
  });

  it('returns 200 for unhandled event types without crashing', async () => {
    mocks.constructEvent.mockReturnValue(makeEvent('payment_intent.created', {}));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  // ── checkout.session.completed ─────────────────────────────────────────────

  it('checkout.session.completed creates subscription in DB', async () => {
    const stripeSub = makeStripeSub();
    mocks.constructEvent.mockReturnValue(
      makeEvent('checkout.session.completed', {
        mode: 'subscription',
        subscription: STRIPE_SUB_ID,
        customer: STRIPE_CUSTOMER_ID,
      }),
    );
    mocks.subscriptionsRetrieve.mockResolvedValue(stripeSub);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionsRetrieve).toHaveBeenCalledWith(STRIPE_SUB_ID);
    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: STRIPE_SUB_ID },
        create: expect.objectContaining({
          plan: 'STARTER',
          status: 'ACTIVE',
          stripePriceId: PRICE_STARTER,
        }),
      }),
    );
  });

  it('checkout.session.completed ignores non-subscription sessions', async () => {
    mocks.constructEvent.mockReturnValue(
      makeEvent('checkout.session.completed', { mode: 'payment' }),
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionsRetrieve).not.toHaveBeenCalled();
    expect(mocks.subscriptionUpsert).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ─────────────────────────────────────────

  it('customer.subscription.updated upserts subscription with correct plan', async () => {
    const stripeSub = makeStripeSub({
      items: { data: [{ price: { id: PRICE_PRO, recurring: { interval: 'month' } } }] },
    });
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ plan: 'PRO' }),
        update: expect.objectContaining({ plan: 'PRO' }),
      }),
    );
  });

  it('customer.subscription.updated sends plan change email when plan changes', async () => {
    const existingStarter = { ...DB_SUBSCRIPTION, plan: 'STARTER' as const };
    const newProSub = { ...DB_SUBSCRIPTION, plan: 'PRO' as const, stripePriceId: PRICE_PRO };
    const stripeSub = makeStripeSub({
      items: { data: [{ price: { id: PRICE_PRO, recurring: { interval: 'month' } } }] },
    });

    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(existingStarter);
    mocks.subscriptionUpsert.mockResolvedValue(newProSub);
    mocks.pricesRetrieve.mockResolvedValue({
      id: PRICE_PRO,
      currency: 'usd',
      unit_amount: 14900,
      recurring: { interval: 'month' },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: DB_CUSTOMER.user.email }),
    );
  });

  it('customer.subscription.updated does not send email when plan unchanged', async () => {
    const stripeSub = makeStripeSub();
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(DB_SUBSCRIPTION);
    mocks.subscriptionUpsert.mockResolvedValue(DB_SUBSCRIPTION);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('customer.subscription.updated resets planChangedAt when new billing period starts', async () => {
    const newPeriodStartUnix = Math.floor(new Date('2026-08-01T00:00:00Z').getTime() / 1000);
    const newPeriodEndUnix = Math.floor(new Date('2026-09-01T00:00:00Z').getTime() / 1000);
    const stripeSub = makeStripeSub({
      current_period_start: newPeriodStartUnix,
      current_period_end: newPeriodEndUnix,
    });

    const existingWithChange = {
      ...DB_SUBSCRIPTION,
      planChangedAt: new Date('2026-07-15T00:00:00Z'),
    };

    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(existingWithChange);
    mocks.subscriptionUpsert.mockResolvedValue(DB_SUBSCRIPTION);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: STRIPE_SUB_ID },
        data: { planChangedAt: null },
      }),
    );
  });

  it('customer.subscription.updated does not reset planChangedAt within same period', async () => {
    const stripeSub = makeStripeSub(); // same period start as DB_SUBSCRIPTION
    const existingWithChange = {
      ...DB_SUBSCRIPTION,
      planChangedAt: new Date('2026-07-15T00:00:00Z'),
    };

    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(existingWithChange);
    mocks.subscriptionUpsert.mockResolvedValue(existingWithChange);

    await POST(makeRequest());

    const planChangedAtResetCall = mocks.subscriptionUpdate.mock.calls.find(
      (call) => call[0]?.data?.planChangedAt === null,
    );
    expect(planChangedAtResetCall).toBeUndefined();
  });

  // ── customer.subscription.deleted ─────────────────────────────────────────

  it('customer.subscription.deleted marks subscription as CANCELED', async () => {
    const stripeSub = makeStripeSub({ status: 'canceled' });
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', stripeSub));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: STRIPE_SUB_ID },
      data: { status: 'CANCELED' },
    });
  });

  it('customer.subscription.deleted does not crash when subscription not in DB', async () => {
    const stripeSub = makeStripeSub();
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', stripeSub));
    mocks.subscriptionUpdateMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
  });

  // ── invoice.payment_succeeded ──────────────────────────────────────────────

  it('invoice.payment_succeeded creates invoice record', async () => {
    const invoice = makeStripeInvoice();
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_succeeded', invoice));
    mocks.subscriptionFindUnique.mockResolvedValue(DB_SUBSCRIPTION);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.invoiceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeInvoiceId: STRIPE_INVOICE_ID },
        create: expect.objectContaining({
          subscriptionId: DB_SUBSCRIPTION.id,
          amountPaid: 2900,
          currency: 'usd',
          paid: true,
        }),
        update: expect.objectContaining({ paid: true }),
      }),
    );
  });

  it('invoice.payment_succeeded sends payment confirmation email', async () => {
    const invoice = makeStripeInvoice();
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_succeeded', invoice));
    mocks.subscriptionFindUnique.mockResolvedValue(DB_SUBSCRIPTION);
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: DB_CUSTOMER.user.email }),
    );
  });

  it('invoice.payment_succeeded fetches subscription from Stripe if not in DB', async () => {
    const invoice = makeStripeInvoice();
    const stripeSub = makeStripeSub();
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_succeeded', invoice));
    mocks.subscriptionFindUnique.mockResolvedValue(null);
    mocks.subscriptionsRetrieve.mockResolvedValue(stripeSub);
    mocks.subscriptionUpsert.mockResolvedValue(DB_SUBSCRIPTION);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionsRetrieve).toHaveBeenCalledWith(STRIPE_SUB_ID);
  });

  it('invoice.payment_succeeded skips invoices with no subscription', async () => {
    const invoice = makeStripeInvoice({ subscription: null });
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_succeeded', invoice));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.invoiceUpsert).not.toHaveBeenCalled();
  });

  // ── invoice.payment_failed ─────────────────────────────────────────────────

  it('invoice.payment_failed marks subscription as PAST_DUE', async () => {
    const invoice = makeStripeInvoice();
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_failed', invoice));
    mocks.subscriptionFindUnique.mockResolvedValue(DB_SUBSCRIPTION);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: DB_SUBSCRIPTION.id },
      data: { status: 'PAST_DUE' },
    });
  });

  it('invoice.payment_failed does not send payment email', async () => {
    const invoice = makeStripeInvoice();
    mocks.constructEvent.mockReturnValue(makeEvent('invoice.payment_failed', invoice));
    mocks.subscriptionFindUnique.mockResolvedValue(DB_SUBSCRIPTION);

    await POST(makeRequest());

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  // ── Customer not found ─────────────────────────────────────────────────────

  it('returns 200 and warns when Stripe customer not in DB', async () => {
    const stripeSub = makeStripeSub();
    mocks.constructEvent.mockReturnValue(
      makeEvent('checkout.session.completed', {
        mode: 'subscription',
        subscription: STRIPE_SUB_ID,
      }),
    );
    mocks.subscriptionsRetrieve.mockResolvedValue(stripeSub);
    mocks.customerFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpsert).not.toHaveBeenCalled();
  });

  // ── Plan mapping ───────────────────────────────────────────────────────────

  it('maps unknown price ID to FREE plan', async () => {
    const stripeSub = makeStripeSub({
      items: { data: [{ price: { id: 'price_unknown', recurring: { interval: 'month' } } }] },
    });
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(null);

    await POST(makeRequest());

    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ plan: 'FREE' }),
      }),
    );
  });

  it('maps Stripe status past_due to PAST_DUE', async () => {
    const stripeSub = makeStripeSub({ status: 'past_due' });
    mocks.constructEvent.mockReturnValue(makeEvent('customer.subscription.updated', stripeSub));
    mocks.subscriptionFindUnique.mockResolvedValue(null);

    await POST(makeRequest());

    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'PAST_DUE' }),
      }),
    );
  });
});
