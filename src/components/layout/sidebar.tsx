'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plane,
  UserCircle,
  ClipboardList,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useUserStore } from '@/stores/user-store';
import { cn } from '@/lib/utils';

const mainNavItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: "Today's protocol",
  },
  {
    href: '/trips',
    label: 'Trips',
    icon: Plane,
    description: 'Manage your trips',
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: UserCircle,
    description: 'Chronotype & settings',
  },
  {
    href: '/questionnaire',
    label: 'Assessment',
    icon: ClipboardList,
    description: 'Chronotype questionnaire',
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: BarChart3,
    description: 'Circadian visualizations',
  },
];

const bottomNavItems = [
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
  {
    href: '/help',
    label: 'Help',
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useUserStore();

  const hasChronotypeAssessment = user?.circadianProfile !== null;

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Toggle Button */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Highlight questionnaire if not completed
            const needsAttention =
              item.href === '/questionnaire' && !hasChronotypeAssessment;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  needsAttention &&
                    !isActive &&
                    'ring-2 ring-amber-500 ring-offset-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    sidebarOpen && 'mr-3',
                    needsAttention && !isActive && 'text-amber-500'
                  )}
                />
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'text-xs',
                        isActive
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Assessment Status */}
        {sidebarOpen && !hasChronotypeAssessment && (
          <div className="mx-2 mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <p className="text-xs font-medium text-amber-600">
              Complete your chronotype assessment to get personalized protocols
            </p>
            <Link href="/questionnaire">
              <Button size="sm" className="mt-2 w-full" variant="outline">
                Start Assessment
              </Button>
            </Link>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="border-t px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', sidebarOpen && 'mr-3')} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
