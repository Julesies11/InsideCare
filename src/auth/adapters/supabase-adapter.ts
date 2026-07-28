import { UserModel } from '@/auth/lib/models';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

/**
 * Supabase adapter that provides profile management and OAuth integration.
 * Optimized for use with @supabase/ssr.
 */
export const SupabaseAdapter = {
  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithOAuth(
    provider:
      | 'google'
      | 'github'
      | 'facebook'
      | 'twitter'
      | 'discord'
      | 'slack',
    options?: { redirectTo?: string },
  ): Promise<void> {
    const redirectTo =
      options?.redirectTo || `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) throw new Error(error.message);
  },

  /**
   * Request password reset via custom Resend Edge Function
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/auth/change-password`;
      const { data, error } = await supabase.functions.invoke(
        'ic-send-password-reset',
        {
          body: {
            email,
            redirectTo: redirectUrl,
          },
        },
      );

      if (error) {
        let detailedMessage = error.message;
        try {
          if ('context' in error && error.context instanceof Response) {
            const errJson = await (error.context as Response).clone().json();
            if (errJson?.error) detailedMessage = errJson.error;
          }
        } catch (_) {
          // ignore parsing error
        }
        throw new Error(detailedMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Unexpected error in password reset:', err);
      throw err;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    password: string,
    password_confirmation: string,
  ): Promise<void> {
    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw new Error(error.message);
  },

  /**
   * Request another verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });

    if (error) throw new Error(error.message);
  },

  /**
   * Get current user from the session
   */
  async getCurrentUser(): Promise<UserModel | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    return this.getUserProfile(user);
  },

  /**
   * Get user profile from user and app metadata
   */
  async getUserProfile(passedUser?: User): Promise<UserModel> {
    let user = passedUser;

    if (!user) {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error || !authUser) {
        throw new Error(error?.message || 'User not found');
      }
      user = authUser;
    }

    // RBAC Source of Truth: app_metadata (verified by server)
    // User Profile Source: user_metadata (user settings)
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};

    // Look up linked staff record - wrap in try/catch to ensure RBAC from app_metadata
    // still works even if DB lookup fails (e.g. RLS issues or no staff record yet)
    let staffRow = null;
    try {
      const { data } = await supabase
        .from(TABLES.STAFF)
        .select(
          'id, staff_name, photo_url, role:ic_roles!staff_role_id_fkey(role_name)',
        )
        .eq('auth_user_id', user.id)
        .maybeSingle();
      staffRow = data;
    } catch (err) {
      console.warn(
        'Failed to fetch staff record, falling back to metadata:',
        err,
      );
    }

    const staff_id = staffRow?.id ?? appMetadata.staff_id ?? undefined;
    const staff_name = staffRow?.staff_name ?? undefined;
    const photo_url = staffRow?.photo_url ?? null;
    const role_name =
      (staffRow as any)?.role?.role_name ?? appMetadata.role_name ?? undefined;

    // Format data to maintain compatibility with existing UI
    return {
      id: user.id,
      email: user.email || '',
      email_verified: user.email_confirmed_at !== null,
      username: userMetadata.username || '',
      first_name: userMetadata.first_name || '',
      last_name: userMetadata.last_name || '',
      fullname:
        userMetadata.fullname ||
        `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim(),
      occupation: userMetadata.occupation || '',
      company_name: userMetadata.company_name || '',
      phone: userMetadata.phone || '',
      roles: userMetadata.roles || [],
      pic: userMetadata.pic || '',
      language: userMetadata.language || 'en',

      // RBAC Fields (Always use appMetadata as source of truth)
      is_admin: appMetadata.is_admin === true,
      permissions: (appMetadata.permissions as Record<string, string>) || {},

      staff_id,
      staff_name,
      photo_url,
      role_name,
    };
  },

  /**
   * Update user profile (stored in metadata)
   * Note: Sensitive fields like is_admin and roles are excluded here to prevent
   * self-privilege elevation. Use updateUserRoles for administrative updates.
   */
  async updateUserProfile(userData: Partial<UserModel>): Promise<UserModel> {
    // Transform from UserModel to metadata format (excluding sensitive fields)
    const metadata: Record<string, unknown> = {
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      fullname:
        userData.fullname ||
        `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      occupation: userData.occupation,
      company_name: userData.company_name,
      phone: userData.phone,
      pic: userData.pic,
      language: userData.language,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(metadata).forEach((key) => {
      if (metadata[key] === undefined) {
        delete metadata[key];
      }
    });

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) throw new Error(error.message);

    return this.getUserProfile();
  },

  /**
   * Update user roles and administrative status via secure Edge Function.
   * Only accessible by Admins.
   */
  async updateUserRoles(
    userId: string,
    updates: { isAdmin?: boolean; permissions?: Record<string, string> },
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      'ic-update-user-roles',
      {
        body: {
          userId,
          isAdmin: updates.isAdmin,
          permissions: updates.permissions,
        },
      },
    );

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};
