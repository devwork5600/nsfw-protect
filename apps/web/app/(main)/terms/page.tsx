import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — NSFWGuard',
  description: 'The terms that govern your use of the NSFWGuard API and dashboard.',
};

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: (
      <p>
        By creating an account, generating an API key, or otherwise accessing the NSFWGuard API or
        dashboard (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you
        do not agree, do not use the Service.
      </p>
    ),
  },
  {
    id: 'the-service',
    title: 'Description of the Service',
    body: (
      <p>
        NSFWGuard provides an API that analyzes images you submit and returns automated content
        classification scores. Classification is performed by a machine learning model and is
        provided on a best-effort basis — see{' '}
        <a href="#no-warranty" className="text-primary hover:underline">
          Disclaimer of Warranties
        </a>{' '}
        below.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Account & API Keys',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>You must provide accurate information when creating an account.</li>
        <li>
          You are responsible for all activity that occurs under your account and API keys,
          including keys used by your applications or team members.
        </li>
        <li>
          Keep your API keys confidential. If a key is compromised, rotate it immediately from your{' '}
          <Link href="/dashboard/api-keys" className="text-primary hover:underline">
            API Keys dashboard
          </Link>
          .
        </li>
        <li>
          We are not liable for any loss or damage arising from your failure to secure your account
          or keys.
        </li>
      </ul>
    ),
  },
  {
    id: 'billing',
    title: 'Subscription Plans & Billing',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>Paid plans are billed in advance on a recurring monthly basis through Stripe.</li>
        <li>
          Upgrades take effect immediately and are billed pro-rata for the remainder of the current
          billing cycle. Downgrades take effect at the end of the current billing cycle.
        </li>
        <li>
          You may change your plan once per billing cycle. Further changes unlock at the start of
          your next cycle.
        </li>
        <li>
          Cancelling a subscription stops future renewals; your plan remains active until the end of
          the period you already paid for.
        </li>
        <li>Fees are non-refundable except where required by applicable law.</li>
        <li>
          Failure to pay may result in your subscription being placed on hold or downgraded until
          payment succeeds.
        </li>
      </ul>
    ),
  },
  {
    id: 'usage-limits',
    title: 'API Usage & Rate Limits',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>
          Each plan includes a monthly request quota, shown in your{' '}
          <Link href="/dashboard/usage" className="text-primary hover:underline">
            usage dashboard
          </Link>
          .
        </li>
        <li>
          On plans with metered overage, requests beyond your quota are billed at the published
          overage rate. On plans without metered overage, requests beyond your quota are rejected
          with a rate-limit error until your next billing cycle.
        </li>
        <li>
          We may throttle or suspend API access that we reasonably believe is abusive, automated in
          a way that degrades the Service for other users, or in breach of these Terms.
        </li>
      </ul>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    body: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-primary">
          <li>
            Submit, process, or attempt to generate any content depicting child sexual abuse
            material (CSAM), non-consensual intimate imagery, or content otherwise illegal in the
            jurisdiction where you or your users are located.
          </li>
          <li>Circumvent or interfere with rate limits, quotas, or authentication mechanisms.</li>
          <li>
            Reverse engineer, decompile, or attempt to extract the underlying classification model.
          </li>
          <li>
            Resell or sublicense direct access to the API outside of your own product or service.
          </li>
          <li>
            Use the Service in a way that infringes on the rights of others or violates applicable
            law.
          </li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate this policy, and to
          report unlawful content to the relevant authorities where required by law.
        </p>
      </>
    ),
  },
  {
    id: 'content-ownership',
    title: 'Your Content & Our Intellectual Property',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>
          You retain all rights to the images you submit. As described in our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , submitted images are processed transiently and are not retained or used to train any
          model.
        </li>
        <li>
          The Service, including its software, models, and documentation, is owned by NSFWGuard and
          protected by intellectual property law. These Terms do not grant you any rights to our
          intellectual property beyond the limited right to use the API as described here.
        </li>
      </ul>
    ),
  },
  {
    id: 'no-warranty',
    title: 'Disclaimer of Warranties',
    body: (
      <>
        <p>
          Automated content classification is probabilistic and can produce false positives and
          false negatives. The Service is not a substitute for human review in any context where the
          consequences of misclassification are significant.
        </p>
        <p className="uppercase tracking-wide text-xs font-bold text-muted-foreground">
          The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
          of any kind, express or implied, including merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: (
      <p>
        To the maximum extent permitted by law, NSFWGuard will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of profits or revenue,
        arising from your use of the Service. Our total liability for any claim relating to the
        Service is limited to the amount you paid us in the 12 months preceding the claim.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-primary">
        <li>
          You may stop using the Service and cancel your subscription at any time from your
          dashboard.
        </li>
        <li>
          We may suspend or terminate your access if you breach these Terms, misuse the Service, or
          fail to pay applicable fees.
        </li>
        <li>
          Sections that by their nature should survive termination — including billing obligations
          for usage already incurred, intellectual property, disclaimers, and limitation of
          liability — will survive.
        </li>
      </ul>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: (
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify you
        by email or through a notice on the dashboard before the change takes effect. Continued use
        of the Service after a change takes effect constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        Questions about these Terms? Reach out through{' '}
        <Link href="/support" className="text-primary hover:underline">
          Contact Support
        </Link>{' '}
        and we&apos;ll get back to you.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Terms of <span className="text-primary italic">Service.</span>
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
          Last updated: July 3, 2026
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto tracking-wide">
          These terms govern your access to and use of the NSFWGuard API and dashboard. Please read
          them carefully.
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
