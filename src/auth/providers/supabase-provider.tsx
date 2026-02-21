import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';
import { AuthModel, UserModel } from '@/auth/lib/models';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Fetch user profile with a hard timeout so we never hang forever
async function fetchUserWithTimeout(timeoutMs = 10000): Promise<UserModel | null> {
  return Promise.race([
    SupabaseAdapter.getCurrentUser(),
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Auth profile fetch timed out')), timeoutMs)
    ),
  ]);
}

// Define the Supabase Auth Provider
export function AuthProvider({ children }: PropsWithChildren) {
  // Single loading flag — true until the initial session check completes
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  // Prevent the onAuthStateChange initial event from double-running bootstrap
  const bootstrapped = useRef(false);

  // Derive role flags directly from currentUser — always in sync, no stale state
  const isAdmin = currentUser?.is_admin === true;
  const isStaff = !currentUser?.is_admin && !!currentUser?.staff_id;

  const saveAuth = useCallback((authModel: AuthModel | undefined) => {
    setAuth(authModel);
    if (authModel) {
      authHelper.setAuth(authModel);
    } else {
      authHelper.removeAuth();
    }
  }, []);

  // Bootstrap: run once on mount — get session, then subscribe to changes
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error('Auth bootstrap error:', error.message);
          toast.error('Failed to restore your session. Please sign in again.');
          saveAuth(undefined);
          setCurrentUser(undefined);
          return;
        }

        if (session) {
          const authModel: AuthModel = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
          saveAuth(authModel);
          try {
            const user = await fetchUserWithTimeout();
            if (mounted) setCurrentUser(user || undefined);
          } catch (err: any) {
            console.error('Failed to load user profile:', err.message);
            if (mounted) {
              toast.error('Could not load your profile. Please refresh the page.', {
                action: { label: 'Refresh', onClick: () => window.location.reload() },
              });
              setCurrentUser(undefined);
            }
          }
        } else {
          saveAuth(undefined);
          setCurrentUser(undefined);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          bootstrapped.current = true;
        }
      }
    };

    bootstrap();

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the initial INITIAL_SESSION event — bootstrap handles it
        if (!bootstrapped.current) return;

        if (event === 'SIGNED_IN') {
          if (!session) return;
          const authModel: AuthModel = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
          saveAuth(authModel);
          // Only fetch profile if we don't have one yet.
          // Supabase fires SIGNED_IN on token recovery too — we don't want
          // to re-fetch (and potentially time out) when the user is already loaded.
          setCurrentUser(prev => {
            if (prev) return prev; // already have a user — keep it
            // Kick off async fetch without blocking the state update
            fetchUserWithTimeout(15000)
              .then(u => setCurrentUser(u || undefined))
              .catch((err: any) => {
                console.error('Failed to load user profile on sign-in:', err.message);
                toast.error('Signed in but could not load your profile. Please refresh.', {
                  action: { label: 'Refresh', onClick: () => window.location.reload() },
                });
              });
            return prev; // return unchanged for now; the .then above will update it
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // Just update tokens — do NOT re-fetch profile (avoid wiping user on slow network)
          if (session) {
            saveAuth({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          saveAuth(undefined);
          setCurrentUser(undefined);
        } else if (event === 'USER_UPDATED') {
          // Refresh profile silently when user metadata changes
          if (session) {
            try {
              const user = await fetchUserWithTimeout();
              setCurrentUser(user || undefined);
            } catch {
              // Non-critical — keep existing user state
            }
          }
        }
        // All other events (PASSWORD_RECOVERY etc.) are intentionally ignored
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [saveAuth]);

  // verify() is kept for backward compatibility but now just re-reads the session
  // Guards should NOT call this — they should read loading/auth from context
  const verify = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        saveAuth({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      } else {
        saveAuth(undefined);
        setCurrentUser(undefined);
      }
    } catch (err: any) {
      console.error('verify() error:', err.message);
      saveAuth(undefined);
      setCurrentUser(undefined);
    }
  }, [saveAuth]);

  const login = async (email: string, password: string) => {
    try {
      const authModel = await SupabaseAdapter.login(email, password);
      saveAuth(authModel);
      const user = await SupabaseAdapter.getCurrentUser();
      setCurrentUser(user || undefined);
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    password_confirmation: string,
    firstName?: string,
    lastName?: string,
  ) => {
    try {
      const auth = await SupabaseAdapter.register(
        email,
        password,
        password_confirmation,
        firstName,
        lastName,
      );
      saveAuth(auth);
      const user = await getUser();
      setCurrentUser(user || undefined);
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    await SupabaseAdapter.requestPasswordReset(email);
  };

  const resetPassword = async (
    password: string,
    password_confirmation: string,
  ) => {
    await SupabaseAdapter.resetPassword(password, password_confirmation);
  };

  const resendVerificationEmail = async (email: string) => {
    await SupabaseAdapter.resendVerificationEmail(email);
  };

  const getUser = async () => {
    return await SupabaseAdapter.getCurrentUser();
  };

  const updateProfile = async (userData: Partial<UserModel>) => {
    return await SupabaseAdapter.updateUserProfile(userData);
  };

  const logout = () => {
    SupabaseAdapter.logout();
    saveAuth(undefined);
    setCurrentUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        user: currentUser,
        setUser: setCurrentUser,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        resendVerificationEmail,
        getUser,
        updateProfile,
        logout,
        verify,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
