import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EmploymentType {
  id: string;
  employment_type_name: string;
  description?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const EMPLOYMENT_TYPE_COLUMNS = 'id, employment_type_name, description, status, created_at, updated_at';

export function useEmploymentTypesMaster() {
  return useQuery({
    queryKey: ['employment-types-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ic_employment_types_master')
        .select(EMPLOYMENT_TYPE_COLUMNS)
        .order('employment_type_name', { ascending: true });

      if (error) throw error;
      return data as EmploymentType[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employmentTypeData: Omit<EmploymentType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ic_employment_types_master')
        .insert([employmentTypeData])
        .select(EMPLOYMENT_TYPE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(`You do not have permission to ${updates ? 'edit' : 'add'} this employment type, or it does not exist.`);
      }
      return data as EmploymentType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-types-master'] });
    },
  });
}

export function useUpdateEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmploymentType> }) => {
      const { data, error } = await supabase
        .from('ic_employment_types_master')
        .update(updates)
        .eq('id', id)
        .select(EMPLOYMENT_TYPE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data as EmploymentType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-types-master'] });
    },
  });
}
