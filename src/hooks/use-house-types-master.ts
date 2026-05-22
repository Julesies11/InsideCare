import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';

export type HouseType = Database['public']['Tables']['ic_house_types_master']['Row'];

export function useHouseTypesMaster() {
  return useQuery({
    queryKey: ['house-types-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ic_house_types_master')
        .select('*')
        .order('house_type_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (houseTypeData: Database['public']['Tables']['ic_house_types_master']['Insert']) => {
      const { data, error } = await supabase
        .from('ic_house_types_master')
        .insert([houseTypeData])
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to add this house type, or it does not exist.');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-types-master'] });
    },
  });
}

export function useUpdateHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_house_types_master']['Update'] }) => {
      const { data, error } = await supabase
        .from('ic_house_types_master')
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this house type, or it does not exist.');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-types-master'] });
    },
  });
}
