'use client';

import {
  Shield,
  BookOpen,
  Rocket,
  Key,
  Lock,
  Image as ImageIcon,
  Video,
  Terminal,
  Menu,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMobileMenu } from '@/lib/store/use-mobile-menu';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { toggle } = useMobileMenu();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-border bg-card shrink-0 md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border justify-between md:justify-start">
          <Link
            href="/"
            className="font-heading font-bold text-xl tracking-tighter flex items-center gap-2"
          >
            <Shield className="w-6 h-6 text-primary" />
            NSFWGuard
          </Link>
          <button
            onClick={toggle}
            className="md:hidden p-2 hover:bg-accent transition-colors border border-border"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">v2.4.0</span>
          <Badge className="rounded-none border-primary/50 text-primary font-heading px-2 py-0">
            PRO
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-8">
            <div>
              <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-3 px-2">
                Getting Started
              </h4>
              <div className="flex flex-col space-y-1">
                <Link
                  href="/docs"
                  className="flex items-center gap-3 px-2 py-2 text-primary bg-primary/10 border-l-[3px] border-primary transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">Overview</span>
                </Link>
                <Link
                  href="/docs/quickstart"
                  className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l-[3px] border-transparent"
                >
                  <Rocket className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">
                    Quickstart
                  </span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-3 px-2">
                Authentication
              </h4>
              <div className="flex flex-col space-y-1">
                <Link
                  href="/docs/keys"
                  className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l-[3px] border-transparent"
                >
                  <Key className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">API Keys</span>
                </Link>
                <Link
                  href="/docs/security"
                  className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l-[3px] border-transparent"
                >
                  <Lock className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">Security</span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-3 px-2">
                Core API
              </h4>
              <div className="flex flex-col space-y-1">
                <Link
                  href="/docs/image"
                  className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l-[3px] border-transparent"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">
                    Image Analysis
                  </span>
                </Link>

                <Link
                  href="/docs/batch"
                  className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l-[3px] border-transparent"
                >
                  <Terminal className="w-4 h-4" />
                  <span className="font-heading text-sm font-medium tracking-wider">
                    Batch Processing
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-muted/20">
          <Link
            href="/dashboard"
            className="flex items-center justify-between text-muted-foreground hover:text-primary transition-colors text-sm font-heading tracking-wider uppercase group"
          >
            Back to Dashboard
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </aside>

      {/* Main Documentation Area */}
      <main className="flex-1 flex flex-col items-stretch max-w-[1400px]">
        <div className="flex-1 w-full flex">
          <div className="flex-1 p-8 lg:p-12 pb-24">{children}</div>
        </div>
      </main>
    </div>
  );
}
