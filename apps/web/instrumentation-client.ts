import * as Sentry from '@sentry/nextjs';

// Sentry.init() is a safe no-op when dsn is undefined/empty — it disables itself and sends
// nothing, so this runs unconditionally rather than gating it behind an env-var check. That
// means local dev and any environment without NEXT_PUBLIC_SENTRY_DSN configured just don't
// report, with no separate code path to keep in sync.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Full traces in dev (cheap, low volume); a sample in production to bound cost/noise.
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // web/api/worker all report into the same Sentry project (one DSN) — this tag is what
  // separates them in the issue stream instead of three separate projects.
  initialScope: { tags: { service: 'web' } },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
