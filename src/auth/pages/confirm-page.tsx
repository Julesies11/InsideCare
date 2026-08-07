import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/config/routes.config';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Handles white-labeled verification links (e.g. invites, password resets)
 * by exchanging token_hash directly with Supabase auth via verifyOtp.
 * Requires user confirmation before execution to prevent automated email
 * security scanners (e.g., SafeLinks, Mimecast) from consuming 1-time tokens.
 */
export function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'invite' | 'recovery' | 'signup' | 'email_change' | null;
  const rawNext = searchParams.get('next');

  // Security Hardening: Ensure target redirect path is relative to prevent open-redirect attacks
  const defaultNext = (type === 'invite' || type === 'recovery') ? ROUTES.AUTH_CHANGE_PASSWORD : ROUTES.HOME;
  const safeNext = (rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : defaultNext;

  if (!tokenHash || !type) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-full max-w-md space-y-6">
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              Invalid verification link. Missing token parameters.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center pt-2">
            <Button
              variant="default"
              onClick={() => navigate(ROUTES.AUTH_SIGNIN)}
              className="w-full"
            >
              Return to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type,
      });

      if (error) {
        throw error;
      }

      if (isMountedRef.current) {
        setStatus('success');
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(safeNext, { replace: true });
          }
        }, 800);
      }
    } catch (err: unknown) {
      console.error('Failed to verify authentication token:', err);
      if (isMountedRef.current) {
        setStatus('error');
        const message = err instanceof Error ? err.message : '';
        setErrorMessage(
          message || 'Verification token has expired or is invalid. If your account is already active, you can sign in directly or request a password reset below.',
        );
      }
    }
  };

  const getActionTitle = () => {
    switch (type) {
      case 'invite':
        return 'Accept Your Invitation';
      case 'recovery':
        return 'Confirm Password Reset';
      default:
        return 'Confirm Security Verification';
    }
  };

  const getActionDescription = () => {
    switch (type) {
      case 'invite':
        return 'Welcome to InsideCare. Click below to verify your account and set up your password.';
      case 'recovery':
        return 'Click below to verify your identity and choose a new password.';
      default:
        return 'Click below to complete your security verification.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-full max-w-md space-y-6">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ShieldCheck className="size-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{getActionTitle()}</h3>
            <p className="text-sm text-muted-foreground">{getActionDescription()}</p>
            <Button
              variant="default"
              onClick={handleVerify}
              className="w-full h-11 text-base font-medium shadow-md mt-4"
            >
              Confirm & Continue
            </Button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="size-10 animate-spin text-primary" />
            <h3 className="text-lg font-medium text-foreground">Verifying your security credentials...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we establish your secure session.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <h3 className="text-lg font-medium text-foreground">Authentication Confirmed</h3>
            <p className="text-sm text-muted-foreground">Redirecting you to your account page...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Link Expired or Invalid</AlertTitle>
              <AlertDescription className="mt-2 text-sm">{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="default"
                onClick={() => navigate(ROUTES.AUTH_SIGNIN)}
                className="w-full sm:w-1/2"
              >
                Return to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.AUTH_RESET_PASSWORD)}
                className="w-full sm:w-1/2"
              >
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

