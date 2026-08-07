import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/auth/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  LoaderCircleIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { supabase } from '@/lib/supabase';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  getNewPasswordSchema,
  NewPasswordSchemaType,
} from '../forms/reset-password-schema';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { getUser } = useAuth();

  // Start initializing if we see tokens in the URL hash, wait for Supabase to consume them
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Define verification logic
  const verifySession = useCallback(async () => {
    try {
      // 1. Check for existing session
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession?.user) {
        setSessionUser(existingSession.user);
        setIsInitializing(false);
        return;
      }

      // 2. MANUAL RECOVERY: If no session but hash exists, try to manually consume it
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (hash && hash.includes('access_token')) {
        console.log(
          'Detected unconsumed tokens in hash. Attempting manual recovery...',
        );

        // Convert hash to params
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const {
            data: { session: recoveredSession },
            error: recoveryError,
          } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!recoveryError && recoveredSession?.user) {
            console.log('Successfully recovered session from hash!');
            setSessionUser(recoveredSession.user);
            setIsInitializing(false);
            // Clean up the URL hash
            window.history.replaceState(null, '', window.location.pathname);
            return;
          } else if (recoveryError) {
            console.error('Manual recovery error:', recoveryError.message);
          }
        }
      }

      // 3. If we reach here and have no tokens, it truly is an invalid link
      if (!hash.includes('access_token')) {
        setSessionUser(null);
        setIsInitializing(false);
      }
    } catch (err) {
      console.error('Session verification error:', err);
      setIsInitializing(false);
    }
  }, []);

  // Run verification on mount and on auth events
  useEffect(() => {
    // Wrap initial call in async execution to satisfy react-hooks/set-state-in-effect
    const init = async () => {
      await verifySession();
    };
    init();

    let attempts = 0;
    const maxAttempts = 5; // 5 seconds of polling

    const checkInterval = setInterval(() => {
      attempts++;
      console.log(`Verification attempt ${attempts}...`);
      verifySession();

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        // If we still haven't found a session after 5 seconds, stop spinning
        setIsInitializing(false);
      }
    }, 1000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event detected in ChangePasswordPage:', event);

        // Handle any event that provides a user session
        if (session?.user) {
          setSessionUser(session.user);
          setIsInitializing(false);
          clearInterval(checkInterval);
        }

        // Specifically handle the recovery event
        if (event === 'PASSWORD_RECOVERY') {
          setSuccessMessage('You can now set your new password');
        }
      },
    );

    return () => {
      clearInterval(checkInterval);
      authListener.subscription.unsubscribe();
    };
  }, [verifySession]);

  const form = useForm<NewPasswordSchemaType>({
    resolver: zodResolver(getNewPasswordSchema()),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: NewPasswordSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);

      // Final session check before update
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          'Auth session missing! Please click the link in your email again.',
        );
      }

      // 1. Update the password
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage(
        'Password set successfully! Redirecting you to the dashboard...',
      );
      form.reset();

      // 2. Refresh the user context to ensure permissions are loaded
      const user = await getUser();

      // 3. Smoothly redirect to dashboard after a short delay
      setTimeout(() => {
        if (user?.is_admin) {
          navigate(ROUTES.HOME);
        } else {
          navigate(ROUTES.MY_DASHBOARD);
        }
      }, 1500);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  // --- RENDERING LOGIC ---

  // 1. Initial verification loader
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Verifying link...</p>
      </div>
    );
  }



  // 3. Fallback: No session found (Invalid Link)
  if (!sessionUser) {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            You need a valid reset link to change your password
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <h3 className="font-medium mb-2">How to reset your password:</h3>
          <ol className="list-decimal ms-4 text-sm space-y-1 text-muted-foreground">
            <li>Request a password reset link via email</li>
            <li>Check your email inbox and spam folder</li>
            <li>Click the reset link in the email you receive</li>
            <li>Create a new password on the page that opens</li>
          </ol>
        </div>

        <Button asChild className="w-full">
          <Link to={ROUTES.AUTH_RESET_PASSWORD}>Request a Reset Link</Link>
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Remember your password?</span>{' '}
          <Link
            to={ROUTES.AUTH_SIGNIN}
            className="text-primary hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // 4. Success State: Form to set password
  return (
    <div className="max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Set New Password
            </h1>
            <p className="text-muted-foreground text-sm">
              Logged in as{' '}
              <span className="font-medium text-foreground">
                {sessionUser.email}
              </span>
              . Please create a strong password for your account.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertIcon>
                <AlertCircle className="h-4 w-4" />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <AlertIcon>
                <Check className="h-4 w-4 text-green-500" />
              </AlertIcon>
              <AlertTitle>{successMessage}</AlertTitle>
            </Alert>
          )}

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="new_password">New Password</FormLabel>
                  <div className="relative">
                    <Input
                      id="new_password"
                      placeholder="Create a strong password"
                      type={passwordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirm_password">
                    Confirm Password
                  </FormLabel>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      placeholder="Verify your password"
                      type={confirmPasswordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {confirmPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Updating
                Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </Button>

          <div className="text-center text-sm">
            <Link
              to={ROUTES.AUTH_SIGNIN}
              className="text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
