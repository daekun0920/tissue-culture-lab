import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  Compass,
  ScanLine,
  FileText,
  BarChart3,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/pick-list', label: 'Pick List', icon: ClipboardList },
  { to: '/library', label: 'Library', icon: Compass },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/logs', label: 'Logs', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/qr-manager', label: 'QR Manager', icon: QrCode },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 border-r border-gray-200 bg-white flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          TC Lab
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
