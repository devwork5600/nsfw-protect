'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Special Next.js file: it replaces the ENTIRE root layout (html/body included) when an error
// escapes the root layout itself — the one place a normal error.tsx can't catch, since it
// renders inside that same layout. Kept intentionally plain (no Tailwind/shadcn) since the
// layout that would normally supply fonts/styles is exactly what may have failed to render.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* Next.js's own built-in error page component — reused here as a plain, dependency-free
            fallback rather than reimplementing one, since anything richer risks depending on the
            layout that just failed. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
