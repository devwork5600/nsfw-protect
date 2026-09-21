import * as Sentry from '@sentry/nextjs';

// Next.js calls this once per server runtime at boot; it's how Sentry's Node/Edge configs
// (each targeting an API that only exists in their own runtime) get loaded into the right one.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Catches errors from nested React Server Components that the framework itself intercepts
// before they'd otherwise reach a try/catch — without this hook they wouldn't get reported.
export const onRequestError = Sentry.captureRequestError;
