import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ShiftTemplateChecklist {
  checklist_id: string;
  checklist?: {
    id: string;
    name: string;
    description: string;
  };
}

export interface ShiftTemplate {
  id: string;
  house_id: string;
  day_of_week: string;
  shift_type_id: string;
  start_time: string;
  end_time: string;
  shift_type?: {
    name: string;
    color_theme: string;
  };
  checklists?: ShiftTemplateChecklist[];
}

export function useHouseShiftTemplates(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['house-shift-templates', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('house_shift_templates')
        .select(`
          *,
          shift_type:house_shift_types(name, color_theme),
          checklists:shift_template_checklists(
            checklist_id,
            checklist:house_checklists(id, name, description)
          )
        `)
        .eq('house_id', houseId)
        .order('day_of_week');

      if (error) throw error;
      return data as ShiftTemplate[];
    },
    enabled: !!houseId,
  });

  const addTemplate = useMutation({
    mutationFn: async (entry: Partial<ShiftTemplate> & { checklist_ids?: string[] }) => {
      const { checklist_ids, ...templateData } = entry;
      const { data, error } = await supabase
        .from('house_shift_templates')
        .insert({ ...templateData, house_id: houseId })
        .select()
        .single();
      if (error) throw error;
      
      if (checklist_ids && checklist_ids.length > 0) {
        const toInsert = checklist_ids.map(cId => ({
          shift_template_id: data.id,
          checklist_id: cId
        }));
        const { error: clError } = await supabase
          .from('shift_template_checklists')
          .insert(toInsert);
        if (clError) throw clError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('house_shift_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
    }
  });

  const assignChecklistsToTemplate = useMutation({
    mutationFn: async ({ templateId, checklistIds }: { templateId: string, checklistIds: string[] }) => {
      // Clear existing
      await supabase.from('shift_template_checklists').delete().eq('shift_template_id', templateId);
      
      if (checklistIds.length > 0) {
        const toInsert = checklistIds.map(cId => ({
          shift_template_id: templateId,
          checklist_id: cId
        }));
        const { error } = await supabase.from('shift_template_checklists').insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
    }
  });

  const importTemplates = useMutation({
    mutationFn: async (sourceHouseId: string) => {
      if (!houseId) throw new Error('Target House ID required');

      // 1. Get source templates
      const { data: sourceData, error: fetchError } = await supabase
        .from('house_shift_templates')
        .select('*, checklists:shift_template_checklists(checklist_id)')
        .eq('house_id', sourceHouseId);
      
      if (fetchError) throw fetchError;

      // 2. Map shift types by name
      const { data: sourceShifts } = await supabase.from('house_shift_types').select('*').eq('house_id', sourceHouseId);
      const { data: targetShifts } = await supabase.from('house_shift_types').select('*').eq('house_id', houseId);

      // We also need to map checklists by name if possible, or just copy them. But checklists might have different IDs per house? 
      // Actually, checklists belong to a house. So we can't just copy the checklist_id if it belongs to the source house.
      // Wait, house checklists ARE house specific. So we need to match by master_id or name.
      // For now, let's just copy the template. 
      // A full copy including checklists might require mapping house checklists.
      const { data: sourceChecklists } = await supabase.from('house_checklists').select('*').eq('house_id', sourceHouseId);
      const { data: targetChecklists } = await supabase.from('house_checklists').select('*').eq('house_id', houseId);

      for (const entry of sourceData || []) {
        const sourceShift = sourceShifts?.find(s => s.id === entry.shift_type_id);
        const targetShift = targetShifts?.find(s => s.name === sourceShift?.name);
        
        if (!targetShift) continue;

        const { data: newTemplate, error: insertError } = await supabase
          .from('house_shift_templates')
          .insert({
            house_id: houseId,
            day_of_week: entry.day_of_week,
            shift_type_id: targetShift.id,
            start_time: entry.start_time,
            end_time: entry.end_time
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        // Match checklists by name
        if (entry.checklists && entry.checklists.length > 0) {
           const cIdsToInsert: string[] = [];
           for (const clLink of entry.checklists) {
               const sourceCl = sourceChecklists?.find(c => c.id === clLink.checklist_id);
               const targetCl = targetChecklists?.find(c => c.name === sourceCl?.name);
               if (targetCl) {
                   cIdsToInsert.push(targetCl.id);
               }
           }
           
           if (cIdsToInsert.length > 0) {
               await supabase.from('shift_template_checklists').insert(
                   cIdsToInsert.map(cId => ({ shift_template_id: newTemplate.id, checklist_id: cId }))
               );
           }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-shift-templates', houseId] });
      toast.success('Shift templates imported successfully');
    }
  });

  return {
    ...query,
    templates: query.data || [],
    addTemplate,
    deleteTemplate,
    assignChecklistsToTemplate,
    importTemplates
  };
}
