'use client';

import Link from 'next/link';
import { signOut } from '@/lib/auth/auth-client';
import { LogOutIcon } from 'lucide-react';

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
    >
      <LogOutIcon />
      <span className="font-heading text-sm font-medium tracking-wider uppercase">Sign Out</span>
    </button>
  );
}
