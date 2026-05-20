'use server';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && API_URL.includes('localhost')) {
  console.warn('[NSFW] INTERNAL_API_URL or NEXT_PUBLIC_API_URL is pointing to localhost in production.');
}
const MAGIC_KEY = process.env.HOME_PAGE_API_KEY;

export async function testImageAction(formData: FormData) {
  if (!MAGIC_KEY) {
    // For development, if MAGIC_KEY is not set, we might want to allow it if we are in dev mode
    // but the user specifically asked for a magic key, so we should probably require it.
    // However, to make it work immediately for them if they haven't set it yet,
    // maybe we can search for a magic key in the DB.
    console.warn('HOME_PAGE_API_KEY is not set in environment variables.');
  }

  try {
    const response = await fetch(`${API_URL}/classify`, {
      method: 'POST',
      headers: {
        'x-api-key': MAGIC_KEY || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to classify image' };
    }

    return await response.json();
  } catch (error: any) {
    return { error: error.message || 'Failed to connect to API' };
  }
}

export async function getTestResultAction(jobId: string) {
  try {
    const response = await fetch(`${API_URL}/result/${jobId}`);
    if (!response.ok) {
      return { error: 'Failed to fetch result' };
    }
    return await response.json();
  } catch (error: any) {
    return { error: error.message || 'Failed to connect to API' };
  }
}
