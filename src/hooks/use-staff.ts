import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, StaffUpdateData, StaffFilter, StaffSort, StaffStatus, StaffCompliance, StaffTraining } from '@/api/staff.api';
import { syncUserPermissionsByStaffId } from '@/lib/rbac-sync';
import { Database } from '@/models/database.types';
import { QUERY_KEYS } from '@/config/query-keys';

// Re-export types for backward compatibility
export type { StaffStatus, StaffCompliance, StaffTraining, StaffUpdateData, StaffFilter, StaffSort };

// UI Expects mapped relations (objects instead of arrays) and backward compat name property
export type Staff = {
  id: string;
  staff_name: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  status: StaffStatus;
  branch_id?: string | null;
  role_id?: string | null;
  photo_url?: string | null;
  auth_user_id?: string | null;
  created_at: string;
  updated_at: string;
  department_info?: { id: string; department_name: string; } | null;
  employment_type_info?: { id: string; employment_type_name: string; } | null;
  manager_info?: { id: string; staff_name: string; } | null;
  role?: { id: string; role_name: string; description?: string | null; } | null;
  house_assignments?: Array<{ id: string; house: { id: string; house_name: string; }; }>;
} & Partial<Database['public']['Tables']['ic_staff']['Row']>;


export function useStaff(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: StaffSort[] = [],
  filters: StaffFilter = {}
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, { pageIndex, pageSize, sort, filters }],
    queryFn: () => staffApi.list({ pageIndex, pageSize, sort, filters }),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...query,
    staff: (query.data?.data || []) as unknown as Staff[],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
    // Backward compatibility methods
    getStaffById: async (id: string) => {
      try {
        const data = await staffApi.get(id);
        if (!data) {
          return { data: null, error: "Staff member not found or you do not have permission to view them" };
        }
        return { data: data as unknown as Staff, error: null };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    },
    updateStaff: async (id: string, updates: StaffUpdateData) => {
      try {
        const data = await staffApi.update(id, updates);
        return { data: data as unknown as Staff, error: null };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    },
    deleteStaff: async (id: string) => {
      try {
        await staffApi.delete(id);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    getStaffCompliance: async (staffId: string) => {
      try {
        const data = await staffApi.getCompliance(staffId);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    },
    getStaffTraining: async (staffId?: string) => {
      try {
        const data = await staffApi.getTraining(staffId);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    },
  };
}

export function useStaffMember(id?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, id],
    queryFn: async () => {
      if (!id) return null;
      const data = await staffApi.get(id);
      if (!data) throw new Error("Staff member not found or you do not have permission to view them");
      return data as unknown as Staff;
    },
    enabled: !!id,
  });

  return {
    ...query,
    staffMember: query.data || null,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffData: StaffUpdateData) => staffApi.create(staffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: StaffUpdateData }) => 
      staffApi.update(id, updates),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF, data.id] });
      
      // Sync RBAC permissions to Auth metadata
      syncUserPermissionsByStaffId(data.id);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
    },
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, email }: { staffId: string; email: string }) => 
      staffApi.invite(staffId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF, variables.staffId] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, authUserId }: { staffId: string; authUserId: string }) => 
      staffApi.revokeInvite(staffId, authUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF, variables.staffId] });
    },
  });
}

export function useStaffCompliance(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_COMPLIANCE, staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return staffApi.getCompliance(staffId);
    },
    enabled: !!staffId,
  });

  return {
    ...query,
    compliance: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useStaffByRole(roleId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, 'by-role', roleId],
    queryFn: async () => {
      if (!roleId) return [];
      return staffApi.listByRole(roleId);
    },
    enabled: !!roleId,
  });

  return {
    ...query,
    staff: query.data || [],
    loading: query.isLoading,
  };
}

export function useStaffTraining(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_TRAINING, staffId],
    queryFn: () => staffApi.getTraining(staffId),
  });

  return {
    ...query,
    training: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useStaffCount(filters: StaffFilter = {}) {
  const query = useQuery({
    queryKey: ['staff-count', { filters }],
    queryFn: () => staffApi.count(filters),
    staleTime: 1000 * 60, // Count can be cached longer (1 min)
  });

  return {
    count: query.data ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}
