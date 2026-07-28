import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/config/routes.config';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Handles white-labeled verification links (e.g. invites, password resets)
 * by exchanging token_hash directly with Supabase auth via verifyOtp.
 */
export function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as any; // 'invite', 'recovery', 'signup', etc.
    const rawNext = searchParams.get('next');
    
    // Security Hardening: Ensure target redirect path is relative to prevent open-redirect attacks
    const defaultNext = (type === 'invite' || type === 'recovery') ? ROUTES.AUTH_CHANGE_PASSWORD : ROUTES.HOME;
    const safeNext = (rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : defaultNext;

    if (!tokenHash || !type) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Missing token parameters.');
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setStatus('success');
          // Short pause so user sees confirmation before navigation
          setTimeout(() => {
            if (isMounted) {
              navigate(safeNext, { replace: true });
            }
          }, 800);
        }
      } catch (err: any) {
        console.error('Failed to verify authentication token:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            err.message || 'Verification token has expired or is invalid. Please request a new invitation or reset link.',
          );
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-full max-w-md space-y-6">
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
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription className="mt-2 text-sm">{errorMessage}</AlertDescription>
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
        )}
      </div>
    </div>
  );
}
