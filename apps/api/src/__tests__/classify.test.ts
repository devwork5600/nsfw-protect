import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  // Redis
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  redisOn: vi.fn(),
  redisQuit: vi.fn(),
  // Queue
  queueAdd: vi.fn(),
  queueClose: vi.fn(),
  // S3
  s3Send: vi.fn(),
  // Prisma
  apiKeyFindUnique: vi.fn(),
  customerFindUnique: vi.fn(),
  usageRecordAggregate: vi.fn(),
  usageRecordUpsert: vi.fn(),
  usageRecordUpdate: vi.fn(),
  apiKeyUpdate: vi.fn(),
  prismaExecuteRaw: vi.fn(),
  prismaDisconnect: vi.fn(),
  // pool
  poolEnd: vi.fn(),
  // sharp chain
  sharpToBuffer: vi.fn(),
}));

vi.mock('ioredis', () => ({
  Redis: vi.fn().mockImplementation(function () {
    return {
      on: mocks.redisOn,
      get: mocks.redisGet,
      set: mocks.redisSet,
      quit: mocks.redisQuit,
    };
  }),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(function () {
    return { add: mocks.queueAdd, close: mocks.queueClose };
  }),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(function () {
    return { send: mocks.s3Send };
  }),
  PutObjectCommand: vi.fn().mockImplementation(function (p) {
    return p;
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (p) {
    return p;
  }),
}));

vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(function () {
    const chain = {
      resize: vi.fn().mockReturnThis(),
      removeAlpha: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: mocks.sharpToBuffer,
    };
    return chain;
  }),
}));

vi.mock('@nsfw/db', () => {
  const prismaMock: Record<string, unknown> = {
    apiKey: { findUnique: mocks.apiKeyFindUnique, update: mocks.apiKeyUpdate },
    customer: { findUnique: mocks.customerFindUnique },
    usageRecord: {
      aggregate: mocks.usageRecordAggregate,
      upsert: mocks.usageRecordUpsert,
      update: mocks.usageRecordUpdate,
    },
    $executeRaw: mocks.prismaExecuteRaw,
    $disconnect: mocks.prismaDisconnect,
  };
  // $transaction just runs the callback against the same mocked client, so
  // existing assertions on e.g. mocks.usageRecordUpsert keep working unchanged.
  prismaMock.$transaction = vi.fn((fn: (tx: unknown) => unknown) => fn(prismaMock));

  return {
    prisma: prismaMock,
    pool: { end: mocks.poolEnd },
  };
});

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { buildApp } from '../app.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_RAW_KEY = 'nsfwprot_validkey123456789abcdef';

const DB_API_KEY = {
  id: 'apikey_db_id',
  userId: 'user_db_id',
  keyHash: 'hashed',
  revoked: false,
  expiresAt: null,
  isUnlimited: false,
  lastUsedAt: null,
  user: { id: 'user_db_id', email: 'user@test.com' },
};

const DB_CUSTOMER_FREE = {
  id: 'customer_db_id',
  subscriptions: [],
};

const DB_CUSTOMER_PRO = {
  id: 'customer_db_id',
  subscriptions: [{ plan: 'PRO', status: 'ACTIVE' }],
};

// What the worker publishes to Redis once classification finishes; /classify waits
// for this and returns it as the response body.
const DONE_RESULT = {
  status: 'done',
  result: [
    { label: 'sfw', score: 0.99 },
    { label: 'nsfw', score: 0.01 },
  ],
};

// Helper: build a minimal multipart body with one file part
function makeMultipartBody(
  filename = 'test.jpg',
  content = Buffer.from('fake-image'),
  mimeType = 'image/jpeg',
): { body: Buffer; contentType: string } {
  const boundary = 'TestBoundary1234567890';
  const CRLF = '\r\n';
  const preamble = Buffer.from(
    `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: ${mimeType}${CRLF}` +
      CRLF,
  );
  const epilogue = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
  return {
    body: Buffer.concat([preamble, content, epilogue]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /classify', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Default happy-path mock returns
    mocks.redisSet.mockResolvedValue('OK');
    // By default the worker has already finished, so the sync wait in /classify
    // resolves on its first poll.
    mocks.redisGet.mockResolvedValue(JSON.stringify(DONE_RESULT));
    mocks.redisQuit.mockResolvedValue('OK');
    mocks.queueAdd.mockResolvedValue({ id: 'job-123' });
    mocks.queueClose.mockResolvedValue(undefined);
    mocks.s3Send.mockResolvedValue({});
    mocks.sharpToBuffer.mockResolvedValue(Buffer.from('processed-image'));
    mocks.apiKeyFindUnique.mockResolvedValue(DB_API_KEY);
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_FREE);
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 0 } });
    mocks.usageRecordUpsert.mockResolvedValue({ id: 'usage_new_id' });
    mocks.usageRecordUpdate.mockResolvedValue({});
    mocks.apiKeyUpdate.mockResolvedValue({});
    mocks.prismaExecuteRaw.mockResolvedValue(undefined);

    app = await buildApp({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Step 1: plan changes ────────────────────────────────────────────────────

  it('enforces the new plan limit after a customer upgrades from STARTER to PRO', async () => {
    // The Stripe webhook updates the *same* subscription row in place on a plan
    // change (upsert keyed by stripeSubscriptionId), so by the time /classify
    // reads it, `plan` already reflects the new tier — there is only ever one
    // ACTIVE row per customer in the normal (non-out-of-order-webhook) case.
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_PRO);
    // Usage already exceeds the old STARTER limit (25000) but is still well
    // under the new PRO limit (250000).
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 30000 } });

    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(DONE_RESULT);
  });

  it('returns 403 with the PRO limit once usage exceeds it post-upgrade', async () => {
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_PRO);
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 250000 } });

    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({
      error: 'Monthly scan limit reached',
      plan: 'PRO',
      limit: 250000,
      currentUsage: 250000,
    });
  });
});

// ─── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    mocks.redisQuit.mockResolvedValue('OK');
    mocks.queueClose.mockResolvedValue(undefined);
    app = await buildApp({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });
});
