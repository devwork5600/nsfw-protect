import MainFooter from '@/components/main-footer';
import MainNavbar from './components/navbar/main-navbar';
import { MobileMenu } from './components/sidebar/MobileMenu';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainNavbar />
      <MobileMenu />
      <main>{children}</main>
      <MainFooter />
    </>
  );
}
