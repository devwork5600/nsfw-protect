import { randomBytes, createHash } from 'crypto';

export function generateRawApiKey() {
  // Generate 32 random bytes (256 bits)
  return `sk_${randomBytes(24).toString('hex')}`;
}

export function hashApiKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export function getPrefix(key: string) {
  // Keep first 7 characters as prefix (sk_ + 4 chars)
  return key.substring(0, 7);
}
