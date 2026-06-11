import { ReactNode } from 'react';
import { AuthContext } from '@/auth/context/auth-context';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import { AccessControl } from './AccessControl';

const AuthWrapper = ({
  value,
  children,
}: {
  value: { isAdmin?: boolean; user: { permissions: Record<string, string> } };
  children: ReactNode;
}) => (
  <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>
);

describe('AccessControl Component', () => {
  const mockUser = {
    permissions: { [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.CONTEXT_READ_WRITE },
  };

  it('should render children when access is granted (Admin)', () => {
    render(
      <AuthWrapper value={{ isAdmin: true, user: { permissions: {} } }}>
        <AccessControl
          resource={RBAC_MODULES.MY_ROSTER}
          requiredLevel={ACCESS_LEVEL.FULL}
        >
          <div data-testid="child">Secret Content</div>
        </AccessControl>
      </AuthWrapper>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render fallback when access is denied', () => {
    render(
      <AuthWrapper value={{ isAdmin: false, user: { permissions: {} } }}>
        <AccessControl
          resource={RBAC_MODULES.MY_ROSTER}
          requiredLevel={ACCESS_LEVEL.FULL}
          fallback={<div data-testid="fallback">Denied</div>}
        >
          <div>Secret Content</div>
        </AccessControl>
      </AuthWrapper>,
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('should support the render prop pattern', () => {
    render(
      <AuthWrapper value={{ isAdmin: false, user: mockUser }}>
        <AccessControl
          resource={RBAC_MODULES.HOUSES}
          requiredLevel={ACCESS_LEVEL.FULL}
        >
          {(isAllowed) => (
            <button data-testid="btn" disabled={!isAllowed}>
              Action
            </button>
          )}
        </AccessControl>
      </AuthWrapper>,
    );

    const btn = screen.getByTestId('btn');
    expect(btn).toBeDisabled();
  });

  it('should grant access via render prop based on hierarchy', () => {
    render(
      <AuthWrapper value={{ isAdmin: false, user: mockUser }}>
        <AccessControl
          resource={RBAC_MODULES.HOUSES}
          requiredLevel={ACCESS_LEVEL.READ_ONLY}
        >
          {(isAllowed) => (
            <button data-testid="btn" disabled={!isAllowed}>
              Action
            </button>
          )}
        </AccessControl>
      </AuthWrapper>,
    );

    const btn = screen.getByTestId('btn');
    expect(btn).not.toBeDisabled();
  });
});
