import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import crypto from 'node:crypto';
import { Queue } from 'bullmq';
import sharp from 'sharp';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma, pool, PlanTier } from '@nsfw/db';
import { createRedisConnection } from '@nsfw/redis';
import { createR2Client } from '@nsfw/storage';

// Redis key prefix under which classification results are cached, keyed by jobId.
const RESULT_PREFIX = 'nsfw:result:';

// API keys are stored hashed (never in plaintext), so lookups hash the incoming key first.
// Must stay byte-for-byte identical to hashApiKeySha256 in apps/web/lib/api-keys.ts —
// that's what generates the hash stored in the DB. Name is pinned to the algorithm so a
// future swap (e.g. to bcrypt) can't happen on one side without the mismatch being obvious.
const hashApiKeySha256 = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

type NsfwJobData = { jobId: string; r2Key: string; usageRecordId?: string };

// Enqueueing is the last step after billing/upload have already succeeded, so a
// transient Redis blip here shouldn't immediately turn into a billed-but-never-queued
// job. A few quick retries absorb that without needing a full rollback path.
async function enqueueWithRetry(queue: Queue, data: NsfwJobData, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await queue.add('nsfw-job', data, {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: { count: 10 },
      });
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }
}

export async function buildApp({ logger = true }: { logger?: boolean | object } = {}) {
  const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

  const fastify = Fastify({ logger });

  const { s3Client, bucketName: BUCKET_NAME } = createR2Client({
    onMissingConfig: () =>
      fastify.log.warn(
        'R2 storage environment variables are not fully configured. Uploads will fail.',
      ),
  });

  const { connection, bullmqConnection } = createRedisConnection(REDIS_URL);

  connection.on('error', (err) => fastify.log.error({ err }, 'Redis connection error'));
  connection.on('connect', () => fastify.log.info('Redis connected successfully'));

  // Queue that classification jobs are pushed onto; the worker service consumes it.
  const nsfwQueue = new Queue('nsfw-queue', { connection: bullmqConnection });

  // Allow any origin (the API is called from the marketing site and third-party integrations),
  // but still restrict methods/headers to what the API actually uses. Auth is via the
  // x-api-key header only — no cookies, so no credentials needed.
  await fastify.register(cors, {
    origin: true,
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['x-api-key', 'Content-Type'],
  });

  // Caps uploaded image size at 20MB to bound memory/processing cost per request.
  await fastify.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

  fastify.addHook('onRequest', async (request) => {
    request.log.info(`Incoming request: ${request.method} ${request.url}`);
  });

  // Ensures queue/redis/db connections are released cleanly on shutdown instead of
  // leaking handles (important for graceful restarts/deploys).
  fastify.addHook('onClose', async () => {
    await nsfwQueue.close();
    await connection.quit();
    await prisma.$disconnect();
    await pool.end();
  });

  fastify.get('/', async () => ({
    status: 'ok',
    service: 'nsfw-api',
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/health', async () => ({ status: 'ok' }));

  // /classify is synchronous from the caller's perspective: after enqueueing, the
  // request waits for the worker to publish the result and returns it directly.
  // Configurable mainly so tests can shrink the window.
  const WAIT_TIMEOUT_MS = parseInt(process.env.CLASSIFY_WAIT_TIMEOUT_MS ?? '30000', 10);
  const WAIT_POLL_MS = parseInt(process.env.CLASSIFY_WAIT_POLL_MS ?? '150', 10);

  type StoredResult = { status: 'pending' | 'done' | 'error'; result?: unknown; error?: string };

  // Polls the Redis result key until the worker flips it from 'pending', or the
  // timeout elapses (null). The worker keeps the key 'pending' across its internal
  // retries, so waiting here also spans those.
  async function waitForResult(jobId: string): Promise<StoredResult | null> {
    const deadline = Date.now() + WAIT_TIMEOUT_MS;
    do {
      const data = await connection.get(`${RESULT_PREFIX}${jobId}`);
      if (data) {
        const parsed = JSON.parse(data) as StoredResult;
        if (parsed.status !== 'pending') return parsed;
      }
      await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_MS));
    } while (Date.now() < deadline);
    return null;
  }

  fastify.post('/classify', async (request, reply) => {
    const apiKeyRaw = request.headers['x-api-key'] as string;
    if (!apiKeyRaw) return reply.status(401).send({ error: 'API key missing' });

    let usageRecordId: string | undefined;

    // The public homepage demo uses a single shared key that bypasses per-user
    // billing/rate-limiting entirely (it isn't tied to a customer account).
    const isHomePageKey =
      process.env.HOME_PAGE_API_KEY && apiKeyRaw === process.env.HOME_PAGE_API_KEY;

    // Precomputed here (before the file upload is read) so that if billing checks
    // fail we return early without paying the cost of receiving the image.
    type BillingCtx = {
      apiKeyId: string;
      userId: string;
      isUnlimited: boolean;
      plan: PlanTier;
      limit: number;
      now: Date;
      periodStart: Date;
      periodEnd: Date;
    };
    let billingCtx: BillingCtx | null = null;

    if (!isHomePageKey) {
      const keyHash = hashApiKeySha256(apiKeyRaw);

      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!apiKey || apiKey.revoked || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return reply.status(401).send({ error: 'Invalid or expired API key' });
      }

      // Monthly image-classification quota per subscription plan.
      const PLAN_LIMITS: Record<PlanTier, number> = {
        FREE: 1000,
        STARTER: 25000,
        PRO: 250000,
        ENTERPRISE: 1000000000,
      };

      const customer = await prisma.customer.findUnique({
        where: { userId: apiKey.userId },
        include: { subscriptions: { where: { status: 'ACTIVE' }, take: 1 } },
      });

      // No active subscription (or none found) defaults to the FREE tier limit.
      const plan = customer?.subscriptions[0]?.plan || 'FREE';
      const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
      const now = new Date();

      // Cheap best-effort pre-check so obviously over-quota callers are rejected
      // before we spend time receiving the (up to 20MB) multipart upload. This is
      // NOT authoritative on its own — the real check+increment happens atomically
      // below, once the file is in hand, guarded by a per-user advisory lock.
      if (!apiKey.isUnlimited) {
        const monthUsage = await prisma.usageRecord.aggregate({
          where: {
            userId: apiKey.userId,
            periodStart: { lte: now },
            periodEnd: { gte: now },
          },
          _sum: { imageCount: true },
        });

        const currentCount = monthUsage._sum.imageCount || 0;

        if (currentCount >= limit) {
          return reply.status(403).send({
            error: 'Monthly scan limit reached',
            plan,
            limit,
            currentUsage: currentCount,
          });
        }
      }

      // Usage is tracked per calendar month, not per rolling 30 days.
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      billingCtx = {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        isUnlimited: apiKey.isUnlimited,
        plan,
        limit,
        now,
        periodStart,
        periodEnd,
      };
    }

    const fileData = await request.file();
    if (!fileData) return reply.status(400).send({ error: 'No image provided' });

    // Reject obviously-wrong uploads before spending time decoding them. sharp() would
    // eventually reject non-image bytes too, but this catches it immediately and cheaply
    // (note: mimetype is client-supplied, so this is a fast filter, not a security boundary).
    if (!fileData.mimetype.startsWith('image/')) {
      return reply.status(400).send({ error: 'Uploaded file must be an image' });
    }

    const jobId = crypto.randomUUID();

    try {
      const buffer = await fileData.toBuffer();
      // Normalize to the model's expected input: 224x224 opaque JPEG (matches the
      // vit-base-nsfw-detector model the worker runs).
      const processedBuffer = await sharp(buffer).resize(224, 224).removeAlpha().jpeg().toBuffer();

      const key = `uploads/${jobId}.jpg`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: processedBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      // Billing happens only now, after the costly work (decode/resize/upload) has
      // already succeeded, so a failed upload never counts against the user's quota.
      if (billingCtx) {
        const ctx = billingCtx;

        // Authoritative check-and-increment, done atomically: a Postgres advisory
        // lock scoped to this user serializes concurrent /classify calls so the
        // "read current count, then act on it" sequence below can't race across
        // requests (which previously let usage overshoot the plan limit and could
        // create duplicate usage rows for the same billing period).
        const quotaResult = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ctx.userId})::bigint)`;

          if (!ctx.isUnlimited) {
            const monthUsage = await tx.usageRecord.aggregate({
              where: {
                userId: ctx.userId,
                periodStart: { lte: ctx.now },
                periodEnd: { gte: ctx.now },
              },
              _sum: { imageCount: true },
            });

            const currentCount = monthUsage._sum.imageCount || 0;
            if (currentCount >= ctx.limit) {
              return { exceeded: true as const, currentCount };
            }
          }

          // Single round trip: increments the existing period's usage row if one
          // exists, otherwise creates the first row for this key's current period.
          // Relies on the @@unique([apiKeyId, periodStart, periodEnd]) constraint.
          const usage = await tx.usageRecord.upsert({
            where: {
              apiKeyId_periodStart_periodEnd: {
                apiKeyId: ctx.apiKeyId,
                periodStart: ctx.periodStart,
                periodEnd: ctx.periodEnd,
              },
            },
            update: { requestCount: { increment: 1 }, imageCount: { increment: 1 } },
            create: {
              userId: ctx.userId,
              apiKeyId: ctx.apiKeyId,
              requestCount: 1,
              imageCount: 1,
              periodStart: ctx.periodStart,
              periodEnd: ctx.periodEnd,
            },
          });

          return { exceeded: false as const, usageId: usage.id };
        });

        if (quotaResult.exceeded) {
          // The image was already processed and stored, but a concurrent request
          // used up the last slot in the atomic check above — don't bill or queue
          // it, and don't leave the orphaned object sitting in the bucket either.
          await s3Client
            .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
            .catch((err) => request.log.error({ err, key }, 'Failed to clean up orphaned upload'));

          return reply.status(403).send({
            error: 'Monthly scan limit reached',
            plan: ctx.plan,
            limit: ctx.limit,
            currentUsage: quotaResult.currentCount,
          });
        }

        usageRecordId = quotaResult.usageId;

        // lastUsedAt is informational telemetry, not part of billing correctness, so
        // it doesn't need to be inside the quota transaction or block the response.
        prisma.apiKey
          .update({ where: { id: ctx.apiKeyId }, data: { lastUsedAt: ctx.now } })
          .catch((err) =>
            request.log.error({ err, apiKeyId: ctx.apiKeyId }, 'Failed to update lastUsedAt'),
          );
      }

      // Seed the result key as 'pending' before enqueueing so the wait loop below
      // always finds it in a defined state while the worker is still processing.
      await connection.set(
        `${RESULT_PREFIX}${jobId}`,
        JSON.stringify({ status: 'pending' }),
        'EX',
        60 * 60,
      );

      try {
        // usageRecordId travels with the job so the worker can bump nsfwDetections on
        // the same billing row if the image turns out to be NSFW.
        await enqueueWithRetry(nsfwQueue, { jobId, r2Key: key, usageRecordId });
      } catch (enqueueError) {
        // Enqueueing never succeeded even after retries: the user was already billed
        // and the image already uploaded, so a worker that never sees this job would
        // otherwise leave both the charge and the 'pending' result stuck forever.
        // Unwind everything so the request fails cleanly instead of silently.
        await connection
          .del(`${RESULT_PREFIX}${jobId}`)
          .catch((err) =>
            request.log.error({ err, jobId }, 'Failed to clear stuck pending result key'),
          );
        await s3Client
          .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
          .catch((err) => request.log.error({ err, key }, 'Failed to clean up orphaned upload'));
        if (usageRecordId) {
          await prisma.usageRecord
            .update({
              where: { id: usageRecordId },
              data: { requestCount: { decrement: 1 }, imageCount: { decrement: 1 } },
            })
            .catch((err) =>
              request.log.error(
                { err, usageRecordId },
                'Failed to roll back usage record after enqueue failure',
              ),
            );
        }
        throw enqueueError;
      }

      const outcome = await waitForResult(jobId);

      // Worker didn't finish within the window (cold model load, deep queue).
      // jobIds are internal plumbing and never exposed — the caller just learns the
      // classification didn't complete and can retry the upload.
      if (!outcome) {
        // The customer got no usable result, so refund the scan and make the retry
        // free. The worker may still finish this job after the 202 goes out — an
        // occasional given-away classification beats double-billing.
        if (usageRecordId) {
          await prisma.usageRecord
            .update({
              where: { id: usageRecordId },
              data: { requestCount: { decrement: 1 }, imageCount: { decrement: 1 } },
            })
            .catch((err) =>
              request.log.error(
                { err, usageRecordId },
                'Failed to roll back usage record after classify timeout',
              ),
            );
        }
        return reply.status(202).send({ status: 'pending' });
      }

      if (outcome.status === 'error') {
        return reply.status(500).send({ error: outcome.error ?? 'Classification failed' });
      }

      return outcome;
    } catch (error) {
      request.log.error({ err: error, jobId }, 'Processing failed');
      return reply.status(500).send({ error: 'Failed to process image' });
    }
  });

  return fastify;
}
