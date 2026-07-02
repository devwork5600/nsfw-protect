import { describe, it, expect } from 'vitest';
import { generateRawApiKey, hashApiKey, getPrefix } from '../lib/api-keys';

describe('generateRawApiKey', () => {
  it('starts with sk_', () => {
    expect(generateRawApiKey().startsWith('sk_')).toBe(true);
  });

  it('has correct total length (sk_ + 48 hex chars from 24 random bytes)', () => {
    expect(generateRawApiKey()).toHaveLength(51);
  });

  it('contains only hex characters after the sk_ prefix', () => {
    const key = generateRawApiKey();
    expect(key.slice(3)).toMatch(/^[a-f0-9]+$/);
  });

  it('generates a unique key each call', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateRawApiKey()));
    expect(keys.size).toBe(20);
  });
});

describe('hashApiKey', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashApiKey('sk_test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic — same input always produces the same hash', () => {
    const key = 'sk_abc123';
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashApiKey('sk_key_a')).not.toBe(hashApiKey('sk_key_b'));
  });

  it('matches known SHA-256 test vector', () => {
    // echo -n "hello" | sha256sum → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    expect(hashApiKey('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('is sensitive to a single character difference', () => {
    expect(hashApiKey('sk_key1')).not.toBe(hashApiKey('sk_key2'));
  });
});

describe('getPrefix', () => {
  it('returns the first 7 characters of a key', () => {
    expect(getPrefix('sk_abcd1234567890')).toBe('sk_abcd');
  });

  it('prefix always covers sk_ plus 4 characters', () => {
    const key = generateRawApiKey();
    const prefix = getPrefix(key);
    expect(prefix).toBe(key.substring(0, 7));
    expect(prefix).toHaveLength(7);
    expect(prefix.startsWith('sk_')).toBe(true);
  });

  it('prefix of a generated key is consistent with its full key', () => {
    const key = generateRawApiKey();
    expect(key.startsWith(getPrefix(key))).toBe(true);
  });
});
