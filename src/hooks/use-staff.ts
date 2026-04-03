import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type StaffStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Staff {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  hobbies?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  department_id?: string | null;
  employment_type_id?: string | null;
  manager_id?: string | null;
  hire_date?: string | null;
  separation_date?: string | null;
  availability?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  status: StaffStatus;
  created_at?: string;
  updated_at?: string;
  department_info?: { id: string; name: string; } | null;
  employment_type_info?: { id: string; name: string; } | null;
  manager_info?: { id: string; name: string; } | null;
  role?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  // Compliance checklist fields
  ndis_worker_screening_check?: boolean | null;
  ndis_worker_screening_check_expiry?: string | null;
  ndis_orientation_module?: boolean | null;
  ndis_orientation_module_expiry?: string | null;
  ndis_code_of_conduct?: boolean | null;
  ndis_code_of_conduct_expiry?: string | null;
  ndis_infection_control_training?: boolean | null;
  ndis_infection_control_training_expiry?: string | null;
  drivers_license?: boolean | null;
  drivers_license_expiry?: string | null;
  comprehensive_car_insurance?: boolean | null;
  comprehensive_car_insurance_expiry?: string | null;
  photo_url?: string | null;
}

export interface StaffCompliance {
  id: string;
  staff_id: string;
  compliance_name: string;
  completion_date?: string | null;
  expiry_date?: string | null;
  status?: 'Complete' | 'Expiring Soon' | 'Expired' | 'Incomplete' | 'Not Required' | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffTraining {
  id: string;
  staff_id?: string;
  title: string;
  category: string;
  description?: string | null;
  provider?: string | null;
  date_completed?: string | null;
  expiry_date?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffUpdateData {
  name?: string;
  email?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  hobbies?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  department_id?: string | null;
  employment_type_id?: string | null;
  manager_id?: string | null;
  hire_date?: string | null;
  separation_date?: string | null;
  availability?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  status?: StaffStatus;
}

export interface StaffFilter {
  search?: string;
  statuses?: string[];
}

export interface StaffSort {
  id: string;
  desc: boolean;
}

const STAFF_LIST_COLUMNS = `
  id, name, email, phone, status, branch_id, role_id, photo_url, 
  created_at, updated_at,
  department_info:departments(id, name),
  employment_type_info:employment_types_master(id, name),
  role:roles!staff_role_id_fkey(id, name, description)
`;

const STAFF_DETAIL_COLUMNS = `
  id, name, email, phone, date_of_birth, address, hobbies, allergies, 
  emergency_contact_name, emergency_contact_phone, department_id, 
  employment_type_id, manager_id, hire_date, separation_date, 
  availability, notes, branch_id, role_id, status, created_at, updated_at, 
  ndis_worker_screening_check, ndis_worker_screening_check_expiry, 
  ndis_orientation_module, ndis_orientation_module_expiry, 
  ndis_code_of_conduct, ndis_code_of_conduct_expiry, 
  ndis_infection_control_training, ndis_infection_control_training_expiry, 
  drivers_license, drivers_license_expiry, comprehensive_car_insurance, 
  comprehensive_car_insurance_expiry, photo_url,
  department_info:departments(id, name),
  employment_type_info:employment_types_master(id, name),
  role:roles!staff_role_id_fkey(id, name, description),
  manager_info:staff!manager_id(id, name)
`;

export function useStaff(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: StaffSort[] = [],
  filters: StaffFilter = {}
) {
  const query = useQuery({
    queryKey: ['staff', { pageIndex, pageSize, sort, filters }],
    queryFn: async () => {
      let query = supabase
        .from('staff')
        .select(STAFF_LIST_COLUMNS, { count: 'exact' });

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          const column = s.id === 'department' ? 'department_id' : s.id;
          query = query.order(column, { ascending: !s.desc });
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        department_info: Array.isArray(item.department_info) ? item.department_info[0] : item.department_info,
        employment_type_info: Array.isArray(item.employment_type_info) ? item.employment_type_info[0] : item.employment_type_info,
        role: Array.isArray(item.role) ? item.role[0] : item.role,
      }));

      return { data: formatted as Staff[], count: count || 0 };
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
    // Backward compatibility
    getStaffById: async (id: string) => {
      const { data, error } = await supabase
        .from('staff')
        .select(STAFF_DETAIL_COLUMNS)
        .eq('id', id)
        .single();
      return { data, error: error ? error.message : null };
    },
    updateStaff: async (id: string, updates: StaffUpdateData) => {
      const { data, error } = await supabase
        .from('staff')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(STAFF_DETAIL_COLUMNS)
        .single();
      return { data, error: error ? error.message : null };
    },
    deleteStaff: async (id: string) => {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      return { error: error ? error.message : null };
    },
    getStaffCompliance: async (staffId: string) => {
      const { data, error } = await supabase
        .from('staff_compliance')
        .select('id, staff_id, compliance_name, completion_date, expiry_date, status, created_at, updated_at')
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });
      return { data, error: error ? error.message : null };
    },
    getStaffTraining: async (staffId?: string) => {
      let query = supabase
        .from('staff_training')
        .select('id, staff_id, title, category, description, provider, date_completed, expiry_date, file_path, file_name, file_size, created_by, created_at, updated_at')
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
    queryKey: ['staff', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('staff')
        .select(STAFF_DETAIL_COLUMNS)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format joined data (Supabase might return arrays for some relations depending on schema)
      const formattedData = {
        ...data,
        department_info: Array.isArray(data.department_info) ? data.department_info[0] : data.department_info,
        employment_type_info: Array.isArray(data.employment_type_info) ? data.employment_type_info[0] : data.employment_type_info,
        manager_info: Array.isArray(data.manager_info) ? data.manager_info[0] : data.manager_info,
        role: Array.isArray(data.role) ? data.role[0] : data.role,
      };

      return formattedData as Staff;
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
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          ...staffData,
          status: 'draft',
          name: staffData.name ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(STAFF_DETAIL_COLUMNS)
        .single();

      if (error) throw error;
      return data as Staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: StaffUpdateData }) => {
      const { data, error } = await supabase
        .from('staff')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(STAFF_DETAIL_COLUMNS)
        .single();

      if (error) throw error;
      return data as Staff;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useStaffCompliance(staffId?: string) {
  const query = useQuery({
    queryKey: ['staff-compliance', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from('staff_compliance')
        .select('id, staff_id, compliance_name, completion_date, expiry_date, status, created_at, updated_at')
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data as StaffCompliance[];
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

export function useStaffTraining(staffId?: string) {
  const query = useQuery({
    queryKey: ['staff-training', staffId],
    queryFn: async () => {
      let query = supabase
        .from('staff_training')
        .select('id, staff_id, title, category, description, provider, date_completed, expiry_date, file_path, file_name, file_size, created_by, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StaffTraining[];
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
