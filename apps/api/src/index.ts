import dotenv from 'dotenv';
dotenv.config({ override: true });
// Force 0.0.0.0 for Docker/Railway environment
process.env.HOST = '0.0.0.0'; 
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
// import fs from 'node:fs/promises'
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma, pool } from '@nsfw/db';
import { auth } from '@nsfw/auth';

const PORT = parseInt(process.env.PORT || '3001');
const REDIS_URL = process.env.REDIS_URL || '';
const RESULT_PREFIX = 'nsfw:result:';

// R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.warn('[NSFW API] R2 storage environment variables are not fully configured. Uploads will fail.');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

// Force redeploy to active R2 integration

// API Key hashing helpers
const hashApiKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');
const getPrefix = (key: string) => key.substring(0, 7);

const fastify = Fastify({
  logger: true,
});

// Redis connection
const connection = new Redis(REDIS_URL, { 
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false
  }, 
});

connection.on('error', (err) => {
  console.error('[NSFW API] Redis connection error:', err);
});

connection.on('connect', () => {
  console.log('[NSFW API] Redis connected successfully');
});

// Queue
const nsfwQueue = new Queue('nsfw-queue', { connection });

// Plugins
fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['x-api-key', 'Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Request logging
fastify.addHook('onRequest', async (request) => {
  console.log(`[NSFW API] Incoming request: ${request.method} ${request.url}`);
});

// Better Auth route
fastify.all('/api/auth/*', async (request, reply) => {
  const fullUrl = `${request.protocol}://${request.hostname}${request.url}`;
  const req = new Request(fullUrl, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
  return auth.handler(req);
});

// Health check (Railway)
fastify.get('/', async () => {
  console.log('[NSFW API] Health check hit');
  return { status: 'ok', service: 'nsfw-api', timestamp: new Date().toISOString() };
});

fastify.get('/health', async () => {
  console.log('[NSFW API] /health hit');
  return { status: 'ok' };
});

// Get result
fastify.get('/result/:jobId', async (request, reply) => {
  const { jobId } = request.params as { jobId: string };

  const data = await connection.get(`${RESULT_PREFIX}${jobId}`);
  if (!data) {
    return reply.status(404).send({ error: 'Not found' });
  }

  return JSON.parse(data);
});

// Classify
fastify.post('/classify', async (request, reply) => {
  const apiKeyRaw = request.headers['x-api-key'] as string;
  if (!apiKeyRaw) {
    return reply.status(401).send({ error: 'API key missing' });
  }

  const keyPrefix = getPrefix(apiKeyRaw);
  const keyHash = hashApiKey(apiKeyRaw);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revoked || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    return reply.status(401).send({ error: 'Invalid or expired API key' });
  }

  // Get plan and limits
  const PLAN_LIMITS: Record<string, number> = {
    FREE: 1000,
    STARTER: 25000,
    PRO: 250000,
    ENTERPRISE: 1000000000, // Effectively unlimited
  };

  const customer = await prisma.customer.findUnique({
    where: { userId: apiKey.userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  const plan = customer?.subscriptions[0]?.plan || 'FREE';
  const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  // Skip usage limiting for unlimited keys
  if (!apiKey.isUnlimited) {
    // Atomic usage check + increment via Redis to prevent race conditions
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const usageCounterKey = `usage:${apiKey.userId}:${monthKey}`;

    const currentCount = await connection.incr(usageCounterKey);

    // Set expiry on first use (auto-cleanup after 35 days)
    if (currentCount === 1) {
      await connection.expire(usageCounterKey, 35 * 24 * 60 * 60);
    }

    if (currentCount > limit) {
      // Undo the increment since we're rejecting
      await connection.decr(usageCounterKey);
      return reply.status(403).send({
        error: 'Monthly scan limit reached',
        plan,
        limit,
        currentUsage: currentCount - 1,
      });
    }
  }

  // Persist usage to Postgres (non-blocking for the request, but awaited for data integrity)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  let usageRecordId: string | undefined;

  const usage = await prisma.usageRecord.findFirst({
    where: {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
  });

  if (usage) {
    await prisma.usageRecord.update({
      where: { id: usage.id },
      data: {
        requestCount: { increment: 1 },
        imageCount: { increment: 1 },
      },
    });
    usageRecordId = usage.id;
  } else {
    const newUsage = await prisma.usageRecord.create({
      data: {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        requestCount: 1,
        imageCount: 1,
        periodStart,
        periodEnd,
      },
    });
    usageRecordId = newUsage.id;
  }

  const fileData = await request.file();
  if (!fileData) {
    return reply.status(400).send({ error: 'No image provided' });
  }

  const jobId = crypto.randomUUID();

  try {
    const buffer = await fileData.toBuffer();
    console.log(`[NSFW API FASTIFY] Processing image ${jobId}, size: ${buffer.length} bytes`);

    const processedBuffer = await sharp(buffer).resize(224, 224).removeAlpha().jpeg().toBuffer();
    
    // Upload to R2
    const key = `uploads/${jobId}.jpg`;
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
    }));

    console.log(`[NSFW API FASTIFY] Image ${jobId} uploaded to R2: ${key}`);

    // Mark as pending in Redis
    await connection.set(`${RESULT_PREFIX}${jobId}`, JSON.stringify({ status: 'pending' }));

    // Add job to queue
    await nsfwQueue.add('nsfw-job', { jobId, r2Key: key, usageRecordId }, { attempts: 2 });

    return { jobId };
  } catch (error) {
    console.error(`[NSFW API FASTIFY] Processing or R2 upload failed for ${jobId}:`, error);
    return reply.status(500).send({ error: 'Failed to process image' });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  await fastify.close();
  await nsfwQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  try {
    // Using '::' binds to all IPv4 and IPv6 interfaces
    const listenHost = '::';
    console.log(`[NSFW API V5] Attempting to listen on host: ${listenHost}, port: ${PORT}`);
    
    const address = await fastify.listen({ 
      port: PORT, 
      host: listenHost 
    });
    
    console.log(`[NSFW API V5] SUCCESS! Server listening at: ${address}`);
  } catch (err) {
    console.error('[NSFW API V5] FATAL: Server failed to start:', err);
    process.exit(1);
  }
};

start();
