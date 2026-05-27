import { Navigate, Outlet, useLocation } from 'react-router';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';

/**
 * Protects routes based on granular permissions.
 */
export const RequirePermission = ({ module }: { module: string | string[] }) => {
  const { auth, user, loading } = useAuth();
  const { hasAccess } = useRBAC();

  if (loading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // If auth exists but user profile isn't loaded yet, wait.
  if (!user) return <ScreenLoader />;

  // Check if the user has any level of access to the module.
  // A user is allowed to enter a route section if their permission is not 'none'.
  // We use ACCESS_LEVEL.CONTEXT_READ_ONLY as the base check level (Level 1), allowing 
  // users with contextual or global access to enter.
  const checkAccess = () => {
    if (Array.isArray(module)) {
      return module.some(m => hasAccess({ resource: m, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }));
    }
    return hasAccess({ resource: module, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  };

  if (!checkAccess()) {
    return <Navigate to="/error/403" replace />;
  }

  return <Outlet />;
};

/**
 * Protects routes that require authentication.
 * Reads loading/auth state from AuthProvider — no local state, no verify() calls.
 * Shows a loader while the provider bootstraps, then redirects or renders.
 */
export const RequireAuth = () => {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
};

/**
 * Protects admin-only routes.
 * Waits for provider to finish loading, then checks role.
 * Staff-only users are redirected to their dashboard.
 */
export const RequireAdmin = () => {
  const { auth, user, isAdmin, loading } = useAuth();

  if (loading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // user not yet loaded but auth token exists — wait
  if (!user) return <ScreenLoader />;

  // User is authenticated but not an admin — redirect to 403
  if (!isAdmin) {
    return <Navigate to="/error/403" replace />;
  }

  return <Outlet />;
};

/**
 * Protects staff-only routes.
 * Admins are redirected to the home page.
 */
export const RequireStaff = () => {
  const { auth, user, isAdmin, loading } = useAuth();

  if (loading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // user is loaded and is admin — redirect away
  if (user && isAdmin) {
    return <Navigate to="/" replace />;
  }

  // user not yet loaded but auth token exists — wait
  if (!user) return <ScreenLoader />;

  return <Outlet />;
};
