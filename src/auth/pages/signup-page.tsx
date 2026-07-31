import { Navigate } from 'react-router';

export function SignUpPage() {
  return <Navigate to="/auth/signin" replace />;
}
