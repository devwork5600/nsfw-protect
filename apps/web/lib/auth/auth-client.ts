import { authClient } from '@nsfw/auth/client';

export { authClient };
export const { signIn, signOut, signUp, useSession, getSession } = authClient;
