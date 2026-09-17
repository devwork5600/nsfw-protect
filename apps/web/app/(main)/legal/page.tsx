const sections = [
  {
    id: 'demo-notice',
    title: 'Demo Project Notice',
    body: (
      <p>
        NSFW Protect is a portfolio project demonstrating a content-moderation API. Payments are
        processed in Stripe test mode — no real charge is ever made.
      </p>
    ),
  },
  {
    id: 'publisher',
    title: 'Site Publisher',
    body: (
      <>
        <p>
          This site is published by Adrien Delagneau, based in France. As required by French law
          (article 6-III of the LCEN — Loi pour la confiance dans l&apos;économie numérique),
          non-commercial individual publishers may keep their postal address private and are not
          required to hold a business registration number.
        </p>
        <p>Contact: devwork5600@gmail.com</p>
      </>
    ),
  },
  {
    id: 'publication-director',
    title: 'Publication Director',
    body: <p>Adrien Delagneau.</p>,
  },
  {
    id: 'hosting',
    title: 'Hosting Provider',
    body: (
      <p>
        This site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States (
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          vercel.com
        </a>
        ).
      </p>
    ),
  },
];

export const metadata = {
  title: 'Legal Notice — NSFW Protect',
  description: 'Publisher and hosting provider identification, as required by French law.',
};

export default function LegalNoticePage() {
  return (
    <>
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Legal <span className="text-primary italic">Notice.</span>
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
