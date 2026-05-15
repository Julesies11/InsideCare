import { renderHook } from '@testing-library/react';
import { usePermissions } from './use-permissions';
import { useAuth } from '@/auth/context/auth-context';
import { describe, it, expect, vi } from 'vitest';

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
    expect(result.current.isContextAware('participant_profiles')).toBe(false);
  });

  it('should handle "full" level for non-admins', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'full',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(true);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(true);
    expect(result.current.isContextAware('participant_profiles')).toBe(false);
  });

  it('should handle "context_read_write" level', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'context_read_write',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(true);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(false);
    expect(result.current.isContextAware('participant_profiles')).toBe(true);
  });

  it('should handle "context_read_only" level', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'context_read_only',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(false);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(false);
    expect(result.current.isContextAware('participant_profiles')).toBe(true);
  });

  it('should handle "read_only" level', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'read_only',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(true);
    expect(result.current.canEdit('participant_profiles')).toBe(false);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(false);
    expect(result.current.isContextAware('participant_profiles')).toBe(false);
  });

  it('should handle "none" level', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {
          participant_profiles: 'none',
        },
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(false);
    expect(result.current.canEdit('participant_profiles')).toBe(false);
    expect(result.current.hasFullAccess('participant_profiles')).toBe(false);
    expect(result.current.isContextAware('participant_profiles')).toBe(false);
  });

  it('should default to "none" if permission is missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: {
        permissions: {},
      },
    } as any);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canView('participant_profiles')).toBe(false);
  });
});
