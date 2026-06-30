'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from './ui/button';

export default function AuthStatus() {
  const { data: session } = authClient.useSession();

  return session ? (
    <Button className="font-heading uppercase tracking-widest px-3 sm:px-4">
      <Link href="/dashboard">Dashboard</Link>
    </Button>
  ) : (
    <Button className="font-heading uppercase tracking-widest px-3 sm:px-4">
      <Link href="/auth">Connexion</Link>
    </Button>
  );
}
