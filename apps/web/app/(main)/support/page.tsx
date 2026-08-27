import Link from 'next/link';
import { BookOpen, FileCode, Mail } from 'lucide-react';
import { FaTwitter, FaGithub } from 'react-icons/fa';
import { getUser } from '@/lib/auth/auth-session';
import { SupportForm } from './support-form';

export const metadata = {
  title: 'Contact Support — NSFWGuard',
  description: 'Get in touch with the NSFWGuard team.',
};

export default async function SupportPage() {
  const user = await getUser();

  return (
    <>
      <section className="py-24 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight italic uppercase">
          Contact <span className="text-primary italic">Support.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto tracking-wide">
          Questions, bugs, or billing issues — tell us what&apos;s going on and an engineer will get
          back to you.
        </p>
      </section>

      <section className="px-6 pb-24 max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="relative z-10 md:col-span-2 p-8 border border-border bg-card">
          <SupportForm defaultName={user?.name ?? undefined} defaultEmail={user?.email} />
        </div>

        <div className="space-y-6">
          <div className="relative z-10 p-8 border border-border bg-card space-y-4">
            <h2 className="font-bold uppercase tracking-tighter text-sm">Quick Resources</h2>
            <div className="space-y-1">
              <Link
                href="/docs"
                className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors border border-transparent hover:border-border group"
              >
                <BookOpen className="size-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Documentation</span>
              </Link>
              <Link
                href="/docs/image"
                className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors border border-transparent hover:border-border group"
              >
                <FileCode className="size-4 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">API Reference</span>
              </Link>
            </div>
          </div>

          <div className="relative z-10 p-8 border border-border bg-card space-y-4">
            <h2 className="font-bold uppercase tracking-tighter text-sm">Direct Contact</h2>
            <p className="text-sm text-muted-foreground">Prefer other channels? Reach us here:</p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <FaTwitter className="size-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <FaGithub className="size-4" />
              </a>
              <a
                href="mailto:support@nsfw-protect.com"
                aria-label="Email support"
                className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          <div className="relative z-10 p-8 border border-primary/30 bg-card space-y-3">
            <h2 className="font-bold uppercase tracking-tighter text-sm text-primary">
              Response Times
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Starter and Pro plans typically get a reply within 4–8 hours. Enterprise customers get
              priority routing and a dedicated Slack channel.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
