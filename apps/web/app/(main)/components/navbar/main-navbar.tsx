'use client';

import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Menu } from 'lucide-react';
import Link from 'next/link';
import { useMobileMenu } from '@/lib/store/use-mobile-menu';

const MainNavbar = () => {
  const { toggle } = useMobileMenu();

  return (
    <nav className="border-b border-border bg-background fixed top-0 z-50 w-full">
      <div className="container mx-auto max-w-360 flex gap-2 sm:gap-4 items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="md:hidden p-2 hover:text-primary transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/"
            className="font-heading font-bold text-xl tracking-tighter flex items-center gap-2"
          >
            <Shield className="w-6 h-6 text-primary" />
            <span className="truncate">NSFWGuard</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-heading"
            >
              Documentations
            </Link>
            <Link
              href="/billing"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-heading"
            >
              Pricing
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="items-center gap-4">
            <AuthStatus />
          </div>
          <Button
            variant="default"
            className="font-heading uppercase tracking-widest px-3 sm:px-4 hidden sm:flex items-center"
          >
            <span>Get API Key</span>
            <ArrowRight className="sm:ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
