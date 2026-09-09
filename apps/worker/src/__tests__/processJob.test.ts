import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';

const mocks = vi.hoisted(() => ({
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  default: { writeFile: mocks.writeFile, unlink: mocks.unlink },
}));

import { processJob, RESULT_PREFIX, type ProcessJobDeps } from '../processJob.js';

const BUCKET_NAME = 'fake-bucket';

function makeJob(overrides: Partial<Job['data']> = {}, jobOverrides: Partial<Job> = {}): Job {
  return {
    id: 'bull-1',
    data: { jobId: 'job-1', r2Key: 'uploads/job-1.jpg', ...overrides },
    attemptsMade: 0,
    opts: { attempts: 1 },
    ...jobOverrides,
  } as unknown as Job;
}

function makeDeps(overrides: Partial<ProcessJobDeps> = {}): ProcessJobDeps {
  const child = { info: vi.fn(), error: vi.fn() };
  return {
    s3Client: {
      send: vi.fn().mockResolvedValue({
        Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
      }),
    },
    bucketName: BUCKET_NAME,
    classifierPromise: Promise.resolve(
      vi.fn().mockResolvedValue([
        { label: 'sfw', score: 0.99 },
        { label: 'nsfw', score: 0.01 },
      ]),
    ),
    connection: { set: vi.fn().mockResolvedValue('OK') },
    prisma: { usageRecord: { update: vi.fn().mockResolvedValue({}) } },
    logger: { child: vi.fn().mockReturnValue(child) },
    ...overrides,
  };
}

describe('processJob', () => {
  beforeEach(() => {
    mocks.writeFile.mockReset().mockResolvedValue(undefined);
    mocks.unlink.mockReset().mockResolvedValue(undefined);
  });

  it('marks the job done and skips usage tracking for an SFW result', async () => {
    const deps = makeDeps();
    const job = makeJob();

    await processJob(job, deps);

    expect(deps.connection.set).toHaveBeenCalledWith(
      `${RESULT_PREFIX}job-1`,
      JSON.stringify({
        status: 'done',
        result: [
          { label: 'sfw', score: 0.99 },
          { label: 'nsfw', score: 0.01 },
        ],
      }),
      'EX',
      3600,
    );
    expect(deps.prisma.usageRecord.update).not.toHaveBeenCalled();
  });

  it('increments nsfwDetections when the result is NSFW and a usageRecordId is present', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.resolve(
        vi.fn().mockResolvedValue([
          { label: 'nsfw', score: 0.87 },
          { label: 'sfw', score: 0.13 },
        ]),
      ),
    });
    const job = makeJob({ usageRecordId: 'usage-1' });

    await processJob(job, deps);

    expect(deps.prisma.usageRecord.update).toHaveBeenCalledWith({
      where: { id: 'usage-1' },
      data: { nsfwDetections: { increment: 1 } },
    });
  });

  it('does not touch usage tracking for an NSFW result with no usageRecordId', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.resolve(
        vi.fn().mockResolvedValue([{ label: 'nsfw', score: 0.9 }]),
      ),
    });
    const job = makeJob();

    await processJob(job, deps);

    expect(deps.prisma.usageRecord.update).not.toHaveBeenCalled();
  });

  it('still completes the job when the usage-tracking update rejects', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.resolve(
        vi.fn().mockResolvedValue([{ label: 'nsfw', score: 0.9 }]),
      ),
      prisma: { usageRecord: { update: vi.fn().mockRejectedValue(new Error('db down')) } },
    });
    const job = makeJob({ usageRecordId: 'usage-1' });

    await expect(processJob(job, deps)).resolves.toBeUndefined();
    expect(deps.connection.set).toHaveBeenCalledWith(
      `${RESULT_PREFIX}job-1`,
      expect.stringContaining('"status":"done"'),
      'EX',
      3600,
    );
  });

  it('deletes the R2 object after a successful classification', async () => {
    const deps = makeDeps();
    const job = makeJob();

    await processJob(job, deps);

    expect(deps.s3Client.send).toHaveBeenCalledTimes(2);
    const deleteCommand = (deps.s3Client.send as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(deleteCommand.input).toEqual({ Bucket: BUCKET_NAME, Key: 'uploads/job-1.jpg' });
  });

  it('records a terminal error and does not attempt cleanup when the download itself fails', async () => {
    const deps = makeDeps({
      s3Client: { send: vi.fn().mockResolvedValue({ Body: undefined }) },
    });
    const job = makeJob(undefined, { attemptsMade: 0, opts: { attempts: 1 } });

    await expect(processJob(job, deps)).rejects.toThrow('Empty body from R2');

    expect(deps.connection.set).toHaveBeenCalledWith(
      `${RESULT_PREFIX}job-1`,
      JSON.stringify({ status: 'error', error: 'Empty body from R2' }),
      'EX',
      3600,
    );
    // Never downloaded, so nothing to delete from R2.
    expect(deps.s3Client.send).toHaveBeenCalledTimes(1);
  });

  it('leaves the pending status alone and skips R2 cleanup on a non-final retryable failure', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.reject(new Error('model not ready')),
    });
    const job = makeJob(undefined, { attemptsMade: 0, opts: { attempts: 3 } });

    await expect(processJob(job, deps)).rejects.toThrow('model not ready');

    // Only the initial GetObjectCommand — no error status written, no delete.
    expect(deps.connection.set).not.toHaveBeenCalled();
    expect(deps.s3Client.send).toHaveBeenCalledTimes(1);
  });

  it('cleans up the downloaded R2 object once the last retry attempt also fails', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.reject(new Error('model crashed')),
    });
    const job = makeJob(undefined, { attemptsMade: 2, opts: { attempts: 3 } });

    await expect(processJob(job, deps)).rejects.toThrow('model crashed');

    expect(deps.connection.set).toHaveBeenCalledWith(
      `${RESULT_PREFIX}job-1`,
      JSON.stringify({ status: 'error', error: 'model crashed' }),
      'EX',
      3600,
    );
    // Downloaded successfully before the classifier failed, and this was the
    // last attempt, so the R2 object should be cleaned up.
    expect(deps.s3Client.send).toHaveBeenCalledTimes(2);
  });

  it('always removes the local temp file, even on failure', async () => {
    const deps = makeDeps({
      classifierPromise: Promise.reject(new Error('boom')),
    });
    const job = makeJob();

    await expect(processJob(job, deps)).rejects.toThrow('boom');

    expect(mocks.unlink).toHaveBeenCalledWith(expect.stringContaining('worker-job-1.jpg'));
  });
});
