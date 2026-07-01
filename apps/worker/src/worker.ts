import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { pipeline, env as xenovaEnv } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'node:path';
import os from 'node:os';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma, pool } from '@nsfw/db';

// Load .env before reading any env vars — must be the first top-level statement
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env'),
  override: true,
});

// cacheDir must be set after dotenv so MODEL_CACHE_DIR from .env is visible
xenovaEnv.cacheDir = process.env.MODEL_CACHE_DIR ?? '/app/.cache';

const REDIS_URL = process.env.REDIS_URL!;

// Enable TLS for rediss:// or Upstash (which uses TLS on plain redis:// port 6379)
const redisParsed = new URL(REDIS_URL);
const useTls = REDIS_URL.startsWith('rediss://') || redisParsed.hostname.endsWith('.upstash.io');

// ioredis instance for direct ops (get/set/quit)
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  ...(useTls && { tls: { rejectUnauthorized: false } }),
});

// Parsed options for BullMQ — avoids ioredis dual-instance type conflict
// (bullmq bundles its own ioredis, so passing a Redis instance causes TS errors)
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
const RESULT_PREFIX = 'nsfw:result:';

// R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.error(
    '[WORKER] R2 storage environment variables are not fully configured. Worker cannot download images.',
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

// Force redeploy to activate R2 integration

connection.on('error', (err) => console.error('Redis connection error:', err));
connection.on('connect', () => console.log('Redis connected'));

// Load model once
const classifierPromise = pipeline('image-classification', 'AdamCodd/vit-base-nsfw-detector').catch(
  (err) => {
    console.error('Failed to load model:', err);
    throw err;
  },
);

const worker = new Worker(
  'nsfw-queue',
  async (job) => {
    console.log('[WORKER 2] Processing job:', job.id, job.data.jobId);
    const { jobId, r2Key, usageRecordId } = job.data;
    const tempPath = path.join(os.tmpdir(), `worker-${jobId}.jpg`);

    try {
      // Download from R2
      console.log(`[WORKER 2] Downloading image from R2: ${r2Key}`);
      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
        }),
      );

      if (!Body) throw new Error('Empty body from R2');

      const buffer = Buffer.from(await Body.transformToByteArray());
      await fs.writeFile(tempPath, buffer);

      const classifier = await classifierPromise;
      const raw = (await classifier(tempPath)) as { label: string; score: number }[];

      const formatted = raw.map((r) => ({
        label: r.label,
        confidence: r.score,
      }));

      console.log('[WORKER 2] Classification done:', formatted);

      // Check if NSFW
      const nsfwLabels = ['porn', 'hentai', 'sexy', 'nsfw'];
      const isNSFW = formatted.some(
        (r) => nsfwLabels.includes(r.label.toLowerCase()) && r.confidence > 0.5,
      );

      if (isNSFW && usageRecordId) {
        await prisma.usageRecord.update({
          where: { id: usageRecordId },
          data: { nsfwDetections: { increment: 1 } },
        });
      }

      await connection.set(
        `${RESULT_PREFIX}${jobId}`,
        JSON.stringify({ status: 'done', result: formatted }),
        'EX',
        60 * 60,
      );

      // Delete from R2 after success
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
        }),
      );
      console.log(`[WORKER 2] R2 object deleted: ${r2Key}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[WORKER 2] Job error:', errorMessage);
      await connection.set(
        `${RESULT_PREFIX}${jobId}`,
        JSON.stringify({ status: 'error', error: errorMessage }),
        'EX',
        60 * 60,
      );
    } finally {
      fs.unlink(tempPath).catch(() => {});
    }
  },
  {
    connection: bullmqConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
    lockDuration: 300000, // 5 minutes (reduces heartbeat frequency)
    stalledInterval: 300000, // 5 minutes (reduces stalled job check frequency)
    drainDelay: 30, // 30 seconds (reduces polling frequency when empty)
  },
);

worker.on('completed', (job) => console.log('[WORKER 2] Job completed:', job.id));
worker.on('failed', (job, err) => console.error('[WORKER 2] Job failed:', job?.id, err.message));
worker.on('error', (err) => console.error('[WORKER 2] Worker error:', err));

console.log('NSFW worker 2 started');

const shutdown = async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
