import { describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ RedisCtor: vi.fn() }));

vi.mock('ioredis', () => ({
  Redis: mocks.RedisCtor,
}));

import { createRedisConnection } from '../index.js';

describe('createRedisConnection', () => {
  it('does not enable TLS for a plain local redis:// URL', () => {
    const { bullmqConnection } = createRedisConnection('redis://localhost:6379');

    expect(bullmqConnection).toEqual({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(mocks.RedisCtor).toHaveBeenCalledWith(
      'redis://localhost:6379',
      expect.objectContaining({ maxRetriesPerRequest: null }),
    );
    const passedOptions = mocks.RedisCtor.mock.calls[0][1];
    expect(passedOptions.tls).toBeUndefined();
  });

  it('enables TLS for a rediss:// URL and decodes the password', () => {
    const { bullmqConnection } = createRedisConnection('rediss://user:p%40ss@host:6380');

    expect(bullmqConnection).toEqual({
      host: 'host',
      port: 6380,
      password: 'p@ss',
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: null,
    });
  });

  it('enables TLS for a plain redis:// URL when the host is Upstash, since Upstash serves TLS on the plain port', () => {
    const { bullmqConnection } = createRedisConnection('redis://:secret@my-db.upstash.io:6379');

    expect(bullmqConnection.tls).toEqual({ rejectUnauthorized: false });
    expect(bullmqConnection.password).toBe('secret');
  });

  it('defaults the port to 6379 when the URL omits it', () => {
    const { bullmqConnection } = createRedisConnection('redis://localhost');

    expect(bullmqConnection.port).toBe(6379);
  });

  it('omits password from bullmqConnection when the URL has none', () => {
    const { bullmqConnection } = createRedisConnection('redis://localhost:6379');

    expect(bullmqConnection).not.toHaveProperty('password');
  });

  it('always forces maxRetriesPerRequest to null on bullmqConnection regardless of passed options', () => {
    const { bullmqConnection } = createRedisConnection('redis://localhost:6379', {
      // @ts-expect-error intentionally passing a conflicting option to prove it's ignored for bullmqConnection
      maxRetriesPerRequest: 5,
    });

    expect(bullmqConnection.maxRetriesPerRequest).toBeNull();
  });

  it('lets caller options override the ioredis connection defaults', () => {
    createRedisConnection('redis://localhost:6379', { lazyConnect: true });

    const passedOptions = mocks.RedisCtor.mock.calls[0][1];
    expect(passedOptions.lazyConnect).toBe(true);
  });
});
