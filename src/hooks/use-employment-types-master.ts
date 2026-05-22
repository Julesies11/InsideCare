import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';

export type EmploymentType = Database['public']['Tables']['ic_employment_types_master']['Row'];

export function useEmploymentTypesMaster() {
  return useQuery({
    queryKey: ['employment-types-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ic_employment_types_master')
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
        .from('ic_employment_types_master')
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
      queryClient.invalidateQueries({ queryKey: ['employment-types-master'] });
    },
  });
}

export function useUpdateEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_employment_types_master']['Update'] }) => {
      const { data, error } = await supabase
        .from('ic_employment_types_master')
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
      queryClient.invalidateQueries({ queryKey: ['employment-types-master'] });
    },
  });
}
