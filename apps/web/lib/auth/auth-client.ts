import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const dummyClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export type AuthClientType = typeof dummyClient;

let _client: AuthClientType | null = null;

export const getAuthClient = (): AuthClientType => {
  if (!_client) {
    _client = createAuthClient({
      baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL,
      plugins: [magicLinkClient()],
    });
  }
  return _client;
};

// Proxies for easy use
export const authClient = new Proxy({} as AuthClientType, {
  get(_, prop) {
    const instance = getAuthClient();
    return (instance as any)[prop];
  },
});

export const signIn = (...args: any[]) => (getAuthClient() as any).signIn(...args);
export const signOut = (...args: any[]) => (getAuthClient() as any).signOut(...args);
export const signUp = (...args: any[]) => (getAuthClient() as any).signUp(...args);
export const useSession = (...args: any[]) => (getAuthClient() as any).useSession(...args);
export const getSession = (...args: any[]) => (getAuthClient() as any).getSession(...args);
