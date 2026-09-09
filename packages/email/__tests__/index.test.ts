import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  ResendCtor: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: mocks.ResendCtor.mockImplementation(function (this: unknown) {
    return { emails: { send: mocks.send } };
  }),
}));

describe('sendEmail', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('EMAIL_FROM', undefined);
    vi.stubEnv('RESEND_API_KEY', undefined);
    mocks.send.mockReset().mockResolvedValue({ id: 'email-1' });
    mocks.ResendCtor.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('throws synchronously when EMAIL_FROM is not set, unlike other config errors below', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const { sendEmail } = await import('../src/index.js');

    await expect(
      sendEmail({ to: 'user@test.com', subject: 'Hi', react: null as never }),
    ).rejects.toThrow('EMAIL_FROM environment variable is not set');
  });

  it('returns a failure result (does not throw) when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    const { sendEmail } = await import('../src/index.js');

    const result = await sendEmail({ to: 'user@test.com', subject: 'Hi', react: null as never });

    expect(result).toEqual({
      success: false,
      message: 'RESEND_API_KEY environment variable is not set',
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('normalizes the recipient and subject, and sends via Resend on success', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const { sendEmail } = await import('../src/index.js');

    const result = await sendEmail({
      to: '  User@Test.com  ',
      subject: '  Welcome  ',
      react: null as never,
    });

    expect(result).toEqual({ success: true });
    expect(mocks.send).toHaveBeenCalledWith({
      from: 'noreply@nsfw-protect.com',
      to: ['user@test.com'],
      subject: 'Welcome',
      react: null,
    });
  });

  it('includes a normalized replyTo only when one is provided', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const { sendEmail } = await import('../src/index.js');

    await sendEmail({
      to: 'user@test.com',
      subject: 'Hi',
      react: null as never,
      replyTo: '  Support@Test.com  ',
    });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'support@test.com' }),
    );

    await sendEmail({ to: 'user@test.com', subject: 'Hi', react: null as never });

    expect(mocks.send.mock.calls[1][0]).not.toHaveProperty('replyTo');
  });

  it('returns a failure result with the error message when Resend rejects', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    mocks.send.mockRejectedValue(new Error('rate limited'));
    const { sendEmail } = await import('../src/index.js');

    const result = await sendEmail({ to: 'user@test.com', subject: 'Hi', react: null as never });

    expect(result).toEqual({ success: false, message: 'rate limited' });
  });

  it('falls back to a generic message when Resend rejects with a non-Error value', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    mocks.send.mockRejectedValue('boom');
    const { sendEmail } = await import('../src/index.js');

    const result = await sendEmail({ to: 'user@test.com', subject: 'Hi', react: null as never });

    expect(result).toEqual({
      success: false,
      message: 'Failed to send email. Please try again later.',
    });
  });

  it('constructs the Resend client only once across multiple sendEmail calls', async () => {
    vi.stubEnv('EMAIL_FROM', 'noreply@nsfw-protect.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const { sendEmail } = await import('../src/index.js');

    await sendEmail({ to: 'a@test.com', subject: 'Hi', react: null as never });
    await sendEmail({ to: 'b@test.com', subject: 'Hi', react: null as never });

    expect(mocks.ResendCtor).toHaveBeenCalledTimes(1);
  });
});
