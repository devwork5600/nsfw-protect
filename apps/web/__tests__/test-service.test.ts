import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  // The action reads these at module load, so they must exist before the import below.
  process.env.HOME_PAGE_API_KEY = 'demo-home-key';
  process.env.INTERNAL_API_URL = 'http://api.test';
  return { headersGet: vi.fn(), fetch: vi.fn() };
});

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: mocks.headersGet })),
}));

vi.stubGlobal('fetch', mocks.fetch);

// ─── Import after mocks ───────────────────────────────────────────────────────

import { testImageAction } from '../actions/test-service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const requestHeaders = () => mocks.fetch.mock.calls[0][1].headers as Record<string, string>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('testImageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headersGet.mockImplementation((name: string) =>
      name === 'x-forwarded-for' ? '203.0.113.7, 10.0.0.1' : null,
    );
    mocks.fetch.mockResolvedValue(jsonResponse(200, { status: 'done', result: [] }));
  });

  it('forwards the first x-forwarded-for entry as the visitor IP', async () => {
    await testImageAction(new FormData());

    expect(requestHeaders()).toMatchObject({
      'x-api-key': 'demo-home-key',
      'x-demo-client-ip': '203.0.113.7',
    });
  });

  it('falls back to x-real-ip, then to "unknown"', async () => {
    mocks.headersGet.mockImplementation((name: string) =>
      name === 'x-real-ip' ? '198.51.100.9' : null,
    );
    await testImageAction(new FormData());
    expect(requestHeaders()['x-demo-client-ip']).toBe('198.51.100.9');

    vi.clearAllMocks();
    mocks.headersGet.mockReturnValue(null);
    mocks.fetch.mockResolvedValue(jsonResponse(200, { status: 'done', result: [] }));
    await testImageAction(new FormData());
    expect(requestHeaders()['x-demo-client-ip']).toBe('unknown');
  });

  it('turns a 429 into a readable message with the wait in minutes', async () => {
    mocks.fetch.mockResolvedValue(
      jsonResponse(429, { error: 'Too many requests', limit: 10, retryAfterSeconds: 1500 }),
    );

    const res = await testImageAction(new FormData());

    expect(res.error).toContain('10 free tests per hour');
    expect(res.error).toContain('25 min');
  });

  it('returns the API error message for other failures', async () => {
    mocks.fetch.mockResolvedValue(jsonResponse(400, { error: 'Uploaded file must be an image' }));

    expect(await testImageAction(new FormData())).toEqual({
      error: 'Uploaded file must be an image',
    });
  });
});
