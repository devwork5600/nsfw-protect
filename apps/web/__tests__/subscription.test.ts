import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  // Prisma
  customerFindUnique: vi.fn(),
  subscriptionUpdate: vi.fn(),
  // Stripe
  subscriptionsRetrieve: vi.fn(),
  subscriptionsUpdate: vi.fn(),
  invoicesCreatePreview: vi.fn(),
  // Next
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/auth-session', () => ({ getUser: mocks.getUser }));

vi.mock('@nsfw/db', () => ({
  prisma: {
    customer: { findUnique: mocks.customerFindUnique },
    subscription: { update: mocks.subscriptionUpdate },
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      subscriptions: {
        retrieve: mocks.subscriptionsRetrieve,
        update: mocks.subscriptionsUpdate,
      },
      invoices: { createPreview: mocks.invoicesCreatePreview },
    };
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { manageSubscription, cancelSubscription } from '../actions/subscription';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER = { id: 'user_id', email: 'user@test.com' };

const PRICE_STARTER = 'price_starter_test';
const PRICE_PRO = 'price_pro_test';
const PRICE_FREE = 'price_free_test';

const PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const PERIOD_END = new Date('2026-08-01T00:00:00.000Z');

const BASE_SUBSCRIPTION = {
  id: 'sub_db_id',
  stripeSubscriptionId: 'sub_stripe_123',
  stripePriceId: PRICE_STARTER,
  plan: 'STARTER',
  status: 'ACTIVE',
  cancelAtPeriodEnd: false,
  currentPeriodStart: PERIOD_START,
  currentPeriodEnd: PERIOD_END,
  planChangedAt: null as Date | null,
};

const STRIPE_SUB = {
  id: 'sub_stripe_123',
  items: { data: [{ id: 'si_item_123', price: { id: PRICE_STARTER } }] },
};

function makeCustomer(subOverrides: Partial<typeof BASE_SUBSCRIPTION> = {}) {
  return {
    id: 'customer_db_id',
    stripeCustomerId: 'cus_test_123',
    subscriptions: [{ ...BASE_SUBSCRIPTION, ...subOverrides }],
  };
}

// ─── manageSubscription ───────────────────────────────────────────────────────

describe('manageSubscription', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_STARTER_MONTHLY = PRICE_STARTER;
    process.env.STRIPE_PRICE_PRO_MONTHLY = PRICE_PRO;
    process.env.STRIPE_PRICE_FREE_MONTHLY = PRICE_FREE;

    mocks.getUser.mockResolvedValue(USER);
    mocks.customerFindUnique.mockResolvedValue(makeCustomer());
    mocks.subscriptionsRetrieve.mockResolvedValue(STRIPE_SUB);
    mocks.subscriptionsUpdate.mockResolvedValue({});
    mocks.subscriptionUpdate.mockResolvedValue({});
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  it('throws Unauthorized when no session', async () => {
    mocks.getUser.mockResolvedValue(null);
    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow('Unauthorized');
  });

  it('throws when customer not found', async () => {
    mocks.customerFindUnique.mockResolvedValue(null);
    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow('Customer not found');
  });

  it('throws when no active subscription exists', async () => {
    mocks.customerFindUnique.mockResolvedValue({ ...makeCustomer(), subscriptions: [] });
    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow(
      'No active subscription found to manage.',
    );
  });

  // ── planChangedAt lock ─────────────────────────────────────────────────────

  it('throws when planChangedAt is after currentPeriodStart (locked)', async () => {
    const planChangedAt = new Date('2026-07-15T12:00:00.000Z'); // mid-cycle
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt }));

    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow(
      "You've already changed your plan this billing cycle.",
    );
  });

  it('throws when planChangedAt equals currentPeriodStart exactly (edge case)', async () => {
    // Same timestamp as period start — >= operator means this is still locked
    const planChangedAt = new Date(PERIOD_START.getTime());
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt }));

    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow(
      "You've already changed your plan this billing cycle.",
    );
  });

  it('allows change when planChangedAt is from a previous billing cycle', async () => {
    const planChangedAt = new Date('2026-06-20T00:00:00.000Z'); // before period start
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt }));

    await expect(manageSubscription(PRICE_PRO)).resolves.not.toThrow();
    expect(mocks.subscriptionsUpdate).toHaveBeenCalled();
  });

  it('allows change when planChangedAt is null', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt: null }));

    await expect(manageSubscription(PRICE_PRO)).resolves.not.toThrow();
    expect(mocks.subscriptionsUpdate).toHaveBeenCalled();
  });

  it('lock does NOT apply to cancellations (priceId = null)', async () => {
    const planChangedAt = new Date('2026-07-15T00:00:00.000Z');
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt }));

    // Cancel should succeed even when locked
    await expect(manageSubscription(null)).resolves.not.toThrow();
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_stripe_123',
      expect.objectContaining({ cancel_at_period_end: true }),
    );
  });

  it('lock error message includes the unlock date', async () => {
    const planChangedAt = new Date('2026-07-15T00:00:00.000Z');
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ planChangedAt }));

    await expect(manageSubscription(PRICE_PRO)).rejects.toThrow('August 1, 2026');
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  it('cancels subscription by setting cancel_at_period_end on Stripe', async () => {
    await manageSubscription(null);

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith('sub_stripe_123', {
      cancel_at_period_end: true,
    });
  });

  it('cancels subscription by updating DB cancelAtPeriodEnd', async () => {
    await manageSubscription(null);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub_db_id' },
      data: { cancelAtPeriodEnd: true },
    });
  });

  it('cancelSubscription() delegates to manageSubscription(null)', async () => {
    await cancelSubscription();

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_stripe_123',
      expect.objectContaining({ cancel_at_period_end: true }),
    );
  });

  // ── Same plan ──────────────────────────────────────────────────────────────

  it('returns early without Stripe call when switching to same plan (not canceling)', async () => {
    // Same priceId, cancelAtPeriodEnd: false
    await manageSubscription(PRICE_STARTER);

    expect(mocks.subscriptionsUpdate).not.toHaveBeenCalled();
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
  });

  it('un-cancels when switching to same plan that was set to cancel', async () => {
    mocks.customerFindUnique.mockResolvedValue(makeCustomer({ cancelAtPeriodEnd: true }));

    await manageSubscription(PRICE_STARTER);

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith('sub_stripe_123', {
      cancel_at_period_end: false,
    });
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub_db_id' },
      data: { cancelAtPeriodEnd: false },
    });
  });

  // ── Upgrade / downgrade proration ─────────────────────────────────────────

  it('uses always_invoice proration for Starter → Pro upgrade', async () => {
    // Current: STARTER, switching to PRO
    await manageSubscription(PRICE_PRO);

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_stripe_123',
      expect.objectContaining({ proration_behavior: 'always_invoice' }),
    );
  });

  it('uses create_prorations proration for Pro → Starter downgrade', async () => {
    mocks.customerFindUnique.mockResolvedValue(
      makeCustomer({ stripePriceId: PRICE_PRO, plan: 'PRO' }),
    );

    await manageSubscription(PRICE_STARTER);

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_stripe_123',
      expect.objectContaining({ proration_behavior: 'create_prorations' }),
    );
  });

  it('passes prorationDate to Stripe when provided', async () => {
    const prorationDate = 1751328000;
    await manageSubscription(PRICE_PRO, prorationDate);

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_stripe_123',
      expect.objectContaining({ proration_date: prorationDate }),
    );
  });

  // ── planChangedAt stamped on success ──────────────────────────────────────

  it('stamps planChangedAt in DB after successful plan change', async () => {
    const before = new Date();
    await manageSubscription(PRICE_PRO);
    const after = new Date();

    const call = mocks.subscriptionUpdate.mock.calls[0][0];
    expect(call.data.planChangedAt).toBeInstanceOf(Date);
    expect(call.data.planChangedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(call.data.planChangedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('updates plan tier correctly in DB for upgrade', async () => {
    await manageSubscription(PRICE_PRO);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'PRO', stripePriceId: PRICE_PRO }),
      }),
    );
  });

  it('updates plan tier correctly in DB for downgrade', async () => {
    mocks.customerFindUnique.mockResolvedValue(
      makeCustomer({ stripePriceId: PRICE_PRO, plan: 'PRO' }),
    );

    await manageSubscription(PRICE_STARTER);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'STARTER', stripePriceId: PRICE_STARTER }),
      }),
    );
  });

  it('calls revalidatePath after any change', async () => {
    await manageSubscription(PRICE_PRO);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard/billing');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/billing');
  });
});
