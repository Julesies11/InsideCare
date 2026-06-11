import { renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RolePermissionsMatrix } from './role-permissions-matrix';

// Mock dependencies
vi.mock('@/hooks/use-roles', () => ({
  useRoles: () => ({
    roles: [{ id: 'role-1', name: 'Supervisor', is_active: true }],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-role-permissions', () => ({
  useAllRolePermissions: () => ({
    data: [
      { role_id: 'role-1', participants: ACCESS_LEVEL.CONTEXT_READ_WRITE },
    ],
    isLoading: false,
  }),
  useUpdateRolePermissions: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe('RolePermissionsMatrix Smoke Test', () => {
  it('should render the permissions matrix with all 5 access levels', async () => {
    renderWithProviders(<RolePermissionsMatrix />);

    // Check headers for all 5 levels
    expect(screen.getByText('Full Access')).toBeInTheDocument();
    expect(screen.getByText('Context Read/Write')).toBeInTheDocument();
    expect(screen.getByText('Context Read-Only')).toBeInTheDocument();
    expect(screen.getByText('Read-Only')).toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();

    // Check if a module is rendered
    expect(screen.getByText('Participant Profiles')).toBeInTheDocument();
  });
});
