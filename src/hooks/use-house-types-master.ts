import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export type HouseType = Database['public']['Tables']['ic_house_types_master']['Row'];

export function useHouseTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
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
        .from(TABLES.HOUSE_TYPES_MASTER)
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER] });
    },
  });
}

export function useUpdateHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_house_types_master']['Update'] }) => {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER] });
    },
  });
}
