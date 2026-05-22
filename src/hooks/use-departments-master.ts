import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export type Department = Database['public']['Tables']['ic_departments']['Row'];

export function useDepartmentsMaster() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .select('*')
        .order('department_name', { ascending: true });

      if (error) throw error;
      return data;
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
    mutationFn: async (departmentData: Database['public']['Tables']['ic_departments']['Insert']) => {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .insert([departmentData])
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER] });
    },
  });
}

export function useUpdateDepartmentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_departments']['Update'] }) => {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this department, or it does not exist.');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER] });
    },
  });
}
