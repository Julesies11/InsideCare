import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export type EmploymentType = Database['public']['Tables']['ic_employment_types_master']['Row'];

export function useEmploymentTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .select('*')
        .order('employment_type_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employmentTypeData: Database['public']['Tables']['ic_employment_types_master']['Insert']) => {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .insert([employmentTypeData])
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(`You do not have permission to add this employment type.`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER] });
    },
  });
}

export function useUpdateEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_employment_types_master']['Update'] }) => {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER] });
    },
  });
}
