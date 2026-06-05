import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import { AuthModel, UserModel } from '@/auth/lib/models';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { syncUserPermissions } from '@/lib/rbac-sync';

// Singleton promise to prevent concurrent profile fetches and auth lock contention
let activeUserPromise: Promise<UserModel | null> | null = null;

// Fetch user profile with a hard timeout and singleton pattern
async function fetchUserWithTimeout(timeoutMs = 60000): Promise<UserModel | null> {
  if (activeUserPromise) return activeUserPromise;

  activeUserPromise = (async () => {
    let timeoutId: any;
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Auth profile fetch timed out'));
      }, timeoutMs);
    });

    try {
      const userPromise = SupabaseAdapter.getCurrentUser().then(user => {
        clearTimeout(timeoutId);
        return user;
      });
      return await Promise.race([userPromise, timeoutPromise]);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      activeUserPromise = null;
    }
  })();

  return activeUserPromise;
}

// Define the Supabase Auth Provider
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [auth, setAuth] = useState<AuthModel | undefined>(undefined);
  const authInitialized = useRef(false);

  // Derive role flags directly from currentUser
  const isAdmin = currentUser?.is_admin === true;
  const isStaff = !currentUser?.is_admin && !!currentUser?.staff_id;

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    const isProfileEvent = event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'VERIFY';
    
    if (session) {
      setAuth({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (isProfileEvent) {
        try {
          // Hardening: Ensure permissions are synced on login
          if (event === 'SIGNED_IN') {
            syncUserPermissions(session.user.id).catch(() => {});
          }
          
          const user = await fetchUserWithTimeout();
          setCurrentUser(user || undefined);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          if (event === 'SIGNED_IN') {
            toast.error('Signed in but could not load your profile. Please refresh.');
          }
        }
      }
    } else {
      setAuth(undefined);
      setCurrentUser(undefined);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to auth state changes.
    // The supabase-js client handles internal locking for the subscription.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          console.log(`[Auth] Event: ${event}`);
          authInitialized.current = true;
          handleAuthStateChange(event, session);
        }
      }
    );

    // 2. "Quiet" Fallback: Only check manually if the subscription hasn't initialized 
    // within a small grace period. This prevents double-fetching on startup.
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && !authInitialized.current) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (isMounted && !authInitialized.current) {
            console.log('[Auth] Fallback session check triggered');
            authInitialized.current = true;
            handleAuthStateChange('INITIAL_SESSION', session);
          }
        });
      }
    }, 200); // 200ms grace period for the subscription to fire first

    // 3. Safety fallback: If auth doesn't initialize within 10 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !authInitialized.current) {
        console.warn('[Auth] Initialization safety timeout reached');
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
      clearTimeout(safetyTimeout);
    };
  }, [handleAuthStateChange]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };


  const register = async (
    email: string,
    password: string,
    password_confirmation: string,
    firstName?: string,
    lastName?: string,
  ) => {
    if (password !== password_confirmation) throw new Error('Passwords do not match');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          fullname: firstName && lastName ? `${firstName} ${lastName}`.trim() : '',
        },
      },
    });
    
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  const verify = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await handleAuthStateChange('VERIFY', session);
  }, [handleAuthStateChange]);

  const requestPasswordReset = async (email: string) => {
    await SupabaseAdapter.requestPasswordReset(email);
  };

  const resetPassword = async (password: string, password_confirmation: string) => {
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

  const updateUserRoles = async (
    userId: string,
    updates: { isAdmin?: boolean; permissions?: Record<string, string> },
  ) => {
    await SupabaseAdapter.updateUserRoles(userId, updates);
  };

  const saveAuth = useCallback((authModel: AuthModel | undefined) => {
    setAuth(authModel);
  }, []);

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
        updateUserRoles,
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
