import { UserModel } from '@/auth/lib/models';
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
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw new Error(error.message);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return this.getUserProfile();
  },

  /**
   * Get user profile from user metadata
   */
  async getUserProfile(): Promise<UserModel> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(error?.message || 'User not found');
    }

    // Get user metadata and transform to UserModel format
    const metadata = user.user_metadata || {};

    // Look up linked staff record
    const { data: staffRow } = await supabase
      .from('staff')
      .select('id, name, photo_url, role:roles(name)')
      .eq('auth_user_id', user.id)
      .maybeSingle();
      
    const staff_id = staffRow?.id ?? undefined;
    const staff_name = staffRow?.name ?? undefined;
    const photo_url = staffRow?.photo_url ?? null;
    const role_name = (staffRow as any)?.role?.name ?? undefined;
    
    // Format data to maintain compatibility with existing UI
    return {
      email: user.email || '',
      email_verified: user.email_confirmed_at !== null,
      username: metadata.username || '',
      first_name: metadata.first_name || '',
      last_name: metadata.last_name || '',
      fullname:
        metadata.fullname ||
        `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
      occupation: metadata.occupation || '',
      company_name: metadata.company_name || '',
      phone: metadata.phone || '',
      roles: metadata.roles || [],
      pic: metadata.pic || '',
      language: metadata.language || 'en',
      is_admin: metadata.is_admin || false,
      permissions: metadata.permissions || {},
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
      'update-user-roles',
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
