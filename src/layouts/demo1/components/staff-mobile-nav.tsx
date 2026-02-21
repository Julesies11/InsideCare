import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Umbrella, ClipboardList, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/staff/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/staff/roster', icon: Calendar, label: 'Roster' },
  { to: '/staff/leave', icon: Umbrella, label: 'Leave' },
  { to: '/staff/timesheets', icon: ClipboardList, label: 'Timesheets' },
  { to: '/staff/profile', icon: UserCircle, label: 'Profile' },
];

export function StaffMobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
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
  );
}
