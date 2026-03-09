import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  ClipboardList,
  Compass,
  ScanLine,
  FileText,
  BarChart3,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNav = [
  { to: '/pick-list', label: 'Pick List', icon: ClipboardList },
  { to: '/library', label: 'Library', icon: Compass },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/logs', label: 'Logs', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/qr-manager', label: 'QR', icon: QrCode },
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
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-xs',
                  isActive ? 'text-indigo-700' : 'text-gray-400',
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
