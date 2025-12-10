'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-nav';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            // Apply margin only on desktop
            'md:ml-16',
            sidebarOpen && 'md:ml-64'
          )}
        >
          {/* Add padding-bottom on mobile for the bottom nav */}
          <div className="container py-6 pb-24 md:pb-6">{children}</div>
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
