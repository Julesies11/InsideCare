import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RBAC_MODULES } from '@/config/rbac-modules';
import * as useRolePermissionsModule from '@/hooks/use-role-permissions';
import * as useRolesModule from '@/hooks/use-roles';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RolePermissionsMatrix } from './role-permissions-matrix';

// Mock hooks
vi.mock('@/hooks/use-roles');
vi.mock('@/hooks/use-role-permissions');

// Mock useRBAC
vi.mock('@/hooks/useRBAC', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRBAC: () => ({
      hasAccess: () => true,
      isAdmin: false,
    }),
  };
});

describe('RolePermissionsMatrix - Reporting Sub-Section', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRolesModule.useRoles).mockReturnValue({
      roles: [{ id: 'role-1', role_name: 'Supervisor', is_active: true }],
      isLoading: false,
    } as any);

    vi.mocked(
      useRolePermissionsModule.useUpdateRolePermissions,
    ).mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as any);
  });

  it('renders Reporting row with uppercase section header styling', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [
        {
          role_id: 'role-1',
          [RBAC_MODULES.REPORTING_CLINICAL]: ACCESS_LEVEL.NONE,
          [RBAC_MODULES.REPORTING_OPERATIONAL]: ACCESS_LEVEL.NONE,
          [RBAC_MODULES.REPORTING_COMPLIANCE]: ACCESS_LEVEL.NONE,
        },
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(() => {
      const reportingHeader = screen.getByText(/Reporting/i);
      expect(reportingHeader).toBeInTheDocument();
      // Verify the parent TableCell (td) has section header class (uppercase)
      const tableCell = reportingHeader.closest('td');
      expect(tableCell).toBeInTheDocument();
      expect(tableCell?.className).toContain('uppercase');
    });
  });

  it('checks the checkbox in the Reporting row when all child modules match the level', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [
        {
          role_id: 'role-1',
          [RBAC_MODULES.REPORTING_CLINICAL]: ACCESS_LEVEL.FULL,
          [RBAC_MODULES.REPORTING_OPERATIONAL]: ACCESS_LEVEL.FULL,
          [RBAC_MODULES.REPORTING_COMPLIANCE]: ACCESS_LEVEL.FULL,
        },
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(() => {
      // Find checkboxes in the Reporting row
      const reportingRow = screen.getByText(/Reporting/i).closest('tr');
      expect(reportingRow).toBeInTheDocument();

      // The "Full Access" checkbox should be checked
      const checkboxes = reportingRow!.querySelectorAll('button[role="checkbox"]');
      // Full Access is the first column in ACCESS_LEVELS map:
      // ACCESS_LEVELS order: Full, Context R/W, Context R/O, R/O, None
      expect(checkboxes[0]).toHaveAttribute('data-state', 'checked');
      expect(checkboxes[1]).toHaveAttribute('data-state', 'unchecked');
    });
  });

  it('does not check the checkbox if child modules have mismatching levels', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [
        {
          role_id: 'role-1',
          [RBAC_MODULES.REPORTING_CLINICAL]: ACCESS_LEVEL.FULL,
          [RBAC_MODULES.REPORTING_OPERATIONAL]: ACCESS_LEVEL.READ_ONLY,
          [RBAC_MODULES.REPORTING_COMPLIANCE]: ACCESS_LEVEL.FULL,
        },
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(() => {
      const reportingRow = screen.getByText(/Reporting/i).closest('tr');
      const checkboxes = reportingRow!.querySelectorAll('button[role="checkbox"]');
      // Neither Full Access (idx 0) nor Read Only (idx 3) should be checked as reporting rows must have uniform values
      expect(checkboxes[0]).toHaveAttribute('data-state', 'unchecked');
      expect(checkboxes[3]).toHaveAttribute('data-state', 'unchecked');
    });
  });

  it('triggers batch update of all 3 reporting modules when checking a level', async () => {
    vi.mocked(useRolePermissionsModule.useAllRolePermissions).mockReturnValue({
      data: [
        {
          role_id: 'role-1',
          [RBAC_MODULES.REPORTING_CLINICAL]: ACCESS_LEVEL.NONE,
          [RBAC_MODULES.REPORTING_OPERATIONAL]: ACCESS_LEVEL.NONE,
          [RBAC_MODULES.REPORTING_COMPLIANCE]: ACCESS_LEVEL.NONE,
        },
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<RolePermissionsMatrix />);

    await waitFor(async () => {
      const reportingRow = screen.getByText(/Reporting/i).closest('tr');
      const checkboxes = reportingRow!.querySelectorAll('button[role="checkbox"]');

      // Click "Full Access" checkbox
      fireEvent.click(checkboxes[0]);

      // Expect batch update to be called with all 3 reporting modules set to FULL
      expect(mockMutateAsync).toHaveBeenCalledWith({
        role_id: 'role-1',
        updates: {
          [RBAC_MODULES.REPORTING_CLINICAL]: ACCESS_LEVEL.FULL,
          [RBAC_MODULES.REPORTING_OPERATIONAL]: ACCESS_LEVEL.FULL,
          [RBAC_MODULES.REPORTING_COMPLIANCE]: ACCESS_LEVEL.FULL,
        },
      });
    });
  });
});
