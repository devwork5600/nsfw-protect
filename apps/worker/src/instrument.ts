import * as Sentry from '@sentry/node';

// Must be imported before any other module (see worker.ts) so Sentry's auto-instrumentation
// can patch libraries like ioredis before they're first required. Same DSN as apps/api and
// apps/web — all three report into one shared Sentry project, distinguished by the `service`
// tag below. Reads SENTRY_DSN straight from process.env rather than after dotenv.config()
// runs — in production (Railway) that's already set before the process even starts, so this
// only matters for local dev, where the DSN has to come from the shell env rather than the
// repo's .env file. No-ops safely (sends nothing) when the DSN is unset.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  initialScope: { tags: { service: 'worker' } },
});
