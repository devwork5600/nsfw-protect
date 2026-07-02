import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import crypto from 'node:crypto';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma, pool } from '@nsfw/db';
import { auth } from '@nsfw/auth';

const RESULT_PREFIX = 'nsfw:result:';

const hashApiKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

export async function buildApp({ logger = true }: { logger?: boolean | object } = {}) {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const R2_ENDPOINT = process.env.R2_ENDPOINT;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const BUCKET_NAME = process.env.R2_BUCKET_NAME;

  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
    console.warn(
      '[NSFW API] R2 storage environment variables are not fully configured. Uploads will fail.',
    );
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID || '',
      secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
  });

  const redisParsed = new URL(REDIS_URL);
  const useTls = REDIS_URL.startsWith('rediss://') || redisParsed.hostname.endsWith('.upstash.io');

  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    ...(useTls && { tls: { rejectUnauthorized: false } }),
  });

  connection.on('error', (err) => console.error('[NSFW API] Redis connection error:', err));
  connection.on('connect', () => console.log('[NSFW API] Redis connected successfully'));

  const bullmqConnection = (() => {
    const { hostname, port, password } = redisParsed;
    return {
      host: hostname,
      port: Number(port || 6379),
      ...(password && { password: decodeURIComponent(password) }),
      ...(useTls && { tls: { rejectUnauthorized: false } }),
      maxRetriesPerRequest: null as null,
    };
  })();

  const nsfwQueue = new Queue('nsfw-queue', { connection: bullmqConnection });

  const fastify = Fastify({ logger });

  await fastify.register(cors, {
    origin: true,
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['x-api-key', 'Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

  fastify.addHook('onRequest', async (request) => {
    console.log(`[NSFW API] Incoming request: ${request.method} ${request.url}`);
  });

  fastify.addHook('onClose', async () => {
    await nsfwQueue.close();
    await connection.quit();
    await prisma.$disconnect();
    await pool.end();
  });

  fastify.all('/api/auth/*', async (request) => {
    const fullUrl = `${request.protocol}://${request.hostname}${request.url}`;
    const req = new Request(fullUrl, {
      method: request.method,
      headers: request.headers as HeadersInit,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });
    return auth.handler(req);
  });

  fastify.get('/', async () => ({
    status: 'ok',
    service: 'nsfw-api',
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/result/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const data = await connection.get(`${RESULT_PREFIX}${jobId}`);
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return JSON.parse(data);
  });

  fastify.post('/classify', async (request, reply) => {
    const apiKeyRaw = request.headers['x-api-key'] as string;
    if (!apiKeyRaw) return reply.status(401).send({ error: 'API key missing' });

    let usageRecordId: string | undefined;

    const isHomePageKey =
      process.env.HOME_PAGE_API_KEY && apiKeyRaw === process.env.HOME_PAGE_API_KEY;

    type BillingCtx = {
      apiKeyId: string;
      userId: string;
      isUnlimited: boolean;
      now: Date;
      periodStart: Date;
      periodEnd: Date;
      existingUsageId: string | null;
    };
    let billingCtx: BillingCtx | null = null;

    if (!isHomePageKey) {
      const keyHash = hashApiKey(apiKeyRaw);

      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!apiKey || apiKey.revoked || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return reply.status(401).send({ error: 'Invalid or expired API key' });
      }

      const PLAN_LIMITS: Record<string, number> = {
        FREE: 1000,
        STARTER: 25000,
        PRO: 250000,
        ENTERPRISE: 1000000000,
      };

      const customer = await prisma.customer.findUnique({
        where: { userId: apiKey.userId },
        include: { subscriptions: { where: { status: 'ACTIVE' }, take: 1 } },
      });

      const plan = customer?.subscriptions[0]?.plan || 'FREE';
      const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
      const now = new Date();

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

      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const existingUsage = await prisma.usageRecord.findFirst({
        where: {
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          periodStart: { lte: now },
          periodEnd: { gte: now },
        },
      });

      billingCtx = {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        isUnlimited: apiKey.isUnlimited,
        now,
        periodStart,
        periodEnd,
        existingUsageId: existingUsage?.id ?? null,
      };
    }

    const fileData = await request.file();
    if (!fileData) return reply.status(400).send({ error: 'No image provided' });

    if (billingCtx) {
      await prisma.apiKey.update({
        where: { id: billingCtx.apiKeyId },
        data: { lastUsedAt: billingCtx.now },
      });

      if (billingCtx.existingUsageId) {
        await prisma.usageRecord.update({
          where: { id: billingCtx.existingUsageId },
          data: { requestCount: { increment: 1 }, imageCount: { increment: 1 } },
        });
        usageRecordId = billingCtx.existingUsageId;
      } else {
        const newUsage = await prisma.usageRecord.create({
          data: {
            userId: billingCtx.userId,
            apiKeyId: billingCtx.apiKeyId,
            requestCount: 1,
            imageCount: 1,
            periodStart: billingCtx.periodStart,
            periodEnd: billingCtx.periodEnd,
          },
        });
        usageRecordId = newUsage.id;
      }
    }

    const jobId = crypto.randomUUID();

    try {
      const buffer = await fileData.toBuffer();
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

      await connection.set(`${RESULT_PREFIX}${jobId}`, JSON.stringify({ status: 'pending' }));

      await nsfwQueue.add(
        'nsfw-job',
        { jobId, r2Key: key, usageRecordId },
        { attempts: 2, removeOnComplete: true, removeOnFail: { count: 10 } },
      );

      return { jobId };
    } catch (error) {
      console.error(`[NSFW API] Processing failed for ${jobId}:`, error);
      return reply.status(500).send({ error: 'Failed to process image' });
    }
  });

  return fastify;
}
