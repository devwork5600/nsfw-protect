import MainFooter from '@/components/main-footer';
import MainNavbar from './components/navbar/main-navbar';
import { MobileMenu } from './components/sidebar/MobileMenu';
import { ForceField } from '@/components/canvasui/ForceField';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
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

      <MainNavbar />
      <MobileMenu />
      <main className="relative z-10">{children}</main>
      <MainFooter />
    </div>
  );
}
