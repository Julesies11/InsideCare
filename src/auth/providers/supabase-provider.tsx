import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
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
  if (activeUserPromise) {
    console.log('[Auth] fetchUser: Returning existing activeUserPromise');
    return activeUserPromise;
  }

  console.log('[Auth] fetchUser: Starting new fetch...');
  activeUserPromise = (async () => {
    let timeoutId: any;
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error(`[Auth] fetchUser: TIMED OUT after ${timeoutMs}ms`);
        reject(new Error('Auth profile fetch timed out'));
      }, timeoutMs);
    });

    try {
      const userPromise = SupabaseAdapter.getCurrentUser().then(user => {
        console.log('[Auth] fetchUser: SupabaseAdapter returned:', user ? 'USER_FOUND' : 'NULL');
        clearTimeout(timeoutId);
        return user;
      });
      return await Promise.race([userPromise, timeoutPromise]);
    } catch (err) {
      console.error('[Auth] fetchUser: ERROR caught:', err);
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

  // Derive role flags directly from currentUser
  const isAdmin = currentUser?.is_admin === true;
  const isStaff = !currentUser?.is_admin && !!currentUser?.staff_id;

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    // Only trigger global loading for initial bootstrap or sign-in if we are currently "empty"
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && !session) {
      setLoading(true);
    }
    
    if (session) {
      setAuth({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'VERIFY') {
        try {
          // Hardening: Ensure permissions are synced on login
          if (event === 'SIGNED_IN') {
            console.log('[Auth] Triggering permission sync...');
            syncUserPermissions(session.user.id).catch(err => {
              console.error('[Auth] Permission sync failed (non-blocking):', err);
            });
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
    // Subscribe to auth state changes. This will also fire immediately 
    // with the INITIAL_SESSION event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthStateChange(event, session);
      }
    );

    // Safety fallback: If auth doesn't initialize within 5 seconds, stop loading
    // This prevents WSoD/stuck loader if Supabase URL is invalid or blocked
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [handleAuthStateChange]);

  const login = async (email: string, password: string) => {
    console.log(`[Auth] Attempting signInWithPassword for: ${email}`);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      const duration = Date.now() - startTime;

      if (error) {
        console.error(`[Auth] signInWithPassword ERROR after ${duration}ms:`, {
          status: error.status,
          message: error.message,
          code: error.code
        });
        throw error;
      }

      console.log(`[Auth] signInWithPassword SUCCESS after ${duration}ms. Session user:`, data.user?.id);
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[Auth] signInWithPassword EXCEPTION after ${duration}ms:`, err);
      throw err;
    }
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
