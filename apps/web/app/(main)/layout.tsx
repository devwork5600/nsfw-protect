import MainFooter from '@/components/main-footer';
import MainNavbar from './components/navbar/main-navbar';
import { MobileMenu } from './components/sidebar/MobileMenu';
import { BackgroundStage } from '@/components/canvasui/BackgroundStage';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundStage className="relative min-h-screen bg-background">
      <MainNavbar />
      <MobileMenu />
      <main className="relative z-10">{children}</main>
      <MainFooter />
    </BackgroundStage>
  );
}
