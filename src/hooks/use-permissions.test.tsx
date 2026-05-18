import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './use-permissions';
import { useAuth } from '@/auth/context/auth-context';
import { useRBAC, ACCESS_LEVEL } from './useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

vi.mock('@/auth/context/auth-context');
vi.mock('./useRBAC');

describe('usePermissions Hook', () => {
  const mockUser = {
    permissions: {
      [RBAC_MODULES.MY_ROSTER]: ACCESS_LEVEL.FULL,
      [RBAC_MODULES.PARTICIPANTS]: ACCESS_LEVEL.CONTEXT_READ_ONLY,
    }
  };

  it('canView returns true if user has context access', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: false } as any);
    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn(({ requiredLevel }) => [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL].indexOf(ACCESS_LEVEL.FULL) >= [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL].indexOf(requiredLevel))
    } as any);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canView(RBAC_MODULES.MY_ROSTER)).toBe(true);
  });

  it('canEdit returns true if user has write access', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: false } as any);
    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn(({ requiredLevel }) => [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL].indexOf(ACCESS_LEVEL.FULL) >= [ACCESS_LEVEL.NONE, ACCESS_LEVEL.CONTEXT_READ_ONLY, ACCESS_LEVEL.READ_ONLY, ACCESS_LEVEL.CONTEXT_READ_WRITE, ACCESS_LEVEL.FULL].indexOf(requiredLevel))
    } as any);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEdit(RBAC_MODULES.MY_ROSTER)).toBe(true);
  });

  it('isContextAware returns true for context levels', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: false } as any);
    vi.mocked(useRBAC).mockReturnValue({ hasAccess: vi.fn() } as any);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isContextAware(RBAC_MODULES.PARTICIPANTS)).toBe(true);
    expect(result.current.isContextAware(RBAC_MODULES.MY_ROSTER)).toBe(false);
  });

  it('hasFullAccess returns true for Admin or full level', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isAdmin: true } as any);
    vi.mocked(useRBAC).mockReturnValue({ hasAccess: vi.fn() } as any);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasFullAccess(RBAC_MODULES.PARTICIPANTS)).toBe(true);
  });
});
