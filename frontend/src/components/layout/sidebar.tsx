import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Zap,
  FlaskConical,
  Beaker,
  Leaf,
  Users,
  QrCode,
  BarChart3,
  FlaskRound,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations', icon: Zap },
  { to: '/containers', label: 'Containers', icon: Package },
  { to: '/experiments', label: 'Experiments', icon: FlaskRound },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const dataNav = [
  { to: '/container-types', label: 'Container Types', icon: Box },
  { to: '/media-recipes', label: 'Media Recipes', icon: FlaskConical },
  { to: '/media-batches', label: 'Media Batches', icon: Beaker },
  { to: '/culture-types', label: 'Culture Types', icon: Leaf },
  { to: '/employees', label: 'Employees', icon: Users },
];

const toolsNav = [
  { to: '/qr-generator', label: 'QR Generator', icon: QrCode },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-gray-100 text-gray-900'
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
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="my-3 border-t border-gray-200" />

        {dataNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="my-3 border-t border-gray-200" />

        {toolsNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
