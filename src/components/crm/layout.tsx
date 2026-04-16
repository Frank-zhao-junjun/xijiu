'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileHeader } from './mobile-header';
import { MobileNavProvider, useMobileNav } from './mobile-nav-context';
import { CRMProvider } from '@/lib/crm-context';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { toggle } = useMobileNav();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - Only visible on mobile */}
        <MobileHeader onMenuToggle={toggle} />
        
        {/* Desktop Header - Only visible on desktop */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <MobileNavProvider>
        <LayoutContent>{children}</LayoutContent>
      </MobileNavProvider>
    </CRMProvider>
  );
}

export function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
