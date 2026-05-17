import { DashboardSidebar } from "@/components/DashboardSidebar";

import { getUser } from "@/lib/auth/auth-session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth");


  return <>
   <div className="flex min-h-screen bg-background">
      <DashboardSidebar plan="PRO" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-stretch h-screen overflow-y-auto w-full">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-8 shrink-0 sticky top-0 z-10 w-full">
          <h1 className="font-heading font-bold text-xl tracking-tighter uppercase text-foreground">Dashboard</h1>
        </header>
        <div className="p-8 pb-16 flex-1 w-full max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  </>;
}
