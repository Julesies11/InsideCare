import { supabase } from './supabase';

/**
 * Invokes the Edge Function to recalculate and sync a user's permissions
 * to their Supabase Auth app_metadata.
 * 
 * @param userId The Supabase Auth User ID (NOT staff_id)
 */
export async function syncUserPermissions(userId: string) {
  if (!userId) return { error: 'userId is required' };

  try {
    const { data, error } = await supabase.functions.invoke('ic-update-user-permissions', {
      body: { userId },
    });

    if (error) {
      console.error('Failed to sync user permissions:', error);
      return { error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error syncing user permissions:', err);
    return { error: err };
  }
}

/**
 * Helper to sync permissions by staff_id if auth_user_id is unknown.
 * 
 * @param staffId The staff member's ID
 */
export async function syncUserPermissionsByStaffId(staffId: string) {
  if (!staffId) return { error: 'staffId is required' };

  const { data: staff, error: staffError } = await supabase
    .from('ic_staff')
    .select('auth_user_id')
    .eq('id', staffId)
    .single();

  if (staffError || !staff?.auth_user_id) {
    return { error: staffError || 'Staff member has no linked Auth user' };
  }

  return syncUserPermissions(staff.auth_user_id);
}

/**
 * Syncs permissions for ALL active users assigned to a specific role.
 * Used when role-level permissions are modified.
 * 
 * @param roleId The ID of the modified role
 */
export async function syncAllUsersOfRole(roleId: string) {
  if (!roleId) return { error: 'roleId is required' };

  const { data: staffMembers, error: staffError } = await supabase
    .from('ic_staff')
    .select('auth_user_id')
    .eq('role_id', roleId)
    .not('auth_user_id', 'is', null)
    .eq('status', 'active');

  if (staffError) return { error: staffError };
  if (!staffMembers || staffMembers.length === 0) return { data: [], error: null };

  console.log(`Syncing ${staffMembers.length} users for role ${roleId}...`);

  // Trigger sync for each user (fire and forget)
  const results = await Promise.all(
    staffMembers.map(s => syncUserPermissions(s.auth_user_id!))
  );

  return { data: results, error: null };
}
