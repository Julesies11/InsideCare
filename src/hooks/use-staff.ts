import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { syncUserPermissionsByStaffId } from '@/lib/rbac-sync';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { STATUS } from '@/config/enums';

export type StaffStatus = Database['public']['Enums']['ic_status_enum'];

export type StaffCompliance = Database['public']['Tables']['ic_staff_compliance']['Row'];
export type StaffTraining = Database['public']['Tables']['ic_staff_training']['Row'];

export interface StaffUpdateData extends Partial<Omit<Database['public']['Tables']['ic_staff']['Update'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> {
  name?: string; // Kept for backward compatibility in forms, maps to staff_name
}

export interface StaffFilter {
  search?: string;
  statuses?: StaffStatus[];
}

export interface StaffSort {
  id: string;
  desc: boolean;
}

const STAFF_LIST_COLUMNS = `
  id, staff_name, email, phone, status, branch_id, role_id, photo_url, auth_user_id,
  created_at, updated_at,
  department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name),
  employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!staff_employment_type_id_fkey(id, employment_type_name),
  role:${TABLES.ROLES}!staff_role_id_fkey(id, role_name, description),
  house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_staff_assignments_staff_id_fkey(
    id,
    house_id,
    house:${TABLES.HOUSES}(id, house_name)
  )
`;

const STAFF_DETAIL_COLUMNS = `
  id, staff_name, email, phone, date_of_birth, address, hobbies, allergies, 
  emergency_contact_name, emergency_contact_phone, department_id, 
  employment_type_id, manager_id, hire_date, separation_date, 
  availability, notes, branch_id, role_id, status, auth_user_id, created_by, updated_by, created_at, updated_at, 
  ndis_worker_screening_check, ndis_worker_screening_check_expiry, 
  ndis_orientation_module, ndis_orientation_module_expiry, 
  ndis_code_of_conduct, ndis_code_of_conduct_expiry, 
  ndis_infection_control_training, ndis_infection_control_training_expiry, 
  drivers_license, drivers_license_expiry, comprehensive_car_insurance, 
  comprehensive_car_insurance_expiry, photo_url,
  department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name),
  employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!staff_employment_type_id_fkey(id, employment_type_name),
  role:${TABLES.ROLES}!staff_role_id_fkey(id, role_name, description),
  manager_info:${TABLES.STAFF}!manager_id(id, staff_name)
`;

const getStaffListQuery = () => supabase.from(TABLES.STAFF).select(STAFF_LIST_COLUMNS);
const getStaffDetailQuery = () => supabase.from(TABLES.STAFF).select(STAFF_DETAIL_COLUMNS).single();

export type StaffListRow = Awaited<ReturnType<typeof getStaffListQuery>>['data'] extends (infer U)[] ? U : never;
export type StaffDetailRow = Awaited<ReturnType<typeof getStaffDetailQuery>>['data'];

// UI Expects mapped relations (objects instead of arrays) and backward compat name property
export type Staff = Omit<StaffDetailRow, 'department_info' | 'employment_type_info' | 'manager_info' | 'role'> & {
  name?: string | null;
  department_info?: { id: string; department_name: string; } | null;
  employment_type_info?: { id: string; employment_type_name: string; } | null;
  manager_info?: { id: string; staff_name: string; } | null;
  role?: { id: string; role_name: string; description?: string | null; } | null;
  house_assignments?: Array<{ id: string; house: { id: string; house_name: string; }; }>;
};


export function useStaff(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: StaffSort[] = [],
  filters: StaffFilter = {}
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, { pageIndex, pageSize, sort, filters }],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.STAFF)
        .select(STAFF_LIST_COLUMNS, { count: 'exact' });

      if (filters.search) {
        query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          const column = s.id === 'department' ? 'department_id' : s.id;
          query = query.order(column as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('staff_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const formatted = (data || []).map((item) => ({
        ...item,
        name: item.staff_name, // Map for backward compat
        department_info: Array.isArray(item.department_info) ? item.department_info[0] : item.department_info,
        employment_type_info: Array.isArray(item.employment_type_info) ? item.employment_type_info[0] : item.employment_type_info,
        role: Array.isArray(item.role) ? item.role[0] : item.role,
        house_assignments: (item.house_assignments || []).map((ha: any) => ({
          ...ha,
          house: Array.isArray(ha.house) ? ha.house[0] : ha.house
        }))
      }));

      return { data: formatted as unknown as Staff[], count: count || 0 };
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...query,
    staff: query.data?.data || [],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
    // Backward compatibility methods
    getStaffById: async (id: string) => {
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select(STAFF_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      
      if (!data && !error) {
        return { data: null, error: "Staff member not found or you do not have permission to view them" };
      }
      
      if (data) {
        (data as any).name = data.staff_name;
      }
      
      return { data: data as unknown as Staff, error: error ? error.message : null };
    },
    updateStaff: async (id: string, updates: StaffUpdateData) => {
      // Map 'name' to 'staff_name' for database insertion
      if (updates.name && !updates.staff_name) {
        updates.staff_name = updates.name;
        delete updates.name;
      }
      
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .update(updates as any)
        .eq('id', id)
        .select(STAFF_DETAIL_COLUMNS)
        .maybeSingle();

      if (!data && !error) {
        return { data: null, error: `You do not have permission to edit staff member: ${updates.staff_name || id}` };
      }

      if (data) {
        (data as any).name = data.staff_name;
      }

      return { data: data as unknown as Staff, error: error ? error.message : null };
    },
    deleteStaff: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.STAFF)
        .delete()
        .eq('id', id);
      return { error: error ? error.message : null };
    },
    getStaffCompliance: async (staffId: string) => {
      const { data, error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .select('*')
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });
      return { data, error: error ? error.message : null };
    },
    getStaffTraining: async (staffId?: string) => {
      let query = supabase
        .from(TABLES.STAFF_TRAINING)
        .select('*')
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      return { data, error: error ? error.message : null };
    },
  };
}

export function useStaffMember(id?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select(STAFF_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Staff member not found or you do not have permission to view them");

      // Format joined data (Supabase might return arrays for some relations depending on schema)
      const formattedData = {
        ...data,
        name: data.staff_name, // Map for backward compat
        department_info: Array.isArray(data.department_info) ? data.department_info[0] : data.department_info,
        employment_type_info: Array.isArray(data.employment_type_info) ? data.employment_type_info[0] : data.employment_type_info,
        manager_info: Array.isArray(data.manager_info) ? data.manager_info[0] : data.manager_info,
        role: Array.isArray(data.role) ? data.role[0] : data.role,
      };

      return formattedData as unknown as Staff;
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
    mutationFn: async (staffData: StaffUpdateData) => {
      // Map 'name' to 'staff_name' for database insertion
      if (staffData.name && !staffData.staff_name) {
        staffData.staff_name = staffData.name;
        delete staffData.name;
      }
      
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .insert([{
          ...staffData,
          status: STATUS.draft,
        } as any])
        .select(STAFF_DETAIL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`You do not have permission to create staff member: ${staffData.staff_name || 'New Staff'}`);
      
      (data as any).name = data.staff_name;
      return data as unknown as Staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: StaffUpdateData }) => {
      // Map 'name' to 'staff_name' for database insertion
      if (updates.name && !updates.staff_name) {
        updates.staff_name = updates.name;
        delete updates.name;
      }
      
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .update(updates as any)
        .eq('id', id)
        .select(STAFF_DETAIL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`You do not have permission to edit staff member: ${updates.staff_name || id}`);
      
      (data as any).name = data.staff_name;
      return data as unknown as Staff;
    },
    onSuccess: (data) => {
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.STAFF)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
    },
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, email }: { staffId: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('ic-invite-staff-user', {
        body: { 
          staffId, 
          email,
          redirectTo: `${window.location.origin}/auth/change-password`
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF, variables.staffId] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, authUserId }: { staffId: string; authUserId: string }) => {
      const { data, error } = await supabase.functions.invoke('ic-revoke-staff-invite', {
        body: { staffId, authUserId },
      });

      if (error) throw error;
      return data;
    },
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
      const { data, error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .select('*')
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select(`
          id, staff_name, email, status, photo_url,
          department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name)
        `)
        .eq('role_id', roleId)
        .order('staff_name', { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        name: item.staff_name, // compat
        department_info: Array.isArray(item.department_info) ? item.department_info[0] : item.department_info,
      })) as any[];
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
    queryFn: async () => {
      let query = supabase
        .from(TABLES.STAFF_TRAINING)
        .select('*')
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
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
    queryFn: async () => {
      let query = supabase
        .from(TABLES.STAFF)
        .select('*', { count: 'exact', head: true });

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (filters.search) {
        query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60, // Count can be cached longer (1 min)
  });

  return {
    count: query.data ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}
