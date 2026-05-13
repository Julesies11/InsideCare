import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type AccessLevel = 'full' | 'context_locked' | 'read_only' | 'none';

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
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
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
        .from('role_permissions')
        .upsert({ role_id, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return data as RolePermissions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    },
  });
}
