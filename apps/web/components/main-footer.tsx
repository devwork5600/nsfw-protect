import Link from 'next/link';

import { Terminal, Shield, Mail } from 'lucide-react';

import { FaTwitter, FaGithub } from 'react-icons/fa';

const MainFooter = () => {
  return (
    <footer className="border-t border-border bg-background py-12 mt-12">
      <div className="container mx-auto max-w-360 px-4 flex flex-col 2xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground font-heading">
          <Shield className="w-5 h-5 text-primary" />
          <span className="tracking-widest uppercase text-sm font-bold">
            © {new Date().getFullYear()} NSFWGuard API. Engineered Precision.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground uppercase font-heading tracking-widest">
          <Link href="/privacy" className="hover:text-primary transition-colors font-bold">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors font-bold">
            Terms of Service
          </Link>
          <Link href="/security" className="hover:text-primary transition-colors font-bold">
            Security Audit
          </Link>
          <Link href="/support" className="hover:text-primary transition-colors font-bold">
            Contact Support
          </Link>
        </div>

        <div className="flex gap-4">
          <Link
            href="#"
            className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Terminal className="w-4 h-4" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <FaTwitter className="w-4 h-4" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <FaGithub className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
