import { Navigate, Route, Routes } from 'react-router';
import { authRoutes } from './auth-routes';
import { ROUTES } from '@/config/routes.config';

/**
 * Handles all authentication related routes.
 * This component is mounted at /auth/* in the main application router.
 */
export function AuthRouting() {
  return (
    <Routes>
      {/* Index route to redirect to sign-in */}
      <Route index element={<Navigate to={ROUTES.AUTH_SIGNIN.replace('/auth/', '')} replace />} />

      {authRoutes.map((route) => {
        // Extract auth/ from the path to avoid double prefixing
        const basePath = route.path?.replace('auth/', '') || '';

        return (
          <Route key={route.path} path={basePath} element={route.element}>
            {route.children?.map((childRoute) => (
              <Route
                key={childRoute.path}
                path={childRoute.path}
                element={childRoute.element}
              />
            ))}
          </Route>
        );
      })}
    </Routes>
  );
}
