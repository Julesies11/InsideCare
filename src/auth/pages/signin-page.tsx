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

const TEST_ADMIN = { email: 'julian.gibbings+admin@gmail.com', password: 'Password123!' };
const TEST_SUPPORT_WORKER = { email: 'julian.gibbings+supportworker@gmail.com', password: 'Password123!' };
const TEST_SUPERVISOR = { email: 'julian.gibbings+supervisor@gmail.com', password: 'Password123!' };
const TEST_HOUSE_MANAGER = { email: 'julian.gibbings+housemanager@gmail.com', password: 'Password123!' };
const TEST_DIRECTOR = { email: 'julian.gibbings+director@gmail.com', password: 'Password123!' };
const TEST_FINANCE = { email: 'julian.gibbings+finance@gmail.com', password: 'Password123!' };

const PROD_ADMIN = { email: 'demo@kt.com', password: 'demo123' };
const PROD_SUPPORT_WORKER = { email: 'staff@kt.com', password: 'demo123' };

export function SignInPage() {
  const isProd = import.meta.env.VITE_APP_ENV === 'production';
  const isDev = !isProd;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, getUser, logout } = useAuth();
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

  const loginAs = async (credentials: { email: string; password: string }) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // ENSURE CLEAN SLATE: Logout existing user and clear query cache
      await logout();
      
      await login(credentials.email, credentials.password);
      const user = await getUser();
      
      // NOTE: We ignore the 'next' parameter for Development buttons 
      // to ensure the user lands on a page they actually have access to.
      if (user?.is_admin) {
        navigate('/');
      } else {
        navigate('/my-dashboard');
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

      // Simple validation
      if (!values.email.trim() || !values.password) {
        setError('Email and password are required');
        return;
      }

      // Sign in using the auth context
      await login(values.email, values.password);

      // Role-based redirect — read fresh user to avoid stale state
      const user = await getUser();

      const nextPath = searchParams.get('next');
      if (nextPath) {
        navigate(nextPath);
      } else if (user?.is_admin) {
        navigate('/');
      } else {
        navigate('/my-dashboard');
      }
    } catch (err) {
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
        onSubmit={form.handleSubmit(onSubmit)}
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

        {isDev && (
          <Alert
            variant="warning"
            appearance="light"
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle className="text-center">
              Development Environment - For testing only
            </AlertTitle>
          </Alert>
        )}

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

        {isProd && (
          <div className="border-t pt-4 mt-2">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium uppercase tracking-wide">Live Production</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="bg-purple-800 text-white hover:bg-purple-900 border-none"
                size="sm"
                onClick={() => loginAs(PROD_ADMIN)}
                disabled={isProcessing}
              >
                Prod Admin
              </Button>
              <Button
                type="button"
                className="bg-blue-800 text-white hover:bg-blue-900 border-none"
                size="sm"
                onClick={() => loginAs(PROD_SUPPORT_WORKER)}
                disabled={isProcessing}
              >
                Prod Support
              </Button>
            </div>
          </div>
        )}

        {isDev && (
          <div className="border-t pt-4 mt-2">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium uppercase tracking-wide">Testing & Development</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="bg-purple-600 text-white hover:bg-purple-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_ADMIN)}
                disabled={isProcessing}
              >
                Admin
              </Button>
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_SUPPORT_WORKER)}
                disabled={isProcessing}
              >
                Support Worker
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_SUPERVISOR)}
                disabled={isProcessing}
              >
                Supervisor
              </Button>
              <Button
                type="button"
                className="bg-orange-600 text-white hover:bg-orange-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_HOUSE_MANAGER)}
                disabled={isProcessing}
              >
                House Manager
              </Button>
              <Button
                type="button"
                className="bg-cyan-600 text-white hover:bg-cyan-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_DIRECTOR)}
                disabled={isProcessing}
              >
                Director
              </Button>
              <Button
                type="button"
                className="bg-rose-600 text-white hover:bg-rose-700 border-none"
                size="sm"
                onClick={() => loginAs(TEST_FINANCE)}
                disabled={isProcessing}
              >
                Finance Manager
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
