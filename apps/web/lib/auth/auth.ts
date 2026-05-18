import { getAuthOptions } from '@nsfw/auth';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

let _auth: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!_auth) {
    const options = getAuthOptions();
    _auth = betterAuth({
      ...options,
      plugins: [...(options.plugins || []), nextCookies()],
    });
  }
  return _auth;
};

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    const instance = getAuth();
    return (instance as any)[prop];
  },
});
