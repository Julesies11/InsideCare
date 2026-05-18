import { render, screen } from '@testing-library/react';
import { SidebarMenu } from './sidebar-menu';
import { useAuth } from '@/auth/context/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RBAC_MODULES } from '@/config/rbac-modules';

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: vi.fn(),
}));

// Mock icons to avoid rendering issues and missing export errors
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  // Create a mock for every icon requested by returning a simple div
  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
        return () => <div data-testid={`icon-${prop}`} />;
      }
      return Reflect.get(target, prop);
    },
  });
});

const renderSidebar = () => {
  return render(
    <MemoryRouter>
      <SidebarMenu />
    </MemoryRouter>
  );
};

describe('SidebarMenu', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows personal workspace items for staff with permissions', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      isStaff: true,
      user: { name: 'Staff User' },
    } as any);

    vi.mocked(usePermissions).mockReturnValue({
      canView: vi.fn((perm) => {
        return [RBAC_MODULES.MY_ROSTER, RBAC_MODULES.MY_TIMESHEETS, RBAC_MODULES.MY_LEAVE].includes(perm);
      }),
    } as any);

    renderSidebar();

    expect(screen.getByText('My Roster')).toBeInTheDocument();
    expect(screen.getByText('My Timesheets')).toBeInTheDocument();
    
    // Note: 'My Leave' is rendered as 'Leave Requests' in the config
    expect(screen.getByText('My Leave')).toBeInTheDocument();
    
    // Administrative items should be hidden
    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    expect(screen.queryByText('Roster Board')).not.toBeInTheDocument();
  });

  it('shows administrative items for users with manage permissions', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      isStaff: true,
      user: { name: 'Manager User' },
    } as any);

    vi.mocked(usePermissions).mockReturnValue({
      canView: vi.fn((perm) => {
        return [RBAC_MODULES.EMPLOYEES, RBAC_MODULES.ROSTER_BOARD].includes(perm);
      }),
    } as any);

    renderSidebar();

    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Roster Board')).toBeInTheDocument();
    
    // Personal items should be hidden (if not granted)
    expect(screen.queryByText('My Roster')).not.toBeInTheDocument();
  });

  it('shows all items for admins', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: true,
      isStaff: false,
      user: { name: 'Admin User' },
    } as any);

    vi.mocked(usePermissions).mockReturnValue({
      canView: vi.fn(() => true),
    } as any);

    renderSidebar();

    expect(screen.getByText('My Roster')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Houses')).toBeInTheDocument();
    expect(screen.getByText('Roster Board')).toBeInTheDocument();
    expect(screen.getByText('Access Control')).toBeInTheDocument();
  });
});
