import { Shield } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Shield className="text-primary h-10 w-10" />
      <p className="text-primary text-sm tracking-widest uppercase">Error 404</p>
      <h1 className="text-3xl font-semibold sm:text-4xl">This endpoint doesn&apos;t exist</h1>
      <p className="text-muted-foreground max-w-md">
        The page you&apos;re looking for isn&apos;t here. Check the URL, or head back to safety.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
