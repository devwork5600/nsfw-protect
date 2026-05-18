import MainFooter from './components/layout/main-footer';
import MainNavbar from './components/layout/main-navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainNavbar />
      {children}
      <MainFooter />
    </>
  );
}
