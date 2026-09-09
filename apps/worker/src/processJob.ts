import fs from 'fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Job } from 'bullmq';

type S3Command = GetObjectCommand | DeleteObjectCommand;

export const RESULT_PREFIX = 'nsfw:result:';

export type ClassificationResult = { label: string; score: number };

export type ProcessJobData = {
  jobId: string;
  r2Key: string;
  usageRecordId?: string;
};

// Narrow slices of each real client's shape — just enough to run this job,
// so tests can pass plain mocks instead of the real SDK/Prisma/ioredis types.
export type ProcessJobDeps = {
  s3Client: {
    send: (
      command: S3Command,
    ) => Promise<{ Body?: { transformToByteArray(): Promise<Uint8Array> } }>;
  };
  bucketName: string | undefined;
  classifierPromise: Promise<
    (imagePath: string, opts: { topk: number }) => Promise<ClassificationResult[]>
  >;
  connection: {
    set: (key: string, value: string, mode: 'EX', seconds: number) => Promise<unknown>;
  };
  prisma: {
    usageRecord: {
      update: (args: {
        where: { id: string };
        data: { nsfwDetections: { increment: number } };
      }) => Promise<unknown>;
    };
  };
  logger: {
    child: (bindings: Record<string, unknown>) => {
      info: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
    };
  };
};

// Extracted out of worker.ts so it's a plain, dependency-injected function —
// worker.ts wires it to the real S3/Redis/Prisma clients, tests pass mocks
// directly instead of having to mock module-scope side effects (Redis
// connect, model load) that fire the instant worker.ts is imported.
export async function processJob(job: Job<ProcessJobData>, deps: ProcessJobDeps) {
  const { s3Client, bucketName, classifierPromise, connection, prisma, logger } = deps;
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
        Bucket: bucketName,
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
    // topk defaults to 1 in the library, which would return only the
    // top-scoring label. This model is binary (nsfw/sfw) — topk: 2 returns
    // both, matching the { label, score }[] shape assumed everywhere else.
    const result = await classifier(tempPath, { topk: 2 });

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
        .send(new DeleteObjectCommand({ Bucket: bucketName, Key: r2Key }))
        .then(() => log.info('R2 object deleted'))
        .catch((err) => log.error({ err }, 'Failed to delete R2 object'));
    }
  }
}
