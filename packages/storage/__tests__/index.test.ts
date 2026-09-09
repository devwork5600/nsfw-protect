import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createR2Client } from '../index.js';

const ENV_KEYS = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
] as const;

function setFullConfig() {
  vi.stubEnv('R2_ENDPOINT', 'https://fake.r2.dev');
  vi.stubEnv('R2_ACCESS_KEY_ID', 'fake-access-key');
  vi.stubEnv('R2_SECRET_ACCESS_KEY', 'fake-secret-key');
  vi.stubEnv('R2_BUCKET_NAME', 'fake-bucket');
}

describe('createR2Client', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) vi.stubEnv(key, undefined);
  });

  it('does not call onMissingConfig when all R2 env vars are set', () => {
    setFullConfig();
    const onMissingConfig = vi.fn();

    const { bucketName } = createR2Client({ onMissingConfig });

    expect(onMissingConfig).not.toHaveBeenCalled();
    expect(bucketName).toBe('fake-bucket');
  });

  it('calls onMissingConfig when R2_ENDPOINT is missing', () => {
    setFullConfig();
    vi.stubEnv('R2_ENDPOINT', undefined);
    const onMissingConfig = vi.fn();

    createR2Client({ onMissingConfig });

    expect(onMissingConfig).toHaveBeenCalledOnce();
  });

  it('calls onMissingConfig when no env vars are set at all', () => {
    const onMissingConfig = vi.fn();

    const { bucketName } = createR2Client({ onMissingConfig });

    expect(onMissingConfig).toHaveBeenCalledOnce();
    expect(bucketName).toBeUndefined();
  });

  it('does not throw when onMissingConfig is omitted', () => {
    expect(() => createR2Client()).not.toThrow();
  });

  it('still constructs a client even with missing config, so callers can decide how to fail', () => {
    const { s3Client } = createR2Client();
    expect(s3Client).toBeDefined();
  });
});
