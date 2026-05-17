"use client";

import { Shield, LayoutDashboard, Key, BarChart2, Terminal, Lock, HelpCircle, CreditCard, TestTubes } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/playground", icon: TestTubes, label: "Playground" },
  { href: "/dashboard/api-keys", icon: Key, label: "API Keys" },
  { href: "/dashboard/usage", icon: BarChart2, label: "Usage" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/integration", icon: Terminal, label: "Integration" },
  { href: "/dashboard/security", icon: Lock, label: "Security" },
  { href: "/dashboard/support", icon: HelpCircle, label: "Support" },
];

export function DashboardSidebar({ plan = "PRO" }: { plan?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="font-heading font-bold text-xl tracking-tighter flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          NSFWGuard
        </Link>
      </div>
      
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="font-heading text-sm text-muted-foreground uppercase tracking-widest">Instance</span>
        <Badge className="rounded-none bg-primary text-primary-foreground font-heading">{plan}</Badge>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2 transition-colors border",
                isActive 
                  ? "text-primary bg-primary/10 border-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent hover:border-border"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className={cn(
                "font-heading text-sm tracking-wider uppercase",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-border">
        <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
