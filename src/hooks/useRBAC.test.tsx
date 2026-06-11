import { ReactNode } from 'react';
import { AuthContext } from '@/auth/context/auth-context';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL, useRBAC } from './useRBAC';

const AuthWrapper = ({
  value,
  children,
}: {
  value: any;
  children: ReactNode;
}) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

describe('useRBAC Hook', () => {
  it('should grant access if user is admin', () => {
    const mockAuth = { isAdmin: true, user: { permissions: {} } };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => (
        <AuthWrapper value={mockAuth}>{children}</AuthWrapper>
      ),
    });

    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.MY_ROSTER,
        requiredLevel: ACCESS_LEVEL.FULL,
      }),
    ).toBe(true);
  });

  it('should grant access if user has full permission for resource', () => {
    const mockAuth = {
      isAdmin: false,
      user: { permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.FULL } },
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => (
        <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>
      ),
    });

    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.READ_ONLY,
      }),
    ).toBe(true);
    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.FULL,
      }),
    ).toBe(true);
  });

  it('should grant access based on hierarchy (context_read_write >= read_only)', () => {
    const mockAuth = {
      isAdmin: false,
      user: {
        permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.CONTEXT_READ_WRITE },
      },
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => (
        <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>
      ),
    });

    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.READ_ONLY,
      }),
    ).toBe(true);

    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
      }),
    ).toBe(true);

    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.FULL,
      }),
    ).toBe(false);
  });

  it('should deny access if resource is unknown', () => {
    const mockAuth = {
      isAdmin: false,
      user: { permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.FULL } },
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => (
        <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>
      ),
    });

    expect(
      result.current.hasAccess({
        resource: 'unknown_resource' as any,
        requiredLevel: ACCESS_LEVEL.READ_ONLY,
      }),
    ).toBe(false);
  });

  it('should handle granular house permissions independently', () => {
    const mockAuth = {
      isAdmin: false,
      user: {
        permissions: {
          [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.READ_ONLY,
          [RBAC_MODULES.HOUSE_MANAGEMENT]: ACCESS_LEVEL.CONTEXT_READ_WRITE,
          [RBAC_MODULES.HOUSE_OPERATIONS]: ACCESS_LEVEL.NONE,
        },
      },
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => (
        <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>
      ),
    });

    // Basics: Read Only
    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.READ_ONLY,
      }),
    ).toBe(true);
    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSES,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
      }),
    ).toBe(false);

    // Management: Write Access
    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSE_MANAGEMENT,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
      }),
    ).toBe(true);

    // Operations: No Access
    expect(
      result.current.hasAccess({
        resource: RBAC_MODULES.HOUSE_OPERATIONS,
        requiredLevel: ACCESS_LEVEL.READ_ONLY,
      }),
    ).toBe(false);
  });
});
