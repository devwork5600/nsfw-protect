'use server';

import { headers } from 'next/headers';

const API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && API_URL.includes('localhost')) {
  console.warn(
    '[NSFW] INTERNAL_API_URL or NEXT_PUBLIC_API_URL is pointing to localhost in production.',
  );
}
const MAGIC_KEY = process.env.HOME_PAGE_API_KEY;

// The API only sees this server's address, so the visitor's IP is forwarded explicitly for
// the demo key's per-visitor limit. Vercel overwrites x-forwarded-for at its edge, so the
// first entry is the real client and can't be spoofed by the visitor.
async function getVisitorIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function testImageAction(formData: FormData) {
  if (!MAGIC_KEY) {
    // For development, if MAGIC_KEY is not set, we might want to allow it if we are in dev mode
    // but the user specifically asked for a magic key, so we should probably require it.
    // However, to make it work immediately for them if they haven't set it yet,
    // maybe we can search for a magic key in the DB.
    console.warn('HOME_PAGE_API_KEY is not set in environment variables.');
  }

  try {
    // /classify is synchronous: the response body is the final classification
    // ({ status: 'done', result: [...] }), or 202 { status: 'pending' } if the
    // worker couldn't finish within the API's wait window.
    const response = await fetch(`${API_URL}/classify`, {
      method: 'POST',
      headers: {
        'x-api-key': MAGIC_KEY || '',
        'x-demo-client-ip': await getVisitorIp(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 429) {
        const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 60) / 60));
        return {
          error: `Demo limit reached (${error.limit ?? 10} free tests per hour). Try again in ${minutes} min, or create a free account to keep testing.`,
        };
      }
      return { error: error.error || 'Failed to classify image' };
    }

    return await response.json();
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to connect to API' };
  }
}
