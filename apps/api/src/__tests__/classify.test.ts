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
  usageRecordFindFirst: vi.fn(),
  usageRecordCreate: vi.fn(),
  usageRecordUpdate: vi.fn(),
  apiKeyUpdate: vi.fn(),
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

vi.mock('@nsfw/db', () => ({
  prisma: {
    apiKey: { findUnique: mocks.apiKeyFindUnique, update: mocks.apiKeyUpdate },
    customer: { findUnique: mocks.customerFindUnique },
    usageRecord: {
      aggregate: mocks.usageRecordAggregate,
      findFirst: mocks.usageRecordFindFirst,
      create: mocks.usageRecordCreate,
      update: mocks.usageRecordUpdate,
    },
    $disconnect: mocks.prismaDisconnect,
  },
  pool: { end: mocks.poolEnd },
}));

vi.mock('@nsfw/auth', () => ({
  auth: { handler: vi.fn().mockResolvedValue(new Response('ok')) },
}));

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

// Helper: build a minimal multipart body with one file part
function makeMultipartBody(
  filename = 'test.jpg',
  content = Buffer.from('fake-image'),
): { body: Buffer; contentType: string } {
  const boundary = 'TestBoundary1234567890';
  const CRLF = '\r\n';
  const preamble = Buffer.from(
    `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: image/jpeg${CRLF}` +
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
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisQuit.mockResolvedValue('OK');
    mocks.queueAdd.mockResolvedValue({ id: 'job-123' });
    mocks.queueClose.mockResolvedValue(undefined);
    mocks.s3Send.mockResolvedValue({});
    mocks.sharpToBuffer.mockResolvedValue(Buffer.from('processed-image'));
    mocks.apiKeyFindUnique.mockResolvedValue(DB_API_KEY);
    mocks.customerFindUnique.mockResolvedValue(DB_CUSTOMER_FREE);
    mocks.usageRecordAggregate.mockResolvedValue({ _sum: { imageCount: 0 } });
    mocks.usageRecordFindFirst.mockResolvedValue(null);
    mocks.usageRecordCreate.mockResolvedValue({ id: 'usage_new_id' });
    mocks.usageRecordUpdate.mockResolvedValue({});
    mocks.apiKeyUpdate.mockResolvedValue({});

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
    expect(mocks.usageRecordCreate).not.toHaveBeenCalled();
    expect(mocks.usageRecordUpdate).not.toHaveBeenCalled();
  });

  // ── Happy path — full classification ──────────────────────────────────────

  it('returns 200 with jobId for valid key and file', async () => {
    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json).toHaveProperty('jobId');
    expect(typeof json.jobId).toBe('string');
  });

  it('creates a new usage record on first request this month', async () => {
    mocks.usageRecordFindFirst.mockResolvedValue(null);

    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.usageRecordCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: DB_API_KEY.userId,
          apiKeyId: DB_API_KEY.id,
          requestCount: 1,
          imageCount: 1,
        }),
      }),
    );
    expect(mocks.usageRecordUpdate).not.toHaveBeenCalled();
  });

  it('increments existing usage record when one already exists this month', async () => {
    const existingUsage = { id: 'usage_existing_id' };
    mocks.usageRecordFindFirst.mockResolvedValue(existingUsage);

    const { body, contentType } = makeMultipartBody();
    await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(mocks.usageRecordUpdate).toHaveBeenCalledWith({
      where: { id: 'usage_existing_id' },
      data: { requestCount: { increment: 1 }, imageCount: { increment: 1 } },
    });
    expect(mocks.usageRecordCreate).not.toHaveBeenCalled();
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
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    const { jobId } = res.json();
    expect(mocks.queueAdd).toHaveBeenCalledWith(
      'nsfw-job',
      expect.objectContaining({ jobId, r2Key: `uploads/${jobId}.jpg` }),
      expect.any(Object),
    );
  });

  it('sets Redis pending status before enqueuing', async () => {
    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': VALID_RAW_KEY, 'content-type': contentType },
      payload: body,
    });

    const { jobId } = res.json();
    expect(mocks.redisSet).toHaveBeenCalledWith(
      `nsfw:result:${jobId}`,
      JSON.stringify({ status: 'pending' }),
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
    expect(mocks.usageRecordCreate).not.toHaveBeenCalled();
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

  it('home page key returns 200 with jobId and no usage tracking', async () => {
    const { body, contentType } = makeMultipartBody();
    const res = await app.inject({
      method: 'POST',
      url: '/classify',
      headers: { 'x-api-key': HOME_PAGE_KEY, 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('jobId');
    expect(mocks.usageRecordCreate).not.toHaveBeenCalled();
    expect(mocks.usageRecordUpdate).not.toHaveBeenCalled();
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
  });
});

// ─── GET /result/:jobId ───────────────────────────────────────────────────────

describe('GET /result/:jobId', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    mocks.redisQuit.mockResolvedValue('OK');
    mocks.queueClose.mockResolvedValue(undefined);
    app = await buildApp({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 404 when job not found in Redis', async () => {
    mocks.redisGet.mockResolvedValue(null);
    const res = await app.inject({ method: 'GET', url: '/result/unknown-job' });
    expect(res.statusCode).toBe(404);
  });

  it('returns parsed result when job exists in Redis', async () => {
    const result = { status: 'done', result: { isNsfw: false, score: 0.02 } };
    mocks.redisGet.mockResolvedValue(JSON.stringify(result));

    const res = await app.inject({ method: 'GET', url: '/result/job-123' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(result);
    expect(mocks.redisGet).toHaveBeenCalledWith('nsfw:result:job-123');
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
