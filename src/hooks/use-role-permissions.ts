import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/api/system.api';
import { AccessLevel } from './useRBAC';
import { syncAllUsersOfRole } from '@/lib/rbac-sync';
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
      const data = await systemApi.permissions.listAll();
      return data as RolePermissions[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role_id, updates }: { role_id: string; updates: Partial<RolePermissions> }) => {
      const data = await systemApi.permissions.upsert(role_id, updates);
      return data as RolePermissions;
    },
    onSuccess: (_, { role_id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLE_PERMISSIONS] });
      // Propagate changes to all users of this role
      syncAllUsersOfRole(role_id);
    },
  });
}
