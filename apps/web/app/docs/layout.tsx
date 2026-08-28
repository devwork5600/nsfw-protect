'use client';

import { useEffect } from 'react';
import {
  Shield,
  BookOpen,
  Rocket,
  Key,
  Lock,
  Image as ImageIcon,
  Terminal,
  Menu,
  ChevronRight,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMobileMenu } from '@/lib/store/use-mobile-menu';
import { ForceField } from '@/components/canvasui/ForceField';

const navSections = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', icon: BookOpen, label: 'Overview' },
      { href: '/docs/quickstart', icon: Rocket, label: 'Quickstart' },
    ],
  },
  {
    title: 'Authentication',
    items: [
      { href: '/docs/keys', icon: Key, label: 'API Keys' },
      { href: '/docs/security', icon: Lock, label: 'Security' },
    ],
  },
  {
    title: 'Core API',
    items: [
      { href: '/docs/image', icon: ImageIcon, label: 'Image Analysis' },
      { href: '/docs/batch', icon: Terminal, label: 'Batch Processing' },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
        <Link
          href="/"
          className="font-heading font-bold text-xl tracking-tighter flex items-center gap-2"
          onClick={onClose}
        >
          <Shield className="w-6 h-6 text-primary" />
          NSFWGuard
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 hover:bg-accent border border-transparent hover:border-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">v2.4.0</span>
        <Badge className="rounded-none border-primary/50 text-secondary font-heading px-2 py-0">
          PRO
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-8">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-3 px-2">
                {section.title}
              </h4>
              <div className="flex flex-col space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 transition-colors border-l-[3px]',
                        isActive
                          ? 'text-primary bg-primary/10 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent',
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-heading text-sm font-medium tracking-wider">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/20">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center justify-between text-muted-foreground hover:text-primary transition-colors text-sm font-heading tracking-wider uppercase group"
        >
          Back to Dashboard
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </>
  );
}

function DocsSidebar() {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="relative z-10 w-64 lg:w-72 border-r border-border bg-card hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-all duration-300',
          isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={close}
        />
        {/* Panel */}
        <aside
          className={cn(
            'absolute top-0 left-0 bottom-0 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent onClose={close} />
        </aside>
      </div>
    </>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { toggle } = useMobileMenu();

  return (
    <div className="flex min-h-screen bg-background relative">
      <ForceField
        style={{ position: 'absolute', inset: 0 }}
        shape="hexagon"
        color={[0.15, 0.68, 1]}
        cellScale={26}
        gridReveal="always"
        gridOpacity={0.2}
        hoverGlow={0}
        hoverCharge={0}
        clickRipples={false}
        refraction={0}
        opacity={0.35}
      >
        <></>
      </ForceField>

      <DocsSidebar />

      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Mobile-only sticky header with menu toggle */}
        <header className="lg:hidden h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center gap-4 px-4 shrink-0 sticky top-0 z-10">
          <button
            onClick={toggle}
            className="p-2 hover:bg-accent transition-colors border border-border"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading font-bold tracking-tighter text-lg">Docs</span>
        </header>

        <div className="flex-1 p-8 lg:p-12 pb-24 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
