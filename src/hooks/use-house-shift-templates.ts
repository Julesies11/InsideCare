import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface HouseShiftTemplate {
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

export interface ShiftTemplateDefaultChecklist {
  shift_template_id: string;
  checklist_id: string;
  checklist?: {
    id: string;
    name: string;
    description: string;
    items?: Array<{ id: string; title: string; sort_order: number }>;
  };
}

export function useHouseShiftTemplates(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['house-shift-templates', houseId],
    queryFn: async () => {
      if (!houseId) return { types: [], defaults: [] };
      
      const [typesRes, defaultsRes] = await Promise.all([
        supabase
          .from('house_shift_templates')
          .select('*')
          .eq('house_id', houseId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('shift_template_default_checklists')
          .select('*, checklist:house_checklists(id, name, description, items:house_checklist_items(id, title, sort_order))')
          .in('shift_template_id', (await supabase.from('house_shift_templates').select('id').eq('house_id', houseId)).data?.map(t => t.id) || [])
      ]);

      if (typesRes.error) throw typesRes.error;
      if (defaultsRes.error) throw defaultsRes.error;

      return {
        types: typesRes.data as HouseShiftTemplate[],
        defaults: defaultsRes.data as ShiftTemplateDefaultChecklist[]
      };
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const createShiftTemplate = useMutation({
    mutationFn: async (shiftTemplate: Partial<HouseShiftTemplate> & { default_checklists?: string[] }) => {
      const { default_checklists, ...typeData } = shiftTemplate;
      const { data, error } = await supabase
        .from('house_shift_templates')
        .insert({ ...typeData, house_id: houseId })
        .select()
        .single();

      if (error) throw error;

      if (default_checklists && default_checklists.length > 0) {
        const links = default_checklists.map(clId => ({
          shift_template_id: data.id,
          checklist_id: clId
        }));
        await supabase.from('shift_template_default_checklists').insert(links);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
      toast.success('Shift template created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create shift template: ${error.message}`);
    }
  });

  const updateShiftTemplate = useMutation({
    mutationFn: async (shiftTemplate: Partial<HouseShiftTemplate> & { id: string, default_checklists?: string[] }) => {
      const { default_checklists, ...typeData } = shiftTemplate;
      const { data, error } = await supabase
        .from('house_shift_templates')
        .update(typeData)
        .eq('id', typeData.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (default_checklists) {
        await supabase.from('shift_template_default_checklists').delete().eq('shift_template_id', typeData.id);
        if (default_checklists.length > 0) {
          const links = default_checklists.map(clId => ({
            shift_template_id: typeData.id,
            checklist_id: clId
          }));
          await supabase.from('shift_template_default_checklists').insert(links);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
      toast.success('Shift template updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update shift template: ${error.message}`);
    }
  });

  const deleteShiftTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('house_shift_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
      toast.success('Shift template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete shift template: ${error.message}`);
    }
  });

  return useMemo(() => ({
    ...query,
    shiftTemplates: query.data?.types || [],
    defaults: query.data?.defaults || [],
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate
  }), [query, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate]);
}
