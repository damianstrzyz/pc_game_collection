import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';
import { MobileNavigation } from './MobileNavigation';
import { PwaBanners } from './PwaBanners';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Przejdź do treści
      </a>
      <PwaBanners />
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col">
          <main id="tresc" className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
            <Outlet />
          </main>
          <div className="hidden lg:block">
            <AppFooter />
          </div>
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
}
