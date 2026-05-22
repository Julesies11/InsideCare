import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AccessLevel } from './useRBAC';
import { syncAllUsersOfRole } from '@/lib/rbac-sync';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export interface RolePermissions {
  role_id: string;
  participant_profiles: AccessLevel;
  staff_profiles: AccessLevel;
  house_profiles: AccessLevel;
  shift_notes: AccessLevel;
  participant_documents: AccessLevel;
  house_documents: AccessLevel;
  staff_documents: AccessLevel;
  roster_board: AccessLevel;
  assign_staff_to_shift: AccessLevel;
  timesheets_submit: AccessLevel;
  timesheets_approve: AccessLevel;
  house_checklists: AccessLevel;
  shift_routines: AccessLevel;
  leave_requests: AccessLevel;
  created_at?: string;
  updated_at?: string;
}

export function useAllRolePermissions() {
  return useQuery({
    queryKey: [QUERY_KEYS.ROLE_PERMISSIONS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .select('*');

      if (error) throw error;
      return data as RolePermissions[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role_id, updates }: { role_id: string; updates: Partial<RolePermissions> }) => {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .upsert(
          { role_id, ...updates },
          { onConflict: 'role_id' }
        )
        .select()
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      
      return data as RolePermissions;
    },
    onSuccess: (_, { role_id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLE_PERMISSIONS] });
      // Propagate changes to all users of this role
      syncAllUsersOfRole(role_id);
    },
  });
}
