import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface HouseShiftType {
  id: string;
  house_id: string;
  name: string;
  short_name?: string;
  icon_name?: string;
  color_theme?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHouseShiftTypes(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['house-shift-types', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('house_shift_types')
        .select('*')
        .eq('house_id', houseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as HouseShiftType[];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const createShiftType = useMutation({
    mutationFn: async (shiftType: Partial<HouseShiftType>) => {
      const { data, error } = await supabase
        .from('house_shift_types')
        .insert({ ...shiftType, house_id: houseId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-types', houseId] });
      toast.success('Shift type created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create shift type: ${error.message}`);
    }
  });

  const updateShiftType = useMutation({
    mutationFn: async (shiftType: Partial<HouseShiftType> & { id: string }) => {
      const { data, error } = await supabase
        .from('house_shift_types')
        .update(shiftType)
        .eq('id', shiftType.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-types', houseId] });
      toast.success('Shift type updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update shift type: ${error.message}`);
    }
  });

  const deleteShiftType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('house_shift_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-types', houseId] });
      toast.success('Shift type deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete shift type: ${error.message}`);
    }
  });

  return {
    ...query,
    shiftTypes: query.data || [],
    createShiftType,
    updateShiftType,
    deleteShiftType
  };
}
