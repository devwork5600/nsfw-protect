import * as Sentry from '@sentry/node';

// Must be imported before any other module (see index.ts) so Sentry's auto-instrumentation
// can patch libraries like ioredis/pg at the moment they're first required, not after. Reads
// SENTRY_DSN straight from process.env rather than after dotenv.config() runs — in production
// (Railway) that's already set before the process even starts, so this only matters for local
// dev, where it just means the DSN has to come from the shell env rather than the repo's .env
// file. No-ops safely (sends nothing) when the DSN is unset, same as apps/web.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // web/api/worker all report into the same Sentry project (one DSN) — this tag is what
  // separates them in the issue stream instead of three separate projects.
  initialScope: { tags: { service: 'api' } },
});
