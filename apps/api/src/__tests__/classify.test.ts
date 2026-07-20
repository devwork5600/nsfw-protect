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
const HOME_PAGE_KEY = 'home-page-key-test';

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

const DB_CUSTOMER_STARTER = {
  id: 'customer_db_id',
  subscriptions: [{ plan: 'STARTER', status: 'ACTIVE' }],
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

  // ── Authentication ─────────────────────────────────────────────────────────

  it('returns 401 when x-api-key header is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/classify' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: 'API key missing' });
  });

  it('returns 401 when API key is not found in DB', async () => {
    mocks.apiKeyFindUnique.mockResolvedValue(null);
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': 'invalid-key' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: 'Invalid or expired API key' });
  });

  it('returns 401 when API key is revoked', async () => {
    mocks.apiKeyFindUnique.mockResolvedValue({ ...DB_API_KEY, revoked: true });
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: 'Invalid or expired API key' });
  });

  it('returns 401 when API key is expired', async () => {
    mocks.apiKeyFindUnique.mockResolvedValue({
      ...DB_API_KEY,
      expiresAt: new Date('2020-01-01'),
    });
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: 'Invalid or expired API key' });
  });

  // ── Rate limiting ──────────────────────────────────────────────────────────

  it('returns 403 when FREE plan limit (1000) is reached', async () => {
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_FREE);
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 1000 } });

    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({
      error: 'Monthly scan limit reached',
      plan: 'FREE',
      limit: 1000,
      currentUsage: 1000,
    });
  });

  it('returns 403 when STARTER plan limit (25000) is reached', async () => {
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_STARTER);
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 25000 } });

    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ plan: 'STARTER', limit: 25000 });
  });

  it('skips rate limit check for unlimited API keys', async () => {
    mocks.apiKeyFindUnique.mockResolvedValue({ ...DB_API_KEY, isUnlimited: true });

    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.usageRecordAggregate).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  // ── File validation ────────────────────────────────────────────────────────

  it('returns 400 when no file is provided and does NOT increment usage', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': 'multipart/form-data; boundary=X' },
      payload: '--X--\r\n',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'No image provided' });
    expect(mocks.usageRecordUpsert).not.toHaveBeenCalled();
  });

  it('returns 400 when the uploaded file is not an image and does NOT increment usage', async () => {
    const { body, contentType } = makeMultipartBody(
      'test.txt',
      Buffer.from('not an image'),
      'text/plain',
    );
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'Uploaded file must be an image' });
    expect(mocks.usageRecordUpsert).not.toHaveBeenCalled();
    expect(mocks.s3Send).not.toHaveBeenCalled();
  });

  // ── Happy path — full classification ──────────────────────────────────────

  it('returns 200 with the classification result for valid key and file', async () => {
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

  it('returns 500 when the worker reports a classification error', async () => {
    mocks.redisGet.mockResolvedValue(JSON.stringify({ status: 'error', error: 'model exploded' }));

    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toMatchObject({ error: 'model exploded' });
  });

  it('returns 202 with a plain pending status when the worker does not finish within the wait window', async () => {
    // Rebuild the app with a zero wait window so the still-pending result times out
    // immediately instead of stalling the test for the real 30s.
    await app.close();
    process.env.CLASSIFY_WAIT_TIMEOUT_MS = '0';
    process.env.CLASSIFY_WAIT_POLL_MS = '1';
    try {
      app = await buildApp({ logger: false });
      mocks.redisGet.mockResolvedValue(JSON.stringify({ status: 'pending' }));

      const { body, contentType } = makeMultipartBody();
      const res = await app.inject({
        method: 'POST',
        url: '/classify',
        headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
        payload: body,
      });

      expect(res.statusCode).toBe(202);
      // jobIds are internal and must never leak to clients.
      expect(res.json()).toEqual({ status: 'pending' });
      // A 202 gives the customer no usable result, so the scan is refunded.
      expect(mocks.usageRecordUpdate).toHaveBeenCalledWith({
        where: { id: 'usage_new_id' },
        data: { requestCount: { decrement: 1 }, imageCount: { decrement: 1 } },
      });
    } finally {
      delete process.env.CLASSIFY_WAIT_TIMEOUT_MS;
      delete process.env.CLASSIFY_WAIT_POLL_MS;
    }
  });

  it('upserts the usage record for the current billing period in a single call', async () => {
    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.usageRecordUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          apiKeyId_periodStart_periodEnd: expect.objectContaining({
            apiKeyId: DB_API_KEY.id,
          }),
        },
        update: { requestCount: { increment: 1 }, imageCount: { increment: 1 } },
        create: expect.objectContaining({
          userId: DB_API_KEY.userId,
          apiKeyId: DB_API_KEY.id,
          requestCount: 1,
          imageCount: 1,
        }),
      }),
    );
  });

  it('updates API key lastUsedAt after successful file upload', async () => {
    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.apiKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DB_API_KEY.id },
        data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      }),
    );
  });

  it('enqueues job with jobId and r2Key after successful upload', async () => {
    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    // jobId is internal now (not in the response), so read it off the enqueue call.
    const { jobId } = mocks.queueAdd.mock.calls[0][1];
    expect(typeof jobId).toBe('string');
    expect(mocks.queueAdd).toHaveBeenCalledWith(
      'nsfw-job',
      expect.objectContaining({ jobId, r2Key: `uploads/${jobId}.jpg` }),
      expect.any(Object),
    );
  });

  it('sets Redis pending status before enqueuing', async () => {
    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    const { jobId } = mocks.queueAdd.mock.calls[0][1];
    expect(mocks.redisSet).toHaveBeenCalledWith(
      `nsfw:result:${jobId}`,
      JSON.stringify({ status: 'pending' }),
      'EX',
      60 * 60,
    );
  });

  // ── Home page key ──────────────────────────────────────────────────────────

  it('home page key bypasses DB auth entirely', async () => {
    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': HOME_PAGE_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.apiKeyFindUnique).not.toHaveBeenCalled();
    expect(mocks.usageRecordUpsert).not.toHaveBeenCalled();
  });

  it('home page key returns 400 when no file provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: {
        'x-api-key': HOME_PAGE_KEY,
        'content-type': 'multipart/form-data; boundary=X',
      },
      payload: '--X--\r\n',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'No image provided' });
  });

  it('home page key returns 200 with the classification result and no usage tracking', async () => {
    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': HOME_PAGE_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(DONE_RESULT);
    expect(mocks.usageRecordUpsert).not.toHaveBeenCalled();
  });

  // ── S3 / processing failure ────────────────────────────────────────────────

  it('returns 500 when S3 upload fails', async () => {
    mocks.s3Send.mockRejectedValue(new Error('S3 connection refused'));

    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toMatchObject({ error: 'Failed to process image' });
    // A failed upload must not count against the user's quota.
    expect(mocks.usageRecordUpsert).not.toHaveBeenCalled();
    expect(mocks.apiKeyUpdate).not.toHaveBeenCalled();
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
