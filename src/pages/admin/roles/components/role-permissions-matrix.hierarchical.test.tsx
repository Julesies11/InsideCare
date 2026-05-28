import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { RolePermissionsMatrix } from './role-permissions-matrix';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import * as useRolePermissionsModule from '@/hooks/use-role-permissions';
import * as useRolesModule from '@/hooks/use-roles';

// Mock dependencies
vi.mock('@/hooks/use-roles');
vi.mock('@/hooks/use-role-permissions');

// Mock useRBAC
vi.mock('@/hooks/useRBAC', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRBAC: () => ({
      hasAccess: () => true,
      isAdmin: false
    })
  };
});

describe('RolePermissionsMatrix Hierarchical & Locking Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default roles mock
    vi.mocked(useRolesModule.useRoles).mockReturnValue({
      roles: [{ id: 'role-1', role_name: 'Staff', is_active: true }],
      isLoading: false,
    } as any);

    // Default update mock
    vi.mocked(useRolePermissionsModule.useUpdateRolePermissions).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);
  });

  it('ghost-locks child modules when House Profiles is set to NONE', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [{ 
        role_id: 'role-1', 
        [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.NONE,
        [RBAC_MODULES.HOUSE_MANAGEMENT]: ACCESS_LEVEL.CONTEXT_READ_ONLY 
      }],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(() => {
      // Find the House Profiles row (Parent)
      expect(screen.getByText('House Profiles')).toBeInTheDocument();
      
      // Verify LOCKED badges are present for children (should be 7)
      const lockedBadges = screen.getAllByText('LOCKED');
      expect(lockedBadges.length).toBeGreaterThan(0);
      
      // Verify the description for the locked child
      const descriptions = screen.getAllByText(/Requires 'Houses' access to be active/i);
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('enables child modules when House Profiles has access', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [{ 
        role_id: 'role-1', 
        [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.READ_ONLY,
        [RBAC_MODULES.HOUSE_MANAGEMENT]: ACCESS_LEVEL.CONTEXT_READ_ONLY,
        [RBAC_MODULES.PARTICIPANTS]: ACCESS_LEVEL.READ_ONLY 
      }],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(() => {
      // Verify the LOCKED badge is NOT present
      expect(screen.queryAllByText('LOCKED')).toHaveLength(0);
      
      // Verify the standard context description is present
      expect(screen.queryByText(/Requires 'Houses' access to be active/i)).not.toBeInTheDocument();
    });
  });
});
