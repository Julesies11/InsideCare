import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Department {
  id: string;
  department_name: string;
  description?: string | null;
  access_level?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const DEPARTMENT_COLUMNS = 'id, department_name, description, access_level, status, created_at, updated_at';

export function useDepartmentsMaster() {
  const query = useQuery({
    queryKey: ['departments-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ic_departments')
        .select(DEPARTMENT_COLUMNS)
        .order('department_name', { ascending: true });

      if (error) throw error;
      return data as Department[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    departments: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}

export function useAddDepartmentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ic_departments')
        .insert([departmentData])
        .select(DEPARTMENT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-master'] });
    },
  });
}

export function useUpdateDepartmentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
      const { data, error } = await supabase
        .from('ic_departments')
        .update(updates)
        .eq('id', id)
        .select(DEPARTMENT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this department, or it does not exist.');
      }
      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-master'] });
    },
  });
}
