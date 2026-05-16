"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/auth-client";

export default function AuthStatus() {
  const { data: session } = useSession();

 

   return session ? (
     <Link
       href="/dashboard"
       className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-widest font-heading hidden sm:block"
     >
       Dashboard
     </Link>
   ) : (
     <Link
       href="/auth"
       className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-widest font-heading hidden sm:block"
     >
       Connexion
     </Link>
   );
}