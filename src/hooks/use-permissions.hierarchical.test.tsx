import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './use-permissions';
import { useAuth } from '@/auth/context/auth-context';
import { useRBAC, ACCESS_LEVEL } from './useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

vi.mock('@/auth/context/auth-context');
vi.mock('./useRBAC');

describe('usePermissions Hook (Hierarchical & Array Logic)', () => {
  const mockUser = {
    permissions: {
      [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.NONE,
      [RBAC_MODULES.HOUSE_RESOURCES]: ACCESS_LEVEL.CONTEXT_READ_WRITE,
      [RBAC_MODULES.PARTICIPANTS]: ACCESS_LEVEL.CONTEXT_READ_ONLY,
    }
  };

  it('canView handles array of modules (OR logic)', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: false } as any);
    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn(({ resource, requiredLevel }) => {
        const userLevel = mockUser.permissions[resource] || ACCESS_LEVEL.NONE;
        const levels = [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL];
        return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
      })
    } as any);

    const { result } = renderHook(() => usePermissions());
    
    // Test OR logic: HOUSES is NONE, but HOUSE_RESOURCES is CONTEXT_READ_WRITE
    const houseModules = [RBAC_MODULES.HOUSES, RBAC_MODULES.HOUSE_RESOURCES];
    expect(result.current.canView(houseModules)).toBe(true);
    
    // Test single module
    expect(result.current.canView(RBAC_MODULES.HOUSES)).toBe(false);
    expect(result.current.canView(RBAC_MODULES.HOUSE_RESOURCES)).toBe(true);
  });

  it('canEdit handles array of modules (OR logic)', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: false } as any);
    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn(({ resource, requiredLevel }) => {
        const userLevel = mockUser.permissions[resource] || ACCESS_LEVEL.NONE;
        const levels = [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL];
        return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
      })
    } as any);

    const { result } = renderHook(() => usePermissions());
    
    const houseModules = [RBAC_MODULES.HOUSES, RBAC_MODULES.HOUSE_RESOURCES];
    expect(result.current.canEdit(houseModules)).toBe(true);
    
    // HOUSES is NONE, should be false
    expect(result.current.canEdit(RBAC_MODULES.HOUSES)).toBe(false);
  });
});
