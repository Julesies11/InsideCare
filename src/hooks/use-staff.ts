import { complianceApi } from '@/api/compliance.api';
import { onboardingApi } from '@/api/onboarding.api';
import {
  StaffComplianceSummaryRow,
  staffDetailsApi,
} from '@/api/staff-details.api';
import {
  staffApi,
  StaffCompliance,
  StaffFilter,
  StaffSort,
  StaffStatus,
  StaffTraining,
  StaffUpdateData,
} from '@/api/staff.api';
import { Database } from '@/models/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { syncUserPermissionsByStaffId } from '@/lib/rbac-sync';

// Re-export types for backward compatibility
export type {
  StaffStatus,
  StaffCompliance,
  StaffTraining,
  StaffUpdateData,
  StaffFilter,
  StaffSort,
};

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
  department_info?: { id: string; department_name: string } | null;
  employment_type_info?: { id: string; employment_type_name: string } | null;
  manager_info?: { id: string; staff_name: string } | null;
  role?: { id: string; role_name: string; description?: string | null } | null;
  house_assignments?: Array<{
    id: string;
    house: { id: string; house_name: string };
  }>;
} & Partial<Database['public']['Tables']['ic_staff']['Row']>;

export function useStaff(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: StaffSort[] = [],
  filters: StaffFilter = {},
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
          return {
            data: null,
            error:
              'Staff member not found or you do not have permission to view them',
          };
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

export function useStaffLightweight() {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF, 'lightweight'],
    queryFn: () => staffApi.listLightweight(),
    staleTime: 0,
  });
}

export function useActiveStaff(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, 'active'],
    queryFn: () => staffApi.listActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });

  return {
    ...query,
    staff: (query.data || []) as unknown as Staff[],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useStaffMember(id?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, id],
    queryFn: async () => {
      if (!id) return null;
      const data = await staffApi.get(id);
      if (!data)
        throw new Error(
          'Staff member not found or you do not have permission to view them',
        );
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF, variables.staffId],
      });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      authUserId,
    }: {
      staffId: string;
      authUserId: string;
    }) => staffApi.revokeInvite(staffId, authUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF, variables.staffId],
      });
    },
  });
}

export function useComplianceMonitoring(params: {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string[];
  staffStatuses?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = useQuery({
    queryKey: ['compliance-monitoring', params],
    queryFn: () => complianceApi.monitoring.getPaginatedList(params),
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useStaffCompliance(staffId: string) {
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

export function useStaffComplianceSummary(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_COMPLIANCE_SUMMARY, staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return staffDetailsApi.compliance.getSummary(staffId);
    },
    enabled: !!staffId,
    staleTime: 0,
  });

  return {
    ...query,
    data: query.data || [],
    isLoading: query.isLoading,
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

export function useRequiredStaffCompliance(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_COMPLIANCE, 'required', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return staffDetailsApi.compliance.listRequired(staffId);
    },
    enabled: !!staffId,
  });

  return {
    ...query,
    requiredCompliance: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useComplianceTypes(includeInactive = false) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.COMPLIANCE_TYPES_MASTER, { includeInactive }],
    queryFn: () => complianceApi.types.list(includeInactive),
    staleTime: 0,
  });

  return {
    ...query,
    types: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useHouseComplianceRequirements(houseId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_COMPLIANCE_REQUIREMENTS, houseId],
    queryFn: async () => {
      if (!houseId) return [];
      return complianceApi.house.listRequirements(houseId);
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    ...query,
    requirements: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useAddComplianceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      newType: Partial<
        Database['public']['Tables']['ic_compliance_types_master']['Insert']
      >,
    ) => complianceApi.types.upsert(newType),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COMPLIANCE_TYPES_MASTER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_COMPLIANCE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_COMPLIANCE_SUMMARY],
      });
    },
  });
}

export function useUpdateComplianceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Database['public']['Tables']['ic_compliance_types_master']['Update']
      >;
    }) => complianceApi.types.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COMPLIANCE_TYPES_MASTER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_COMPLIANCE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_COMPLIANCE_SUMMARY],
      });
    },
  });
}

export function useIDDocumentTypes(includeInactive = false) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ID_DOCUMENT_TYPES, { includeInactive }],
    queryFn: () => complianceApi.idDocumentTypes.list(includeInactive),
    staleTime: 0,
  });

  return {
    ...query,
    idDocumentTypes: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useStaffOnboardingSummary(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_ONBOARDING, staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return staffDetailsApi.onboarding.getSummary(staffId);
    },
    enabled: !!staffId,
    staleTime: 0,
  });

  return {
    ...query,
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useOnboardingMonitoring(params: {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string[];
  staffStatuses?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = useQuery({
    queryKey: ['onboarding-monitoring', params],
    queryFn: () => onboardingApi.monitoring.getPaginatedList(params),
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useOnboardingItemsMaster(includeInactive = false) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ONBOARDING_ITEMS_MASTER, { includeInactive }],
    queryFn: () => onboardingApi.master.list(includeInactive),
    staleTime: 0,
  });

  return {
    ...query,
    items: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useAddOnboardingItemMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      newItem: Partial<
        Database['public']['Tables']['ic_onboarding_items_master']['Insert']
      >,
    ) => onboardingApi.master.upsert(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ONBOARDING_ITEMS_MASTER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_ONBOARDING],
      });
    },
  });
}

export function useUpdateOnboardingItemMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Database['public']['Tables']['ic_onboarding_items_master']['Update']
      >;
    }) => onboardingApi.master.upsert({ id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ONBOARDING_ITEMS_MASTER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_ONBOARDING],
      });
    },
  });
}

export function useAddIDDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      newType: Partial<
        Database['public']['Tables']['ic_id_document_types']['Insert']
      >,
    ) => complianceApi.idDocumentTypes.upsert(newType),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ID_DOCUMENT_TYPES],
      });
    },
  });
}

export function useUpdateIDDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Database['public']['Tables']['ic_id_document_types']['Update']
      >;
    }) => complianceApi.idDocumentTypes.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ID_DOCUMENT_TYPES],
      });
    },
  });
}

export function useDeleteIDDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceApi.idDocumentTypes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ID_DOCUMENT_TYPES],
      });
    },
  });
}
