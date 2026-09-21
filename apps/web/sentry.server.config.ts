import * as Sentry from '@sentry/nextjs';

// Same DSN as the client config: a Sentry DSN is a write-only key (it can only submit events,
// never read data back), so it's safe to expose in the browser bundle by design — no need for
// a separate server-only secret here. No-ops safely when unset, same as instrumentation-client.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // See instrumentation-client.ts — same shared Sentry project across all three services.
  initialScope: { tags: { service: 'web' } },
});
