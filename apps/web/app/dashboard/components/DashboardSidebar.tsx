'use client';

import { useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Key,
  BarChart2,
  Terminal,
  Lock,
  HelpCircle,
  CreditCard,
  TestTubes,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SignOutButton from '@/components/SignOutButton';
import { useMobileMenu } from '@/lib/store/use-mobile-menu';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/playground', icon: TestTubes, label: 'Playground' },
  { href: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
  { href: '/dashboard/usage', icon: BarChart2, label: 'Usage' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { href: '/dashboard/integration', icon: Terminal, label: 'Integration' },
  { href: '/dashboard/security', icon: Lock, label: 'Security' },
  { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
];

function SidebarContent({ plan, onClose }: { plan: string; onClose?: () => void }) {
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
            className="p-2 hover:bg-accent border border-transparent hover:border-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="font-heading text-sm text-muted-foreground uppercase tracking-widest">
          Instance
        </span>
        <Badge className="rounded-none bg-primary text-primary-foreground font-heading">
          {plan}
        </Badge>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 transition-colors border',
                isActive
                  ? 'text-primary bg-primary/10 border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent hover:border-border',
              )}
            >
              <item.icon className="w-4 h-4" />
              <span
                className={cn(
                  'font-heading text-sm tracking-wider uppercase',
                  isActive ? 'font-bold' : 'font-medium',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-border">
        <SignOutButton />
      </div>
    </>
  );
}

export function DashboardSidebar({ plan = 'PRO' }: { plan?: string }) {
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
      <aside className="relative z-10 w-64 border-r border-border bg-card hidden md:flex flex-col">
        <SidebarContent plan={plan} />
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-all duration-300',
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
            'absolute top-0 left-0 bottom-0 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent plan={plan} onClose={close} />
        </aside>
      </div>
    </>
  );
}
