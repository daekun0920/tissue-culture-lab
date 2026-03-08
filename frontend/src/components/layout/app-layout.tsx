import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  LayoutDashboard,
  Zap,
  Package,
  FlaskRound,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNav = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/operations', label: 'Ops', icon: Zap },
  { to: '/containers', label: 'Containers', icon: Package },
  { to: '/experiments', label: 'Experiments', icon: FlaskRound },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function AppLayout() {
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
        </nav>
      </div>
    </div>
  );
}
