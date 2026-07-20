import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — NSFWGuard',
  description: 'How NSFWGuard collects, uses, and protects your data.',
};

const sections = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    body: (
      <>
        <p>We collect the following categories of information when you use NSFWGuard:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-primary">
          <li>
            <span className="text-foreground font-medium">Account information</span> — your email
            address, name, and a hashed password, or your Google/GitHub profile identifier if you
            sign in with a social provider.
          </li>
          <li>
            <span className="text-foreground font-medium">Billing information</span> — your
            subscription plan, Stripe customer and subscription identifiers, and invoice history.
            Card details are collected and stored directly by Stripe; we never see or store your
            full card number.
          </li>
          <li>
            <span className="text-foreground font-medium">API keys</span> — we store a SHA-256 hash
            and a 7-character prefix of each key for identification. The raw key is shown to you
            once at creation and is never stored or logged in plaintext.
          </li>
          <li>
            <span className="text-foreground font-medium">Technical data</span> — IP address,
            browser user agent, and session tokens, used to authenticate requests and detect abuse.
          </li>
          <li>
            <span className="text-foreground font-medium">Content you submit</span> — images sent to
            our classification API. See{' '}
            <a href="#image-handling" className="text-primary hover:underline">
              How We Handle Your Images
            </a>{' '}
            below for exactly how this is processed and discarded.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'image-handling',
    title: 'How We Handle Your Images',
    body: (
      <>
        <p>
          Image content is the most sensitive data our API touches, so we minimize how long it
          exists on our infrastructure:
        </p>
        <ul className="list-disc pl-6 space-y-2 marker:text-primary">
          <li>
            When you submit an image to{' '}
            <code className="font-mono text-sm bg-muted text-primary px-1 border border-border">
              POST /classify
            </code>
            , it is resized and briefly written to encrypted object storage solely so our
            classification worker can pick it up.
          </li>
          <li>The object is automatically deleted as soon as classification completes.</li>
          <li>
            We do not use images you submit to train, fine-tune, or evaluate any machine learning
            model.
          </li>
          <li>
            The classification result (labels and scores) is returned directly in the API response
            and cached for up to 1 hour, then it is automatically purged.
          </li>
          <li>
            We retain only aggregate usage metadata — timestamps, request counts, and whether
            content was flagged — for billing and abuse prevention. We never retain the image
            itself.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>To provide, operate, and maintain the API and dashboard.</li>
        <li>To process payments and manage subscriptions through Stripe.</li>
        <li>
          To send transactional emails — payment receipts, plan-change confirmations, and security
          notices.
        </li>
        <li>
          To enforce rate limits, usage quotas, and detect fraudulent or abusive use of the API.
        </li>
        <li>To respond to support requests you send us.</li>
        <li>To comply with tax, accounting, and other legal obligations.</li>
      </ul>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-Party Service Providers',
    body: (
      <>
        <p>
          We share the minimum data necessary with the following providers to operate NSFWGuard:
        </p>
        <ul className="list-disc pl-6 space-y-2 marker:text-primary">
          <li>
            <span className="text-foreground font-medium">Stripe</span> — payment processing and
            subscription billing.
          </li>
          <li>
            <span className="text-foreground font-medium">Resend</span> — delivery of transactional
            emails (receipts, plan updates, security notices).
          </li>
          <li>
            <span className="text-foreground font-medium">Neon (PostgreSQL)</span> — encrypted
            hosting of our application database.
          </li>
          <li>
            <span className="text-foreground font-medium">Cloudflare R2</span> — transient,
            encrypted object storage used only during image classification, as described above.
          </li>
          <li>
            <span className="text-foreground font-medium">Google / GitHub</span> — optional OAuth
            sign-in, if you choose to use it instead of an email and password.
          </li>
        </ul>
        <p>
          Each provider processes data under its own privacy policy and is contractually limited to
          using it only to provide services to us.
        </p>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>Account data is retained for as long as your account is active.</li>
        <li>
          Billing records are retained as required by tax and accounting regulations, typically
          several years after account closure.
        </li>
        <li>
          Session tokens expire automatically and are not retained beyond their validity period.
        </li>
        <li>
          Submitted images are retained only transiently — typically seconds — during
          classification, as described above.
        </li>
        <li>
          You can request deletion of your account and associated data at any time; see &quot;Your
          Rights&quot; below.
        </li>
      </ul>
    ),
  },
  {
    id: 'security',
    title: 'Security Measures',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>All API and dashboard traffic is encrypted in transit using TLS 1.3.</li>
        <li>
          API keys and passwords are hashed with SHA-256 / industry-standard algorithms — we never
          store them in plaintext.
        </li>
        <li>Database connections use SSL with certificate verification.</li>
        <li>Object storage used for image processing is encrypted at rest.</li>
        <li>
          Access to production systems is restricted to authorized personnel on a least-privilege
          basis.
        </li>
      </ul>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-primary">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Request a copy of your data in a portable format.</li>
          <li>Object to or restrict certain processing of your data.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us via{' '}
          <Link href="/support" className="text-primary hover:underline">
            Support
          </Link>
          . We will respond within the timeframe required by applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        We use a small number of strictly necessary cookies to maintain your login session and
        protect against cross-site request forgery. We do not use third-party advertising or
        cross-site tracking cookies.
      </p>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    body: (
      <p>
        NSFWGuard is a developer tool and is not directed at, or knowingly used to collect data
        from, individuals under the age of 16. If you believe a minor has provided us with personal
        data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    body: (
      <p>
        Our infrastructure providers may process and store data in countries other than your own.
        Where this occurs, we rely on the safeguards required by applicable data protection law,
        such as standard contractual clauses.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: (
      <p>
        We may update this policy from time to time. If we make material changes, we will notify you
        by email or through a notice on the dashboard before the change takes effect. The &quot;Last
        updated&quot; date at the top of this page always reflects the most recent revision.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        Questions about this policy or how your data is handled? Reach out through{' '}
        <Link href="/support" className="text-primary hover:underline">
          Contact Support
        </Link>{' '}
        and we&apos;ll get back to you.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Privacy <span className="text-primary italic">Policy.</span>
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
          Last updated: July 3, 2026
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto tracking-wide">
          This policy explains what data NSFWGuard collects, how we use it, and — because our core
          product classifies images you submit — exactly what happens to that content.
        </p>
      </section>

      <section className="px-6 pb-24 max-w-4xl mx-auto space-y-8">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="p-8 border border-border bg-card space-y-4 scroll-mt-24"
          >
            <h2 className="text-xl font-bold uppercase tracking-tighter">{section.title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              {section.body}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
