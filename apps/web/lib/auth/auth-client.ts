'use client';

import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    (typeof window !== 'undefined' ? window.location.origin : undefined),
  plugins: [magicLinkClient()],
});

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const useSession = authClient.useSession;

export const signOut: typeof authClient.signOut = async (...args) => {
  return await authClient.signOut(...args);
};

export const getSession: typeof authClient.getSession = async (...args) => {
  return await authClient.getSession(...args);
};
