import { useMemo } from 'react';
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
  default_start_time?: string;
  default_end_time?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftTypeDefaultChecklist {
  shift_type_id: string;
  checklist_id: string;
  checklist?: {
    id: string;
    name: string;
    description: string;
  };
}

export function useHouseShiftTypes(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['house-shift-types', houseId],
    queryFn: async () => {
      if (!houseId) return { types: [], defaults: [] };
      
      const [typesRes, defaultsRes] = await Promise.all([
        supabase
          .from('house_shift_types')
          .select('*')
          .eq('house_id', houseId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('shift_type_default_checklists')
          .select('*, checklist:house_checklists(id, name, description)')
          .in('shift_type_id', (await supabase.from('house_shift_types').select('id').eq('house_id', houseId)).data?.map(t => t.id) || [])
      ]);

      if (typesRes.error) throw typesRes.error;
      if (defaultsRes.error) throw defaultsRes.error;

      return {
        types: typesRes.data as HouseShiftType[],
        defaults: defaultsRes.data as ShiftTypeDefaultChecklist[]
      };
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const createShiftType = useMutation({
    mutationFn: async (shiftType: Partial<HouseShiftType> & { default_checklists?: string[] }) => {
      const { default_checklists, ...typeData } = shiftType;
      const { data, error } = await supabase
        .from('house_shift_types')
        .insert({ ...typeData, house_id: houseId })
        .select()
        .single();

      if (error) throw error;

      if (default_checklists && default_checklists.length > 0) {
        const links = default_checklists.map(clId => ({
          shift_type_id: data.id,
          checklist_id: clId
        }));
        await supabase.from('shift_type_default_checklists').insert(links);
      }

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
    mutationFn: async (shiftType: Partial<HouseShiftType> & { id: string, default_checklists?: string[] }) => {
      const { default_checklists, ...typeData } = shiftType;
      const { data, error } = await supabase
        .from('house_shift_types')
        .update(typeData)
        .eq('id', typeData.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (default_checklists) {
        await supabase.from('shift_type_default_checklists').delete().eq('shift_type_id', typeData.id);
        if (default_checklists.length > 0) {
          const links = default_checklists.map(clId => ({
            shift_type_id: typeData.id,
            checklist_id: clId
          }));
          await supabase.from('shift_type_default_checklists').insert(links);
        }
      }

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

  return useMemo(() => ({
    ...query,
    shiftTypes: query.data?.types || [],
    defaults: query.data?.defaults || [],
    createShiftType,
    updateShiftType,
    deleteShiftType
  }), [query, createShiftType, updateShiftType, deleteShiftType]);
}
