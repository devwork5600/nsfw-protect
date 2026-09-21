import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BetterAuthOptions } from 'better-auth';

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  betterAuthCtor: vi.fn(),
  prismaAdapter: vi.fn(),
  magicLink: vi.fn(),
}));

vi.mock('@nsfw/db', () => ({ prisma: {} }));
vi.mock('@nsfw/email', () => ({
  sendEmail: mocks.sendEmail,
  EmailTemplate: () => null,
}));
vi.mock('better-auth', async (importOriginal) => {
  // Keeps the real APIError class (server.ts's error handling constructs and checks
  // `instanceof APIError`) while still mocking the betterAuth constructor itself.
  const actual = await importOriginal<typeof import('better-auth')>();
  return { ...actual, betterAuth: mocks.betterAuthCtor };
});
vi.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: mocks.prismaAdapter }));
vi.mock('better-auth/plugins', () => ({
  magicLink: mocks.magicLink.mockImplementation((opts: unknown) => ({ id: 'magic-link', opts })),
}));

import { getAuthOptions } from '../src/server.js';

type SendMagicLink = (args: { email: string; url: string }) => Promise<void>;

function getSendMagicLink(): SendMagicLink {
  getAuthOptions();
  const opts = mocks.magicLink.mock.calls[0][0] as { sendMagicLink: SendMagicLink };
  return opts.sendMagicLink;
}

describe('getAuthOptions', () => {
  beforeEach(() => {
    mocks.sendEmail.mockReset().mockResolvedValue({ success: true });
    mocks.magicLink.mockClear();
    mocks.prismaAdapter.mockClear();
  });

  describe('magic link sign-in email', () => {
    it('derives the username from the email local part and sends the magic link email', async () => {
      const sendMagicLink = getSendMagicLink();

      await sendMagicLink({ email: 'jane.doe@test.com', url: 'https://app/magic?token=abc' });

      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane.doe@test.com',
          subject: 'Your Magic Sign-In Link',
        }),
      );
    });

    it('throws with the failure message when sendEmail reports failure', async () => {
      mocks.sendEmail.mockResolvedValue({ success: false, message: 'rate limited' });
      const sendMagicLink = getSendMagicLink();

      await expect(sendMagicLink({ email: 'jane@test.com', url: 'https://x' })).rejects.toThrow(
        'rate limited',
      );
    });

    it('falls back to a generic message when sendEmail fails without one', async () => {
      mocks.sendEmail.mockResolvedValue({ success: false });
      const sendMagicLink = getSendMagicLink();

      await expect(sendMagicLink({ email: 'jane@test.com', url: 'https://x' })).rejects.toThrow(
        'Failed to send magic link',
      );
    });

    it('does not throw when sendEmail succeeds', async () => {
      const sendMagicLink = getSendMagicLink();
      await expect(
        sendMagicLink({ email: 'jane@test.com', url: 'https://x' }),
      ).resolves.toBeUndefined();
    });

    it('reports an expected sendEmail failure as a 400, not an opaque 500', async () => {
      mocks.sendEmail.mockResolvedValue({ success: false, message: 'recipient rejected' });
      const sendMagicLink = getSendMagicLink();

      const error: unknown = await sendMagicLink({ email: 'jane@test.com', url: 'https://x' })
        .then(() => null)
        .catch((e) => e);

      expect(error).toMatchObject({ status: 'BAD_REQUEST', message: 'recipient rejected' });
    });

    it('logs and reports an unexpected sendEmail throw as a generic 500, hiding the internal message', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.sendEmail.mockRejectedValue(new Error('EMAIL_FROM is not set'));
      const sendMagicLink = getSendMagicLink();

      const error: unknown = await sendMagicLink({ email: 'jane@test.com', url: 'https://x' })
        .then(() => null)
        .catch((e) => e);

      expect(error).toMatchObject({ status: 'INTERNAL_SERVER_ERROR' });
      expect((error as Error).message).not.toContain('EMAIL_FROM');
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send magic link email:',
        expect.objectContaining({ message: 'EMAIL_FROM is not set' }),
      );
      consoleError.mockRestore();
    });
  });

  describe('change-email confirmation', () => {
    function getSendChangeEmailConfirmation(options: BetterAuthOptions) {
      return options.user!.changeEmail!.sendChangeEmailConfirmation!;
    }

    it('sends the confirmation email to the current address with the new address in the body', async () => {
      const options = getAuthOptions();
      const send = getSendChangeEmailConfirmation(options);

      await send({
        user: { email: 'jane@test.com', name: 'Jane' },
        newEmail: 'new@test.com',
        url: 'https://x',
      } as never);

      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'jane@test.com', subject: 'Approve Email Change' }),
      );
      const call = mocks.sendEmail.mock.calls.at(-1)![0];
      expect(call.react.props.text).toContain('new@test.com');
    });

    it('falls back to the email local part when the user has no display name', async () => {
      const options = getAuthOptions();
      const send = getSendChangeEmailConfirmation(options);

      await send({
        user: { email: 'jane@test.com' },
        newEmail: 'new@test.com',
        url: 'https://x',
      } as never);

      const call = mocks.sendEmail.mock.calls.at(-1)![0];
      expect(call.react.props.username).toBe('jane');
    });

    it('wraps a sendEmail failure in a friendlier, user-facing error message', async () => {
      mocks.sendEmail.mockRejectedValue(new Error('smtp down'));
      const options = getAuthOptions();
      const send = getSendChangeEmailConfirmation(options);

      await expect(
        send({
          user: { email: 'jane@test.com' },
          newEmail: 'new@test.com',
          url: 'https://x',
        } as never),
      ).rejects.toThrow('Failed to send email. Please try again later.');
    });

    it('reports an expected sendEmail failure as a 400, not an opaque 500', async () => {
      mocks.sendEmail.mockResolvedValue({ success: false, message: 'recipient rejected' });
      const options = getAuthOptions();
      const send = getSendChangeEmailConfirmation(options);

      const error: unknown = await send({
        user: { email: 'jane@test.com' },
        newEmail: 'new@test.com',
        url: 'https://x',
      } as never)
        .then(() => null)
        .catch((e) => e);

      expect(error).toMatchObject({ status: 'BAD_REQUEST', message: 'recipient rejected' });
    });

    it('hides the internal error message behind a generic 500', async () => {
      mocks.sendEmail.mockRejectedValue(new Error('smtp down'));
      const options = getAuthOptions();
      const send = getSendChangeEmailConfirmation(options);

      const error: unknown = await send({
        user: { email: 'jane@test.com' },
        newEmail: 'new@test.com',
        url: 'https://x',
      } as never)
        .then(() => null)
        .catch((e) => e);

      expect(error).toMatchObject({ status: 'INTERNAL_SERVER_ERROR' });
      expect((error as Error).message).not.toContain('smtp down');
    });
  });

  it('wires the Prisma adapter with the postgresql provider', () => {
    getAuthOptions();
    expect(mocks.prismaAdapter).toHaveBeenCalledWith(expect.anything(), { provider: 'postgresql' });
  });

  describe('rate limiting', () => {
    it('is enabled and persisted in Postgres rather than the in-memory default', () => {
      const options = getAuthOptions();
      expect(options.rateLimit).toMatchObject({ enabled: true, storage: 'database' });
    });
  });

  describe('client IP resolution', () => {
    it('trusts only x-forwarded-for, not cf-connecting-ip', () => {
      // Verified live (2026-09-21): the apex domain resolves straight to Vercel with no
      // Cloudflare in front, so a request there reaches this app with cf-connecting-ip
      // completely unfiltered — trusting it would let a visitor set any value they like and
      // bypass IP-based rate limiting entirely. x-forwarded-for is safe on every path this
      // app is reachable from (Vercel and Cloudflare each overwrite it themselves).
      const options = getAuthOptions();
      expect(options.advanced?.ipAddress?.ipAddressHeaders).toEqual(['x-forwarded-for']);
    });
  });
});

describe('getAuth', () => {
  it('constructs the better-auth instance only once across multiple calls', async () => {
    vi.resetModules();
    mocks.betterAuthCtor.mockReset().mockReturnValue({ instance: true });
    const { getAuth } = await import('../src/server.js');

    getAuth();
    getAuth();

    expect(mocks.betterAuthCtor).toHaveBeenCalledTimes(1);
  });
});
