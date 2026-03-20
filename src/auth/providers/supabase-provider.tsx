import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import { AuthModel, UserModel } from '@/auth/lib/models';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Fetch user profile with a hard timeout so we never hang forever
async function fetchUserWithTimeout(timeoutMs = 60000): Promise<UserModel | null> {
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
  }
}

// Define the Supabase Auth Provider
export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [auth, setAuth] = useState<AuthModel | undefined>(undefined);

  // Derive role flags directly from currentUser
  const isAdmin = currentUser?.is_admin === true;
  const isStaff = !currentUser?.is_admin && !!currentUser?.staff_id;

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (session) {
      setAuth({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        try {
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
    // Initial session check
    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleAuthStateChange('INITIAL_SESSION', session);
    };

    bootstrap();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthStateChange(event, session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange will handle the state updates
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
    // onAuthStateChange will handle the state updates
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

  const saveAuth = useCallback((authModel: AuthModel | undefined) => {
    setAuth(authModel);
    // We no longer need to manually save to localStorage as @supabase/ssr handles it via cookies
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
