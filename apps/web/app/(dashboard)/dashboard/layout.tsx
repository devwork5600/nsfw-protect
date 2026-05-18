import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from './components/dashboard-header';

import { getUser } from '@/lib/auth/auth-session';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth');

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar plan="PRO" />

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-stretch h-screen overflow-y-auto w-full">
          <DashboardHeader title="Dashboard" />
          <div className="p-8 pb-16 flex-1 w-full max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </>
  );
}
