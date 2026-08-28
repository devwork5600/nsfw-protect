import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/dashboard-header';
import { ForceField } from '@/components/canvasui/ForceField';

import { getUser } from '@/lib/auth/auth-session';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth');

  return (
    <>
      <div className="flex min-h-screen bg-background relative">
        <ForceField
          style={{ position: 'absolute', inset: 0 }}
          shape="hexagon"
          color={[0.15, 0.68, 1]}
          cellScale={26}
          gridReveal="always"
          gridOpacity={0.2}
          hoverGlow={0}
          hoverCharge={0}
          clickRipples={false}
          refraction={0}
          opacity={0.35}
        >
          <></>
        </ForceField>

        <DashboardSidebar plan="PRO" />

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-stretch h-screen overflow-y-auto w-full">
          <DashboardHeader title="Dashboard" />
          <div className="p-8 pb-16 flex-1 w-full max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </>
  );
}
