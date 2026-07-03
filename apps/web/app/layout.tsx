import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NSFWGuard',
  description: 'AI-powered NSFW content detection for developers and enterprises',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'NSFWGuard - AI-Powered Content Moderation',
    description:
      'Real-time NSFW detection with 99%+ accuracy. Protect your users and brand with advanced AI moderation. Easy API integration, enterprise-grade performance.',
    url: 'https://nsfwguard.com',
    siteName: 'NSFWGuard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NSFWGuard Content Moderation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NSFWGuard - AI-Powered Content Moderation',
    description:
      'Real-time NSFW detection with 99%+ accuracy. Protect your users and brand with advanced AI moderation.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col scrollbar-hide">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
