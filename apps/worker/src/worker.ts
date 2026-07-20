import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { Worker } from 'bullmq';
import { pipeline, env as xenovaEnv } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'node:path';
import os from 'node:os';
import pino from 'pino';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma, pool } from '@nsfw/db';
import { createRedisConnection } from '@nsfw/redis';
import { createR2Client } from '@nsfw/storage';

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

const RESULT_PREFIX = 'nsfw:result:';

const { s3Client, bucketName: BUCKET_NAME } = createR2Client({
  onMissingConfig: () =>
    logger.error(
      'R2 storage environment variables are not fully configured. Worker cannot download images.',
    ),
});

connection.on('error', (err) => logger.error({ err }, 'Redis connection error'));
connection.on('connect', () => logger.info('Redis connected'));

// Load model once
const classifierPromise = pipeline('image-classification', 'AdamCodd/vit-base-nsfw-detector').catch(
  (err) => {
    logger.error({ err }, 'Failed to load model');
    throw err;
  },
);

const worker = new Worker(
  'nsfw-queue',
  async (job) => {
    const { jobId, r2Key, usageRecordId } = job.data;
    const log = logger.child({ jobId, bullJobId: job.id, r2Key });
    log.info('Processing job');
    const tempPath = path.join(os.tmpdir(), `worker-${jobId}.jpg`);

    // Tracks whether the R2 object should be cleaned up once this attempt is
    // done: only once it's actually been downloaded (nothing to clean up before
    // that), and only on a terminal outcome (success, or a failure with no
    // attempts left) — a mid-attempt failure that BullMQ will retry needs the
    // object to still be there for the retry's re-download.
    let downloaded = false;
    let terminal = false;

    try {
      // Download from R2
      log.info('Downloading image from R2');
      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
        }),
      );

      if (!Body) throw new Error('Empty body from R2');
      downloaded = true;

      // transformToByteArray drains the stream into a Uint8Array (one byte per
      // element). Buffer.from is Node idiom only — fs.writeFile accepts the
      // Uint8Array as-is, so this just costs an extra copy.
      const buffer = Buffer.from(await Body.transformToByteArray());
      await fs.writeFile(tempPath, buffer);

      const classifier = await classifierPromise;
      // The model's output shape ({ label, score }) is the public result format.
      const result = (await classifier(tempPath)) as { label: string; score: number }[];

      log.info({ result }, 'Classification done');

      // The model is binary: it returns exactly 'nsfw' and 'sfw' labels.
      const isNSFW = result.some((r) => r.label.toLowerCase() === 'nsfw' && r.score > 0.5);

      // Best-effort telemetry: a failure here shouldn't turn an already-successful
      // classification into a job error, so it's isolated from the main try/catch
      // instead of being allowed to propagate.
      if (isNSFW && usageRecordId) {
        await prisma.usageRecord
          .update({
            where: { id: usageRecordId },
            data: { nsfwDetections: { increment: 1 } },
          })
          .catch((err) => log.error({ err, usageRecordId }, 'Failed to record nsfwDetections'));
      }

      await connection.set(
        `${RESULT_PREFIX}${jobId}`,
        JSON.stringify({ status: 'done', result }),
        'EX',
        60 * 60,
      );

      terminal = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'Job error');

      // Only surface a terminal error to callers once retries are exhausted —
      // otherwise a client polling mid-retry would see 'error' just before a
      // successful retry flips it to 'done'. Non-final failures leave the
      // status as the 'pending' seeded at enqueue time.
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      terminal = isLastAttempt;
      if (isLastAttempt) {
        await connection.set(
          `${RESULT_PREFIX}${jobId}`,
          JSON.stringify({ status: 'error', error: errorMessage }),
          'EX',
          60 * 60,
        );
      }

      // Rethrow so BullMQ actually counts this as a failed attempt and retries
      // per the queue's `attempts` option — swallowing it here would make every
      // job look like a success to BullMQ, silently disabling retries.
      throw err;
    } finally {
      fs.unlink(tempPath).catch(() => {});

      if (downloaded && terminal) {
        await s3Client
          .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key }))
          .then(() => log.info('R2 object deleted'))
          .catch((err) => log.error({ err }, 'Failed to delete R2 object'));
      }
    }
  },
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
