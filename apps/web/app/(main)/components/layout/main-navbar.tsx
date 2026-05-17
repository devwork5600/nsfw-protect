import AuthStatus from '@/components/AuthStatus'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'

const MainNavbar = () => {
  return (
  <nav className="border-b border-border bg-background/80 backdrop-blur-md fixed top-0 z-50 w-full">
        <div className="container mx-auto max-w-360 flex gap-2 sm:gap-4 items-center justify-between h-16 px-4">
          <div className="flex items-center gap-8">
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
                Documentation
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
             <AuthStatus />
             <Button
               variant="default"
               className="font-heading uppercase tracking-widest rounded-none shadow-[0_0_5px_rgba(0,245,255,0.7)] hover:shadow-[0_0_8px_rgba(0,245,255,0.7)] transition-shadow px-3 sm:px-4"
             >
               <span className="hidden sm:inline">Get API Key</span>
               <span className="sm:hidden">API Key</span>
               <ArrowRight className="sm:ml-2 w-4 h-4" />
             </Button>
           </div>
        </div>
      </nav>
  )
}

export default MainNavbar;
