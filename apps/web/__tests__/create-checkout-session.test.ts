import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  // Prisma
  customerFindUnique: vi.fn(),
  customerCreate: vi.fn(),
  // Stripe
  customersCreate: vi.fn(),
  checkoutSessionsCreate: vi.fn(),
  // ./subscription
  manageSubscription: vi.fn(),
  // Next
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth/auth-session', () => ({ getUser: mocks.getUser }));

vi.mock('@nsfw/db', () => ({
  prisma: {
    customer: { findUnique: mocks.customerFindUnique, create: mocks.customerCreate },
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      customers: { create: mocks.customersCreate },
      checkout: { sessions: { create: mocks.checkoutSessionsCreate } },
    };
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

vi.mock('../actions/subscription', () => ({ manageSubscription: mocks.manageSubscription }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { createCheckoutSession } from '../actions/create-checkout-session';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER = { id: 'user_id', email: 'user@test.com', name: 'Test User' };

const PRICE_STARTER = 'price_starter_test';
const PRICE_PRO = 'price_pro_test';

const STRIPE_CUSTOMER_ID = 'cus_test_123';
const CHECKOUT_URL = 'https://checkout.stripe.com/session_abc123';

function makeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'customer_db_id',
    stripeCustomerId: STRIPE_CUSTOMER_ID,
    userId: USER.id,
    subscriptions: [],
    ...overrides,
  };
}

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.STRIPE_PRICE_STARTER_MONTHLY = PRICE_STARTER;
    process.env.STRIPE_PRICE_PRO_MONTHLY = PRICE_PRO;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.BETTER_AUTH_URL;

    mocks.getUser.mockResolvedValue(USER);
    mocks.customerFindUnique.mockResolvedValue(null);
    mocks.customersCreate.mockResolvedValue({ id: STRIPE_CUSTOMER_ID });
    mocks.customerCreate.mockResolvedValue(makeCustomer());
    mocks.checkoutSessionsCreate.mockResolvedValue({ url: CHECKOUT_URL });
    mocks.manageSubscription.mockResolvedValue(undefined);
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  it('throws Unauthorized when no session', async () => {
    mocks.getUser.mockResolvedValue(null);
    await expect(createCheckoutSession(PRICE_STARTER)).rejects.toThrow('Unauthorized');
  });

  it('rejects a priceId that is not an allowed plan price', async () => {
    await expect(createCheckoutSession('price_some_other_product')).rejects.toThrow(
      'Invalid plan selected',
    );
    expect(mocks.checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('rejects an empty priceId', async () => {
    await expect(createCheckoutSession('')).rejects.toThrow('Invalid plan selected');
  });

  it('does not hit Stripe or Prisma at all when the priceId is rejected', async () => {
    await expect(createCheckoutSession('price_bogus')).rejects.toThrow();
    expect(mocks.customerFindUnique).not.toHaveBeenCalled();
    expect(mocks.customersCreate).not.toHaveBeenCalled();
  });

  // ── Existing active subscription → delegate instead of creating a new one ──

  it('delegates to manageSubscription when the user already has an active subscription', async () => {
    mocks.customerFindUnique.mockResolvedValue(
      makeCustomer({ subscriptions: [{ id: 'sub_1', status: 'ACTIVE' }] }),
    );

    await createCheckoutSession(PRICE_PRO);

    expect(mocks.manageSubscription).toHaveBeenCalledWith(PRICE_PRO);
    expect(mocks.customersCreate).not.toHaveBeenCalled();
    expect(mocks.checkoutSessionsCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  // ── Brand-new customer (no Customer row at all) ─────────────────────────────

  it('creates a Stripe customer and a Prisma Customer row for a first-time subscriber', async () => {
    mocks.customerFindUnique.mockResolvedValue(null);

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.customersCreate).toHaveBeenCalledWith({
      email: USER.email,
      name: USER.name,
    });
    expect(mocks.customerCreate).toHaveBeenCalledWith({
      data: { userId: USER.id, stripeCustomerId: STRIPE_CUSTOMER_ID },
    });
  });

  it('creates the checkout session against the newly created Stripe customer', async () => {
    mocks.customerFindUnique.mockResolvedValue(null);
    mocks.customersCreate.mockResolvedValue({ id: 'cus_new_456' });
    mocks.customerCreate.mockResolvedValue(makeCustomer({ stripeCustomerId: 'cus_new_456' }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_new_456' }),
    );
  });

  // ── Existing customer, no active subscription (e.g. previously canceled) ──

  it('reuses the existing Stripe customer without creating a new one', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.customersCreate).not.toHaveBeenCalled();
    expect(mocks.customerCreate).not.toHaveBeenCalled();
    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: STRIPE_CUSTOMER_ID }),
    );
  });

  // ── Checkout session shape ──────────────────────────────────────────────────

  it('creates a subscription-mode checkout session for the requested price', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_PRO);

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: PRICE_PRO, quantity: 1 }],
      }),
    );
  });

  it('redirects to the Stripe-hosted checkout URL', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.redirect).toHaveBeenCalledWith(CHECKOUT_URL);
  });

  // ── success_url / cancel_url resolution ─────────────────────────────────────

  it('builds success/cancel URLs from NEXT_PUBLIC_APP_URL when set', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://staging.example.com';
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://staging.example.com/dashboard/billing?success=1',
        cancel_url: 'https://staging.example.com/billing?canceled=1',
      }),
    );
  });

  it('falls back to BETTER_AUTH_URL when NEXT_PUBLIC_APP_URL is unset', async () => {
    process.env.BETTER_AUTH_URL = 'http://localhost:3001';
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'http://localhost:3001/dashboard/billing?success=1',
      }),
    );
  });

  it('falls back to the production domain when no base URL env var is set', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ subscriptions: [] }));

    await createCheckoutSession(PRICE_STARTER);

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://nsfw-protect.com/dashboard/billing?success=1',
        cancel_url: 'https://nsfw-protect.com/billing?canceled=1',
      }),
    );
  });
});
