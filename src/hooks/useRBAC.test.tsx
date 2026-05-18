import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRBAC, ACCESS_LEVEL } from './useRBAC';
import { AuthContext } from '@/auth/context/auth-context';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ReactNode } from 'react';

const AuthWrapper = ({ value, children }: { value: any, children: ReactNode }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

describe('useRBAC Hook', () => {
  it('should grant access if user is admin', () => {
    const mockAuth = { isAdmin: true, user: { permissions: {} } };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => <AuthWrapper value={mockAuth}>{children}</AuthWrapper>,
    });

    expect(result.current.hasAccess({ resource: RBAC_MODULES.MY_ROSTER, requiredLevel: ACCESS_LEVEL.FULL })).toBe(true);
  });

  it('should grant access if user has full permission for resource', () => {
    const mockAuth = { 
      isAdmin: false, 
      user: { permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.FULL } } 
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>,
    });

    expect(result.current.hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.READ_ONLY })).toBe(true);
    expect(result.current.hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.FULL })).toBe(true);
  });

  it('should grant access based on hierarchy (context_read_write >= read_only)', () => {
    const mockAuth = { 
      isAdmin: false, 
      user: { permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.CONTEXT_READ_WRITE } } 
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>,
    });

    expect(result.current.hasAccess({ 
      resource: RBAC_MODULES.HOUSES, 
      requiredLevel: ACCESS_LEVEL.READ_ONLY 
    })).toBe(true);

    expect(result.current.hasAccess({ 
      resource: RBAC_MODULES.HOUSES, 
      requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
    })).toBe(true);

    expect(result.current.hasAccess({ 
      resource: RBAC_MODULES.HOUSES, 
      requiredLevel: ACCESS_LEVEL.FULL 
    })).toBe(false);
  });

  it('should deny access if resource is unknown', () => {
    const mockAuth = { 
      isAdmin: false, 
      user: { permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.FULL } } 
    };
    const { result } = renderHook(() => useRBAC(), {
      wrapper: ({ children }) => <AuthWrapper value={mockAuth as any}>{children}</AuthWrapper>,
    });

    expect(result.current.hasAccess({ resource: 'unknown_resource' as any, requiredLevel: ACCESS_LEVEL.READ_ONLY })).toBe(false);
  });
});
