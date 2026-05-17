"use client";

import { Menu } from "lucide-react";
import { useMobileMenu } from "@/lib/store/use-mobile-menu";

export function DashboardHeader({ title }: { title: string }) {
  const { toggle } = useMobileMenu();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 md:px-8 shrink-0 sticky top-0 z-10 w-full justify-between">
      <h1 className="font-heading font-bold text-xl tracking-tighter uppercase text-foreground">{title}</h1>
      <button 
        onClick={toggle}
        className="md:hidden p-2 hover:bg-accent transition-colors border border-border"
        aria-label="Toggle Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}
