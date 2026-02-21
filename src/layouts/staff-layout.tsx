import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Umbrella, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/context/auth-context';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/staff/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/staff/roster', icon: Calendar, label: 'Roster' },
  { to: '/staff/leave', icon: Umbrella, label: 'Leave' },
  { to: '/staff/timesheets', icon: ClipboardList, label: 'Timesheets' },
];

export function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/signin');
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <span className="font-semibold text-base">InsideCare</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user?.first_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
