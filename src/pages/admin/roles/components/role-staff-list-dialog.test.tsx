import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useStaffByRole } from '@/hooks/use-staff';
import { RoleStaffListDialog } from './role-staff-list-dialog';

// Mock the hook
vi.mock('@/hooks/use-staff', () => ({
  useStaffByRole: vi.fn(),
}));

describe('RoleStaffListDialog', () => {
  it('renders loading state', () => {
    vi.mocked(useStaffByRole).mockReturnValue({
      staff: [],
      loading: true,
    } as any);

    render(
      <BrowserRouter>
        <RoleStaffListDialog
          roleId="role-1"
          roleName="Admin"
          onClose={() => {}}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Loading assigned staff.../i)).toBeInTheDocument();
  });

  it('renders staff list when data is loaded', async () => {
    vi.mocked(useStaffByRole).mockReturnValue({
      staff: [
        {
          id: 'staff-1',
          staff_name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
          department_info: { department_name: 'IT' },
        },
        {
          id: 'staff-2',
          staff_name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'inactive',
          department_info: { department_name: 'HR' },
        },
      ],
      loading: false,
    } as any);

    render(
      <BrowserRouter>
        <RoleStaffListDialog
          roleId="role-1"
          roleName="Admin"
          onClose={() => {}}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders empty state when no staff assigned', () => {
    vi.mocked(useStaffByRole).mockReturnValue({
      staff: [],
      loading: false,
    } as any);

    render(
      <BrowserRouter>
        <RoleStaffListDialog
          roleId="role-1"
          roleName="Admin"
          onClose={() => {}}
        />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/No staff members are currently assigned to this role/i),
    ).toBeInTheDocument();
  });
});
