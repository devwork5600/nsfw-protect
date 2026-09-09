import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  poolCtor: vi.fn(),
  poolEnd: vi.fn(),
  PrismaPgCtor: vi.fn(),
  PrismaClientCtor: vi.fn(),
}));

vi.mock('pg', () => ({
  default: { Pool: mocks.poolCtor },
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: mocks.PrismaPgCtor,
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: mocks.PrismaClientCtor,
}));

// Each test gets a fresh module instance via vi.resetModules() + dynamic import,
// since getDb()'s laziness relies on module-scoped `let _prisma`/`_pool` state
// that would otherwise leak between test cases.
// `new pg.Pool(...)` / `new PrismaClient(...)` call these as constructors, so
// their mock implementations must be plain `function`s — an arrow function
// can't be invoked with `new`.
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('DATABASE_URL', undefined);
  mocks.poolCtor.mockReset().mockImplementation(function () {
    return { end: mocks.poolEnd };
  });
  mocks.poolEnd.mockReset().mockResolvedValue(undefined);
  mocks.PrismaPgCtor.mockReset();
  mocks.PrismaClientCtor.mockReset().mockImplementation(function () {
    return {};
  });
});

describe('getDb', () => {
  it('throws when DATABASE_URL is not set', async () => {
    const { getDb } = await import('../index.js');
    expect(() => getDb()).toThrow('DATABASE_URL environment variable is not set');
  });

  it('constructs the pool, adapter, and client exactly once and reuses them on subsequent calls', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    const { getDb } = await import('../index.js');

    const first = getDb();
    const second = getDb();

    expect(mocks.poolCtor).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtor).toHaveBeenCalledWith({ connectionString: 'postgres://test' });
    expect(mocks.PrismaClientCtor).toHaveBeenCalledTimes(1);
    expect(first.prisma).toBe(second.prisma);
    expect(first.pool).toBe(second.pool);
  });

  it('ends the pool and rethrows if constructing PrismaClient throws', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    mocks.PrismaClientCtor.mockImplementation(function () {
      throw new Error('bad adapter');
    });
    const { getDb } = await import('../index.js');

    expect(() => getDb()).toThrow('bad adapter');
    expect(mocks.poolEnd).toHaveBeenCalledOnce();
  });

  it('retries construction on the next call after a failed attempt', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    mocks.PrismaClientCtor.mockImplementationOnce(function () {
      throw new Error('bad adapter');
    });
    const { getDb } = await import('../index.js');

    expect(() => getDb()).toThrow('bad adapter');
    // _prisma was never set on the failed attempt, so the next call retries
    // from scratch rather than being stuck on a half-initialized state.
    const result = getDb();
    expect(result.prisma).toBeDefined();
    expect(mocks.poolCtor).toHaveBeenCalledTimes(2);
  });
});

describe('prisma and pool proxies', () => {
  it('forward property access to the lazily-initialized real client and pool', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    mocks.poolCtor.mockImplementation(function () {
      return { end: mocks.poolEnd, someMethod: 'pool-value' };
    });
    mocks.PrismaClientCtor.mockImplementation(function () {
      return { user: 'prisma-value' };
    });

    const mod = await import('../index.js');

    expect(mod.prisma.user).toBe('prisma-value');
    expect(mod.pool.someMethod).toBe('pool-value');
  });

  it('do not touch DATABASE_URL until a property is actually accessed', async () => {
    // No DATABASE_URL stubbed here — importing the module and holding a
    // reference to the proxies must not eagerly call getDb().
    const mod = await import('../index.js');
    expect(mod.prisma).toBeDefined();
    expect(mocks.PrismaClientCtor).not.toHaveBeenCalled();
  });
});
