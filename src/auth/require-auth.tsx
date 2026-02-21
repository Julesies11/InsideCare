import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';

/**
 * Component to protect routes that require authentication.
 * If user is not authenticated, redirects to the login page.
 */
export const RequireAuth = () => {
  const { auth, verify, loading: globalLoading } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const verificationStarted = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth?.access_token || !verificationStarted.current) {
        verificationStarted.current = true;
        try {
          await verify();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [auth, verify]);

  // Show screen loader while checking authentication
  if (loading || globalLoading) {
    return <ScreenLoader />;
  }

  // If not authenticated, redirect to login
  if (!auth?.access_token) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // If authenticated, render child routes
  return <Outlet />;
};

/**
 * Guard for admin-only routes.
 * Waits for user to load, then redirects staff-only users away.
 */
export const RequireAdmin = () => {
  const { isAdmin, isStaff, auth, user, loading: globalLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const { verify } = useAuth();
  const verificationStarted = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (!verificationStarted.current) {
        verificationStarted.current = true;
        try { await verify(); } finally { setLoading(false); }
      } else {
        setLoading(false);
      }
    };
    check();
  }, [verify]);

  if (loading || globalLoading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Only redirect once we have confirmed the user is staff-only
  if (user && isStaff && !isAdmin) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Guard for staff-only routes.
 * Waits for user to load, then redirects admins away.
 */
export const RequireStaff = () => {
  const { isAdmin, auth, user, loading: globalLoading, verify } = useAuth();
  const [loading, setLoading] = useState(true);
  const verificationStarted = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (!verificationStarted.current) {
        verificationStarted.current = true;
        try { await verify(); } finally { setLoading(false); }
      } else {
        setLoading(false);
      }
    };
    check();
  }, [verify]);

  if (loading || globalLoading) return <ScreenLoader />;

  if (!auth?.access_token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Only redirect once we have confirmed the user is an admin
  if (user && isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
