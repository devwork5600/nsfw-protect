import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

// Static CSP (no nonce): keeps every page statically rendered/CDN-cached, same as today —
// the nonce-based alternative Next.js also supports forces dynamic rendering on every page
// (no ISR, no CDN caching, higher hosting cost) just to allow its own hydration scripts,
// which isn't worth it for this app's actual risk profile. 'unsafe-inline' on script-src is
// the real trade-off that buys back static rendering: it means an attacker who found an HTML
// injection point elsewhere could get an inline <script> to execute. The other directives
// below don't depend on that trade-off and still hold regardless: no other domain can load a
// script here, the page can't be framed, forms can't submit elsewhere, plugins/Flash-era
// object embeds are blocked outright.
//
// Origins allowed beyond 'self', and why:
// - api.nsfw-protect.com (connect-src): the dashboard playground calls it directly from the
//   browser (apps/web/app/dashboard/playground/page.tsx).
// - va.vercel-scripts.com (script-src): Vercel Analytics' script tag. Its own data beacon
//   posts to /_vercel/insights/* on this same origin, so connect-src doesn't need it too.
// Fonts (next/font/google) are self-hosted at build time, never fetched from Google at
// runtime, so font-src/style-src need nothing beyond 'self'.
const isDev = process.env.NODE_ENV === 'development';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://api.nsfw-protect.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          // Backstop for browsers that don't honor frame-ancestors; same 'deny everyone' intent.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stops the browser guessing a response's content-type from its bytes (e.g. treating
          // an uploaded "image" as HTML/script), which is how a MIME-sniffing XSS starts.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Sends the full URL only to same-origin requests; cross-origin gets just the
          // origin, never the path/query (e.g. no leaking a dashboard URL to an external link).
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Denies every powerful browser feature this app never asks for.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

// Applied unconditionally, even before SENTRY_ORG/PROJECT/AUTH_TOKEN are set: verified in
// @sentry/bundler-plugin-core that a missing authToken just logs "No auth token provided...
// Will not upload source maps" and skips that step — it never fails the build. Until those
// three are configured, source maps just won't upload (readable stack traces are a nice-to-have
// this buys later); Sentry.init() already reports errors either way.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Quiets the plugin's own build-log noise; real errors still surface.
  silent: true,
  // Proxies browser event submission through this app's own domain under an
  // unlikely-to-be-blocklisted path, instead of directly to Sentry's ingest domain — ad
  // blockers commonly block the latter, silently losing client-side error reports. Works
  // independently of the source-map options above.
  tunnelRoute: '/monitoring-tunnel',
});
