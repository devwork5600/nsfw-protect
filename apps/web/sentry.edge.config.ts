import * as Sentry from '@sentry/nextjs';

// Covers middleware and any Edge-runtime route handlers. Same DSN/reasoning as
// sentry.server.config.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  initialScope: { tags: { service: 'web' } },
});
