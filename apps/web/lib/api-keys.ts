import { randomBytes, createHash } from 'crypto';

export function generateRawApiKey() {
  // Generate 32 random bytes (256 bits)
  return `sk_${randomBytes(24).toString('hex')}`;
}

// Name is pinned to the algorithm so a future swap (e.g. to bcrypt) can't happen without
// the mismatch being obvious — apps/api/src/app.ts hashes incoming keys the same way to
// look up this value, so the two must stay byte-for-byte identical.
export function hashApiKeySha256(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export function getPrefix(key: string) {
  // Keep first 7 characters as prefix (sk_ + 4 chars)
  return key.substring(0, 7);
}
