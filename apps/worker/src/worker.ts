import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { pipeline } from '@xenova/transformers';
import fs from 'fs/promises';
import 'dotenv/config';
import { prisma, pool } from '@nsfw/db';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  tls: {
    rejectUnauthorized: false
  },
});
const RESULT_PREFIX = 'nsfw:result:';

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
    const { jobId, tempPath, usageRecordId } = job.data;

    try {
      const classifier = await classifierPromise;
      const results = await classifier(tempPath);

      const formatted = (results as any).map((r: any) => ({
        label: r.label,
        confidence: r.score,
      }));

      console.log('[WORKER 2] Classification done:', formatted);

      // Check if NSFW
      const nsfwLabels = ['porn', 'hentai', 'sexy', 'nsfw'];
      const isNSFW = formatted.some(
        (r: any) => nsfwLabels.includes(r.label.toLowerCase()) && r.confidence > 0.5,
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
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
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
