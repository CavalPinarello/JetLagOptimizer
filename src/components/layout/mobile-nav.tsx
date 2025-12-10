'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plane,
  UserCircle,
  BarChart3,
  Menu,
  X,
  ClipboardList,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: LayoutDashboard,
  },
  {
    href: '/trips',
    label: 'Trips',
    icon: Plane,
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: BarChart3,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: UserCircle,
  },
];

const moreMenuItems = [
  {
    href: '/questionnaire',
    label: 'Assessment',
    icon: ClipboardList,
    description: 'Take chronotype quiz',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'App preferences',
  },
  {
    href: '/help',
    label: 'Help & FAQ',
    icon: HelpCircle,
    description: 'Get help',
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useUserStore();

  const hasChronotypeAssessment = user?.circadianProfile !== null;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full py-2 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>

        {/* Indicator for unfinished assessment */}
        {!hasChronotypeAssessment && (
          <div className="absolute top-1 right-[10%] h-2 w-2 rounded-full bg-amber-500" />
        )}
      </nav>

      {/* More Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b">
              <h3 className="font-semibold">More Options</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const needsAttention =
                  item.href === '/questionnaire' && !hasChronotypeAssessment;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                      needsAttention && !isActive && 'ring-2 ring-amber-500'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        needsAttention && !isActive && 'text-amber-500'
                      )}
                    />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p
                        className={cn(
                          'text-xs',
                          isActive
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {/* User Info & Logout */}
              {user && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>

            {/* Safe Area Spacer */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Get page title based on route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/trips') return 'Trips';
    if (pathname.startsWith('/trips/new')) return 'New Trip';
    if (pathname.startsWith('/trips/')) return 'Trip Details';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/questionnaire') return 'Assessment';
    if (pathname === '/insights') return 'Insights';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/help') return 'Help';
    return 'JetLagOptimizer';
  };

  return (
    <div className="flex items-center justify-between md:hidden">
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
