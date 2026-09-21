import { betterAuth, APIError } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@nsfw/db';
import { sendEmail, EmailTemplate } from '@nsfw/email';
import { BetterAuthOptions } from 'better-auth';
import * as React from 'react';

export const getAuthOptions = (): BetterAuthOptions => {
  return {
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    trustedOrigins: [
      'http://localhost:3000',
      'https://nsfw-protect.com',
      'https://www.nsfw-protect.com',
      'https://api.nsfw-protect.com',
    ],

    rateLimit: {
      enabled: true,
      // Persisted in Postgres (the `rateLimit` table, see the Prisma schema) rather than
      // Redis: it's the same trade Better Auth documents — a read-then-write instead of a
      // single atomic increment, so a request or two over the limit can occasionally slip
      // through under heavy concurrency — but this app already pays for Postgres and would
      // pay per-call for a pay-as-you-go Redis, and rate limiting doesn't need perfect
      // precision to do its job. Also avoids Better Auth's in-memory default, which is
      // scoped to a single instance and wouldn't be shared across Vercel's concurrent
      // serverless invocations.
      storage: 'database',
    },

    // Verified live (2026-09-21): www.nsfw-protect.com is proxied through Cloudflare, which
    // overwrites cf-connecting-ip itself and rejects a client-supplied one — safe. But the
    // apex nsfw-protect.com resolves straight to Vercel with no Cloudflare in front, so a
    // request there reaches this app with cf-connecting-ip completely unfiltered: anyone
    // could set it to a fresh value on every request and bypass IP-based rate limiting
    // entirely. x-forwarded-for is safe on both paths — Vercel and Cloudflare each overwrite
    // it themselves — at the cost of bucketing www visitors by Cloudflare's edge IP rather
    // than their real one, until the apex is put behind Cloudflare too (or redirected to
    // www), which would let cf-connecting-ip come back as the more precise option.
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for'],
      },
    },

    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const username = email.split('@')[0];
          // Wrapped in try/catch (unlike the plain-Error version this replaced) because
          // Better Auth's router only special-cases its own APIError — any other thrown
          // value, including a plain Error, becomes an opaque 500 with no client-facing
          // message (confirmed live 2026-09-21: a recipient Resend rejects, e.g. an
          // unverified/sandbox-restricted address, surfaced this way instead of a clean
          // error). A result.success === false from sendEmail is an expected, user-facing
          // failure (bad/rejected recipient) — reported as 400 with the real reason. Anything
          // that throws instead (e.g. EMAIL_FROM missing) is an unexpected config/ops fault —
          // logged here and reported as a generic 500 rather than leaking internal details.
          try {
            const result = await sendEmail({
              to: email,
              subject: 'Your Magic Sign-In Link',
              react: React.createElement(EmailTemplate, {
                username,
                linkUrl: url,
                text: 'Click the button below to sign in.',
                buttonText: 'Sign In',
              }),
            });

            if (!result.success) {
              throw new APIError('BAD_REQUEST', {
                message: result.message || 'Failed to send magic link',
              });
            }
          } catch (err) {
            if (err instanceof APIError) throw err;
            console.error('Failed to send magic link email:', err);
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Failed to send the sign-in email. Please try again later.',
            });
          }
        },
      }),
    ],

    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({
          user,
          newEmail,
          url,
        }: {
          user: { email: string; name?: string | null };
          newEmail: string;
          url: string;
        }) => {
          try {
            const username = user.email.split('@')[0];
            await sendEmail({
              to: user.email,
              subject: 'Approve Email Change',
              react: React.createElement(EmailTemplate, {
                username: user.name || username,
                linkUrl: url,
                text: `Hi ${user.name || username},\n\nYou requested to change your email to ${newEmail}.\n\nPlease click the link below to approve this change:\n${url}\n\nIf you didn't request this, please ignore this message.`,
                buttonText: 'Approve Email Change',
              }),
            });
          } catch (err) {
            console.error('Failed to send email change verification:', err);
            throw new Error('Failed to send email. Please try again later.');
          }
        },
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
  };
};

let _auth: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!_auth) {
    _auth = betterAuth(getAuthOptions());
  }
  return _auth;
};

// For backward compatibility and ease of use where we know envs are loaded
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    const instance = getAuth();
    return instance[prop as keyof typeof instance];
  },
});
