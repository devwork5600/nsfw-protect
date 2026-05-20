import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@nsfw/db';
import { sendEmail } from '@nsfw/email';
import { BetterAuthOptions } from 'better-auth';

export const getAuthOptions = (): BetterAuthOptions => ({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  trustedOrigins: [
    'http://localhost:3000',
    'https://app.nsfw-protect.com',
    'https://api.nsfw-protect.com',
  ],

  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        try {
          const username = email.split('@')[0];
          await sendEmail({
            to: email,
            username,
            subject: 'Your Magic Sign-In Link',
            text: 'Click the button below to sign in.',
            buttonText: 'Sign In',
            linkUrl: url,
          });
        } catch (err) {
          console.error('Failed to send magic link:', err);
          throw new Error('Failed to send email. Please try again later.');
        }
      },
    }),
  ],

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }: { user: { email: string; name?: string | null }; newEmail: string; url: string }) => {
        try {
          const username = user.email.split('@')[0];
          await sendEmail({
            to: user.email,
            username: user.name || username,
            subject: 'Approve Email Change',
            text: `Hi ${user.name || username},\n\nYou requested to change your email to ${newEmail}.\n\nPlease click the link below to approve this change:\n${url}\n\nIf you didn't request this, please ignore this message.`,
            buttonText: 'Approve Email Change',
            linkUrl: url,
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
});

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
    return (instance as any)[prop];
  },
});
