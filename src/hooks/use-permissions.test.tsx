import { describe, it, expect, vi } from 'vitest';
import { usePermissions, PermissionModule } from './use-permissions';
import { useAuth } from '@/auth/context/auth-context';

// Mock useAuth
vi.mock('@/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('usePermissions', () => {
  it('should grant full access to admins', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: true,
      user: { permissions: {} },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(true);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(true);
    expect(result.current.isContextLocked('participant_profiles')).toBe(false);
  });

  it('should restrict access for non-admins based on metadata', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'read_only',
          house_profiles: 'context_locked',
          master_lists: 'none',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    // Read-only
    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(false);

    // Context-locked
    expect(result.current.canView('house_profiles')).toBe(true);
    expect(result.current.canEdit('house_profiles')).toBe(true);
    expect(result.current.isContextLocked('house_profiles')).toBe(true);

    // None
    expect(result.current.canView('master_lists')).toBe(false);
  });

  it('should default to no access if permissions are missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: { permissions: {} },
    } as any);

    const { result } = renderHook(() => usePermissions());

    // Default to no access
    expect(result.current.canView('staff_profiles')).toBe(false);
  });
});

// Helper for rendering hooks in tests
import { renderHook } from '@testing-library/react';
