const sections = [
  {
    id: 'essential-cookies',
    title: 'Essential Cookies',
    body: (
      <p>
        NSFW Protect uses a single session cookie to keep you signed in to the dashboard and to
        protect against cross-site request forgery. This cookie is strictly necessary for the
        service to work — without it you cannot stay logged in or access your account.
      </p>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    body: (
      <p>
        Checkout and billing are handled by Stripe on Stripe&apos;s own hosted pages. NSFW Protect
        does not load Stripe scripts on its own domain, so no payment-related cookie is set on
        nsfw-protect.com itself. Any cookie set during checkout is set by Stripe under Stripe&apos;s
        own privacy policy.
      </p>
    ),
  },
  {
    id: 'analytics',
    title: 'Analytics',
    body: (
      <p>
        We use Vercel Web Analytics to understand how the site is used (pages visited, referrer,
        device type). This service sets no cookie and uses no persistent identifier: each visit is
        identified by a hashed value derived from the request, automatically discarded after 24
        hours. Data is aggregated and anonymized — it is never tied to an account, email address, or
        IP address.
      </p>
    ),
  },
  {
    id: 'no-advertising',
    title: 'No Advertising Cookies',
    body: (
      <p>
        NSFW Protect uses no advertising cookies and no third-party tracker for marketing or resale
        of data.
      </p>
    ),
  },
  {
    id: 'managing-cookies',
    title: 'Managing Cookies',
    body: (
      <p>
        You can delete or block cookies at any time from your browser settings. Blocking the session
        cookie will prevent you from staying signed in to your account.
      </p>
    ),
  },
];

export const metadata = {
  title: 'Cookie Policy — NSFW Protect',
  description: 'What cookies NSFW Protect uses, and why.',
};

export default function CookiesPage() {
  return (
    <>
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Cookie <span className="text-primary italic">Policy.</span>
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
          Last updated: {new Date().getFullYear()}
        </p>
      </section>

      <section className="px-6 pb-24 max-w-4xl mx-auto space-y-8">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="relative z-10 p-8 border border-border bg-card space-y-4 scroll-mt-24"
          >
            <h2 className="text-xl font-bold uppercase tracking-tighter">{section.title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              {section.body}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
