import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  // Prisma
  userFindUnique: vi.fn(),
  apiKeyUpdateMany: vi.fn(),
  apiKeyCreate: vi.fn(),
  apiKeyFindMany: vi.fn(),
  // Next
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/auth-session', () => ({ getUser: mocks.getUser }));

vi.mock('@nsfw/db', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    apiKey: {
      updateMany: mocks.apiKeyUpdateMany,
      create: mocks.apiKeyCreate,
      findMany: mocks.apiKeyFindMany,
    },
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { generateAdminMagicKey, getApiKeys } from '../actions/api-key-actions';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER = { id: 'user_id', email: 'admin@test.com' };
const DB_USER_ADMIN = { id: 'user_id', role: 'admin' };
const DB_USER_REGULAR = { id: 'user_id', role: 'user' };

// ─── generateAdminMagicKey ────────────────────────────────────────────────────

describe('generateAdminMagicKey', () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue(USER);
    mocks.userFindUnique.mockResolvedValue(DB_USER_ADMIN);
    mocks.apiKeyUpdateMany.mockResolvedValue({ count: 0 });
    mocks.apiKeyCreate.mockResolvedValue({ id: 'new_key_id' });
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  it('throws Unauthorized when no session', async () => {
    mocks.getUser.mockResolvedValue(null);
    await expect(generateAdminMagicKey()).rejects.toThrow('Unauthorized');
  });

  it('throws when user role is not admin', async () => {
    mocks.userFindUnique.mockResolvedValue(DB_USER_REGULAR);
    await expect(generateAdminMagicKey()).rejects.toThrow('Only admins can generate magic keys.');
  });

  it('does not create a key when user is not admin', async () => {
    mocks.userFindUnique.mockResolvedValue(DB_USER_REGULAR);
    await expect(generateAdminMagicKey()).rejects.toThrow();
    expect(mocks.apiKeyCreate).not.toHaveBeenCalled();
  });

  // ── One active key enforcement ─────────────────────────────────────────────

  it('revokes all existing magic keys before creating a new one', async () => {
    mocks.apiKeyUpdateMany.mockResolvedValue({ count: 1 });

    await generateAdminMagicKey();

    expect(mocks.apiKeyUpdateMany).toHaveBeenCalledWith({
      where: { userId: USER.id, name: 'Magic Unlimited Key', revoked: false },
      data: { revoked: true },
    });
  });

  it('revokes existing keys BEFORE creating the new key', async () => {
    const callOrder: string[] = [];
    mocks.apiKeyUpdateMany.mockImplementation(async () => {
      callOrder.push('updateMany');
      return { count: 1 };
    });
    mocks.apiKeyCreate.mockImplementation(async () => {
      callOrder.push('create');
      return { id: 'new_key_id' };
    });

    await generateAdminMagicKey();

    expect(callOrder).toEqual(['updateMany', 'create']);
  });

  it('still creates the key when no existing magic keys exist', async () => {
    mocks.apiKeyUpdateMany.mockResolvedValue({ count: 0 });

    await generateAdminMagicKey();

    expect(mocks.apiKeyCreate).toHaveBeenCalled();
  });

  // ── Created key shape ──────────────────────────────────────────────────────

  it('creates key with correct name and unlimited flag', async () => {
    await generateAdminMagicKey();

    expect(mocks.apiKeyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER.id,
          name: 'Magic Unlimited Key',
          isUnlimited: true,
          environment: 'LIVE',
          requestsPerMinute: 1000000,
        }),
      }),
    );
  });

  it('stores a hashed key (not the raw key) in DB', async () => {
    await generateAdminMagicKey();

    const createCall = mocks.apiKeyCreate.mock.calls[0][0];
    const { keyHash, keyPrefix } = createCall.data;

    // keyHash should be a 64-char hex SHA-256 string
    expect(keyHash).toMatch(/^[a-f0-9]{64}$/);
    // keyPrefix should be the first 7 chars (sk_ + 4)
    expect(keyPrefix).toMatch(/^sk_[a-f0-9]{4}$/);
  });

  it('returns the raw key (not the hash)', async () => {
    const rawKey = await generateAdminMagicKey();

    expect(typeof rawKey).toBe('string');
    expect(rawKey.startsWith('sk_')).toBe(true);
    // Raw key should be much longer than the 7-char prefix
    expect(rawKey.length).toBeGreaterThan(7);
  });

  it('raw key returned matches prefix stored in DB', async () => {
    const rawKey = await generateAdminMagicKey();

    const createCall = mocks.apiKeyCreate.mock.calls[0][0];
    expect(rawKey.substring(0, 7)).toBe(createCall.data.keyPrefix);
  });

  it('generates a different key each time', async () => {
    const key1 = await generateAdminMagicKey();
    const key2 = await generateAdminMagicKey();
    expect(key1).not.toBe(key2);
  });

  it('revalidates the API keys page after creation', async () => {
    await generateAdminMagicKey();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard/api-keys');
  });
});

// ─── getApiKeys ───────────────────────────────────────────────────────────────

describe('getApiKeys', () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue(USER);
    mocks.apiKeyFindMany.mockResolvedValue([]);
  });

  it('throws Unauthorized when no session', async () => {
    mocks.getUser.mockResolvedValue(null);
    await expect(getApiKeys()).rejects.toThrow('Unauthorized');
  });

  it('returns only non-revoked keys for the current user', async () => {
    await getApiKeys();

    expect(mocks.apiKeyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER.id, revoked: false },
      }),
    );
  });

  it('selects name and isUnlimited fields (required for magic key detection)', async () => {
    await getApiKeys();

    const call = mocks.apiKeyFindMany.mock.calls[0][0];
    expect(call.select).toMatchObject({ name: true, isUnlimited: true });
  });

  it('returns the list of keys', async () => {
    const keys = [{ id: 'k1', name: 'Default Key', isUnlimited: false, revoked: false }];
    mocks.apiKeyFindMany.mockResolvedValue(keys);

    const result = await getApiKeys();
    expect(result).toEqual(keys);
  });
});
