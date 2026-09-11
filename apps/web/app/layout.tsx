import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { SITE_URL } from '@/lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NSFW Protect - AI-Powered Content Moderation',
    template: '%s | NSFW Protect',
  },
  description:
    'Real-time NSFW detection with 99%+ accuracy. Protect your users and brand with advanced AI moderation. Easy API integration, enterprise-grade performance.',
  keywords: [
    'NSFW detection',
    'content moderation API',
    'image moderation',
    'AI content moderation',
    'NSFW classifier',
    'image classification API',
  ],
  authors: [{ name: 'NSFW Protect' }],
  creator: 'NSFW Protect',
  publisher: 'NSFW Protect',
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'NSFW Protect - AI-Powered Content Moderation',
    description:
      'Real-time NSFW detection with 99%+ accuracy. Protect your users and brand with advanced AI moderation. Easy API integration, enterprise-grade performance.',
    url: SITE_URL,
    siteName: 'NSFW Protect',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NSFW Protect Content Moderation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NSFW Protect - AI-Powered Content Moderation',
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
