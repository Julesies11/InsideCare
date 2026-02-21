import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';
import { AuthModel, UserModel } from '@/auth/lib/models';
import { supabase } from '@/lib/supabase';

// Define the Supabase Auth Provider
export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const initialised = useRef(false);

  // Derive role flags directly from currentUser — always in sync, no stale state
  const isAdmin = currentUser?.is_admin === true;
  const isStaff = !currentUser?.is_admin && !!currentUser?.staff_id;

  // Bootstrap: listen to Supabase auth state changes as source of truth
  useEffect(() => {
    // Get initial session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const authModel: AuthModel = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        };
        setAuth(authModel);
        authHelper.setAuth(authModel);
        try {
          const user = await SupabaseAdapter.getCurrentUser();
          setCurrentUser(user || undefined);
        } catch {
          setCurrentUser(undefined);
        }
      } else {
        setAuth(undefined);
        authHelper.removeAuth();
        setCurrentUser(undefined);
      }
      setLoading(false);
      initialised.current = true;
    });

    // Subscribe to future auth changes (token refresh, sign-out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialised.current) return; // skip duplicate initial event
        if (session) {
          const authModel: AuthModel = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
          setAuth(authModel);
          authHelper.setAuth(authModel);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              const user = await SupabaseAdapter.getCurrentUser();
              setCurrentUser(user || undefined);
            } catch {
              setCurrentUser(undefined);
            }
          }
        } else {
          setAuth(undefined);
          authHelper.removeAuth();
          setCurrentUser(undefined);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const verify = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const authModel: AuthModel = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        };
        setAuth(authModel);
        authHelper.setAuth(authModel);
        const user = await SupabaseAdapter.getCurrentUser();
        setCurrentUser(user || undefined);
      } else {
        setAuth(undefined);
        setCurrentUser(undefined);
      }
    } catch {
      saveAuth(undefined);
      setCurrentUser(undefined);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

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
