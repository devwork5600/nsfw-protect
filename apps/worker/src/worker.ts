import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { Worker } from 'bullmq';
import { pipeline, env as xenovaEnv } from '@xenova/transformers';
import path from 'node:path';
import pino from 'pino';
import { prisma, pool } from '@nsfw/db';
import { createRedisConnection } from '@nsfw/redis';
import { createR2Client } from '@nsfw/storage';
import { processJob, type ProcessJobData, type ProcessJobDeps } from './processJob.js';

// Load .env before reading any env vars — must be the first top-level statement
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env'),
  override: true,
});

// cacheDir must be set after dotenv so MODEL_CACHE_DIR from .env is visible.
// Docker sets MODEL_CACHE_DIR=/app/.cache; locally fall back to apps/worker/.cache.
xenovaEnv.cacheDir =
  process.env.MODEL_CACHE_DIR ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.cache');

const logger = pino({ name: 'nsfw-worker', level: process.env.LOG_LEVEL ?? 'info' });

const REDIS_URL = process.env.REDIS_URL!;

// ioredis instance for direct ops (get/set/quit); bullmqConnection avoids the
// dual-instance type conflict since bullmq bundles its own ioredis.
const { connection, bullmqConnection } = createRedisConnection(REDIS_URL, { lazyConnect: true });

const { s3Client, bucketName: BUCKET_NAME } = createR2Client({
  onMissingConfig: () =>
    logger.error(
      'R2 storage environment variables are not fully configured. Worker cannot download images.',
    ),
});

connection.on('error', (err) => logger.error({ err }, 'Redis connection error'));
connection.on('connect', () => logger.info('Redis connected'));

// Load model once. Cast to processJob's expected classify signature — the
// library's own return type is wider than the { label, score }[] shape this
// binary model actually produces.
const classifierPromise = pipeline('image-classification', 'AdamCodd/vit-base-nsfw-detector').catch(
  (err) => {
    logger.error({ err }, 'Failed to load model');
    throw err;
  },
) as unknown as ProcessJobDeps['classifierPromise'];

const worker = new Worker<ProcessJobData>(
  'nsfw-queue',
  (job) =>
    processJob(job, {
      s3Client,
      bucketName: BUCKET_NAME,
      classifierPromise,
      connection,
      // Real PrismaClient's generated method types are far more specific than
      // processJob's minimal slice needs — cast rather than fight structural
      // assignability against generated Prisma types.
      prisma: prisma as unknown as ProcessJobDeps['prisma'],
      logger,
    }),
  {
    connection: bullmqConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10),
    lockDuration: 300000, // 5 minutes (reduces heartbeat frequency)
    stalledInterval: 300000, // 5 minutes (reduces stalled job check frequency)
    drainDelay: 30, // 30 seconds (reduces polling frequency when empty)
  },
);

worker.on('completed', (job) => logger.info({ bullJobId: job.id }, 'Job completed'));
worker.on('failed', (job, err) => logger.error({ bullJobId: job?.id, err }, 'Job failed'));
worker.on('error', (err) => logger.error({ err }, 'Worker error'));

logger.info('NSFW worker started');

const shutdown = async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
