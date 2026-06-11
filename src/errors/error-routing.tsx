import { ErrorLayout } from '@/layouts/error/layout';
import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { Error403 } from './error-403';
import { Error404 } from './error-404';
import { Error500 } from './error-500';

export function ErrorRouting() {
  return (
    <Routes>
      <Route element={<ErrorLayout />}>
        <Route index element={<Error404 />} />
        <Route path="403" element={<Error403 />} />
        <Route path="404" element={<Error404 />} />
        <Route path="500" element={<Error500 />} />
        <Route path="*" element={<Navigate to={ROUTES.ERROR_404} />} />
      </Route>
    </Routes>
  );
}
