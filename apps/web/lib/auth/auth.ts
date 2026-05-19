import { getAuthOptions } from '@nsfw/auth';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

const options = getAuthOptions();
export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins || []), nextCookies()],
});

