import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  LayoutDashboard,
  Zap,
  Package,
  FlaskRound,
  BarChart3,
  MoreHorizontal,
  Box,
  FlaskConical,
  Beaker,
  Leaf,
  Users,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNav = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/operations', label: 'Ops', icon: Zap },
  { to: '/containers', label: 'Containers', icon: Package },
  { to: '/experiments', label: 'Experiments', icon: FlaskRound },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const moreNav = [
  { to: '/container-types', label: 'Container Types', icon: Box },
  { to: '/culture-types', label: 'Culture Types', icon: Leaf },
  { to: '/media-recipes', label: 'Media Recipes', icon: FlaskConical },
  { to: '/media-batches', label: 'Media Batches', icon: Beaker },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/qr-generator', label: 'QR Generator', icon: QrCode },
];

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-50">
          {mobileNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-xs',
                  isActive ? 'text-gray-900' : 'text-gray-400',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((prev) => !prev)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs',
                moreOpen ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
                  {moreNav.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-2 text-sm',
                          isActive
                            ? 'text-gray-900 bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-50',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
