import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../auth/context/auth-context';
import { usePermissions } from '../hooks/use-permissions';
import { ACCESS_LEVEL, useRBAC } from '../hooks/useRBAC';

// Mock the hooks
vi.mock('../auth/context/auth-context');
vi.mock('../hooks/useRBAC');

describe('Security Hardened RBAC - usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should grant full access to Admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', permissions: {} },
      isAdmin: true,
    } as any);

    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn().mockReturnValue(true),
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasFullAccess('participants')).toBe(true);
    expect(result.current.canEdit('participants')).toBe(true);
  });

  it('should deny edit access to read_only users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '2', permissions: { participants: ACCESS_LEVEL.READ_ONLY } },
      isAdmin: false,
    } as any);

    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn().mockImplementation(({ requiredLevel }) => {
        // Simple mock logic: read_only has access to context_read_only and read_only
        return (
          requiredLevel === ACCESS_LEVEL.READ_ONLY ||
          requiredLevel === ACCESS_LEVEL.CONTEXT_READ_ONLY
        );
      }),
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participants')).toBe(true);
    expect(result.current.canEdit('participants')).toBe(false);
    expect(result.current.hasFullAccess('participants')).toBe(false);
  });

  it('should grant view access to context_read_only users correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '3',
        permissions: { participants: ACCESS_LEVEL.CONTEXT_READ_ONLY },
        assigned_houses: ['house-123'],
      },
      isAdmin: false,
    } as any);

    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn().mockReturnValue(true),
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participants')).toBe(true);
    expect(result.current.isContextAware('participants')).toBe(true);
  });

  it('should identify permissions from the permissions object correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '5',
        permissions: { participants: ACCESS_LEVEL.CONTEXT_READ_ONLY },
      },
      isAdmin: false,
    } as any);

    vi.mocked(useRBAC).mockReturnValue({
      hasAccess: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasFullAccess('participants')).toBe(false);
    expect(result.current.permissions.participants).toBe(
      ACCESS_LEVEL.CONTEXT_READ_ONLY,
    );
  });
});
