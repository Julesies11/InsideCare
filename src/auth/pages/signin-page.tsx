import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';
import { LoaderCircleIcon } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';

const TEST_ADMIN = { email: 'admin@demo.com', password: 'demo' };
const TEST_STAFF = { email: 'staff@demo.com', password: 'demo' };

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, getUser } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from password reset or error messages
  useEffect(() => {
    const pwdReset = searchParams.get('pwd_reset');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (pwdReset === 'success') {
      setSuccessMessage(
        'Your password has been successfully reset. You can now sign in with your new password.',
      );
    }

    if (errorParam) {
      switch (errorParam) {
        case 'auth_callback_failed':
          setError(
            errorDescription || 'Authentication failed. Please try again.',
          );
          break;
        case 'auth_callback_error':
          setError(
            errorDescription ||
              'An error occurred during authentication. Please try again.',
          );
          break;
        case 'auth_token_error':
          setError(
            errorDescription ||
              'Failed to set authentication session. Please try again.',
          );
          break;
        default:
          setError(
            errorDescription || 'Authentication error. Please try again.',
          );
          break;
      }
    }
  }, [searchParams]);

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Log validation errors for debugging in CI
  useEffect(() => {
    console.log('[SignIn] Component Mounted');
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.error('[SignIn] Validation Errors:', JSON.stringify(errors, null, 2));
    }
  }, [form.formState.errors]);

  const loginAs = async (credentials: { email: string; password: string }) => {
    try {
      setIsProcessing(true);
      setError(null);
      await login(credentials.email, credentials.password);
      const user = await getUser();
      const nextPath = searchParams.get('next');
      if (nextPath) {
        navigate(nextPath);
      } else if (user?.is_admin) {
        navigate('/');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsProcessing(false);
    }
  };

  async function onSubmit(values: SigninSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);

      console.log(`[SignIn] Starting login for: ${values.email}`);

      // Simple validation
      if (!values.email.trim() || !values.password) {
        setError('Email and password are required');
        return;
      }

      // Sign in using the auth context
      console.log('[SignIn] Calling login()...');
      await login(values.email, values.password);
      console.log('[SignIn] login() successful');

      // Role-based redirect — read fresh user to avoid stale state
      console.log('[SignIn] Fetching fresh user data...');
      const user = await getUser();
      console.log('[SignIn] User data fetched:', user ? { id: user.id, is_admin: user.is_admin, staff_id: user.staff_id } : 'null');

      const nextPath = searchParams.get('next');
      if (nextPath) {
        console.log(`[SignIn] Redirecting to next path: ${nextPath}`);
        navigate(nextPath);
      } else if (user?.is_admin) {
        console.log('[SignIn] Redirecting to admin root /');
        navigate('/');
      } else {
        console.log('[SignIn] Redirecting to staff dashboard /staff/dashboard');
        navigate('/staff/dashboard');
      }
    } catch (err) {
      console.error('[SignIn] Unexpected error during submit:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }


  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('[SignIn] Raw form onSubmit triggered');
          form.handleSubmit(onSubmit, (errors) => {
            console.error('[SignIn] Submit failed - Validation errors:', JSON.stringify(errors, null, 2));
          })(e);
        }}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <img 
            src={toAbsoluteUrl('/media/app/default-logo.png')} 
            className="dark:hidden h-12 mx-auto mb-4" 
            alt="InsideCare" 
          />
          <img 
            src={toAbsoluteUrl('/media/app/default-logo-dark.png')} 
            className="light:hidden h-12 mx-auto mb-4" 
            alt="InsideCare" 
          />
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Log in with your credentials.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {successMessage && (
          <Alert appearance="light" onClose={() => setSuccessMessage(null)}>
            <AlertIcon>
              <Check />
            </AlertIcon>
            <AlertTitle>{successMessage}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>Password</FormLabel>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Your password"
                    type={passwordVisible ? 'text' : 'password'} // Toggle input type
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {passwordVisible ? (
                    <EyeOff className="text-muted-foreground" />
                  ) : (
                    <Eye className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Remember me
                  </FormLabel>
                </div>
                <Link
                  to="/auth/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  Forgot Password?
                </Link>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Loading...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>

        <div className="border-t pt-4 mt-2">
          <p className="text-xs text-center text-muted-foreground mb-2 font-medium uppercase tracking-wide">TEST LOGIN</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700 border-none"
              size="sm"
              onClick={() => loginAs(TEST_ADMIN)}
              disabled={isProcessing}
            >
              Admin (Test)
            </Button>
            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700 border-none"
              size="sm"
              onClick={() => loginAs(TEST_STAFF)}
              disabled={isProcessing}
            >
              Staff (Test)
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
