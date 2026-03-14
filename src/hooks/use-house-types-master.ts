import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HouseType } from '@/models/house';

const HOUSE_TYPE_COLUMNS = 'id, name, description, status, created_at, updated_at';

export function useHouseTypesMaster() {
  return useQuery({
    queryKey: ['house-types-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_types_master')
        .select(HOUSE_TYPE_COLUMNS)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as HouseType[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (houseTypeData: Omit<HouseType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('house_types_master')
        .insert([houseTypeData])
        .select(HOUSE_TYPE_COLUMNS)
        .single();

      if (error) throw error;
      return data as HouseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-types-master'] });
    },
  });
}

export function useUpdateHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HouseType> }) => {
      const { data, error } = await supabase
        .from('house_types_master')
        .update(updates)
        .eq('id', id)
        .select(HOUSE_TYPE_COLUMNS)
        .single();

      if (error) throw error;
      return data as HouseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-types-master'] });
    },
  });
}
