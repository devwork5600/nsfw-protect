'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  X,
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Key,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/store/use-mobile-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/auth-client';

export function MobileMenu() {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  // Close menu on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isDocs = pathname.startsWith('/docs');
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <div
      className={cn(
        'fixed inset-0 z-100 md:hidden transition-all duration-300',
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none',
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={close}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'absolute top-0 left-0 bottom-0 w-[280px] bg-card border-r border-border shadow-2xl flex flex-col transition-transform duration-500 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link
            href="/"
            className="font-heading font-bold text-xl tracking-tighter flex items-center gap-2"
            onClick={close}
          >
            <Shield className="w-6 h-6 text-primary" />
            NSFWGuard
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="p-2 hover:bg-accent transition-colors rounded-none border border-transparent hover:border-border"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Main Navigation */}
          <div
            className={cn(
              'transition-all duration-500 delay-100',
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            )}
          >
            {/* <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-4">
              Main
            </h4> */}
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href="/docs"
                className="font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/billing"
                className="font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Contextual Navigation (Docs or Dashboard) */}
          {(isDocs || isDashboard) && (
            <div
              className={cn(
                'transition-all duration-500 delay-200',
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <h4 className="text-xs font-heading font-bold tracking-widest uppercase text-muted-foreground mb-4">
                {isDocs ? 'Documentation' : 'Dashboard'}
              </h4>
              <div className="flex flex-col space-y-3">
                {isDocs ? (
                  <>
                    <Link
                      href="/docs"
                      className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      <BookOpen className="w-4 h-4" /> Overview
                    </Link>
                    <Link
                      href="/docs/quickstart"
                      className="font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      Quickstart
                    </Link>
                    <Link
                      href="/docs/keys"
                      className="font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      API Keys
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Overview
                    </Link>
                    <Link
                      href="/dashboard/api-keys"
                      className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      <Key className="w-4 h-4" /> API Keys
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                    >
                      <CreditCard className="w-4 h-4" /> Billing
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Account */}
          <div
            className={cn(
              'pt-4 border-t border-border transition-all duration-500 delay-300',
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            )}
          >
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {session.user.name?.[0] || session.user.email[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold truncate max-w-[150px]">
                      {session.user.name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase hover:text-primary transition-colors"
                  onClick={close}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await authClient.signOut();
                    close();
                    window.location.href = '/';
                  }}
                  className="flex items-center gap-2 font-heading text-sm font-medium tracking-wider uppercase text-destructive hover:opacity-80 transition-opacity"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth" onClick={close}>
                <Button className="w-full font-heading uppercase tracking-widest rounded-none">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="p-6 border-t border-border bg-muted/20">
          <Link
            href="/support"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-heading tracking-widest uppercase"
            onClick={close}
          >
            <HelpCircle className="w-4 h-4" /> Support
          </Link>
        </div>
      </div>
    </div>
  );
}
