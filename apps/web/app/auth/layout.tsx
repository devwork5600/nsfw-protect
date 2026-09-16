import type { Metadata } from 'next';

// Sign-in/sign-up form, no unique content worth ranking for — noindex
// keeps it out of search results (standard practice for auth pages) so a
// "NSFW Protect" search lands people on the marketing homepage, not a
// login form.
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
