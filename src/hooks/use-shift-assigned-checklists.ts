import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ShiftAssignedChecklist {
  id: string;
  house_id: string;
  checklist_id: string;
  shift_template_id: string;
  assignment_title: string;
  sort_order: number;
}

export function useShiftAssignedChecklists(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['shift-assigned-checklists', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('shift_assigned_checklists')
        .select('*')
        .eq('house_id', houseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ShiftAssignedChecklist[];
    },
    enabled: !!houseId,
  });

  const syncAssignments = useMutation({
    mutationFn: async (newAssignments: Partial<ShiftAssignedChecklist>[]) => {
      if (!houseId) throw new Error('House ID is required');

      // 1. Delete existing for this house
      const { error: deleteError } = await supabase
        .from('shift_assigned_checklists')
        .delete()
        .eq('house_id', houseId);

      if (deleteError) throw deleteError;

      // 2. Insert new batch
      if (newAssignments.length > 0) {
        // Clean the objects to only include what we want to save
        const toInsert = newAssignments.map((a, index) => ({
          house_id: houseId,
          checklist_id: a.checklist_id,
          shift_template_id: a.shift_template_id,
          assignment_title: a.assignment_title || 'Routine',
          sort_order: a.sort_order ?? index
        }));

        const { error: insertError } = await supabase
          .from('shift_assigned_checklists')
          .insert(toInsert);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assigned-checklists', houseId] });
      toast.success('Shift routines updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to sync shift routines: ${error.message}`);
    }
  });

  return {
    ...query,
    assignments: query.data || [],
    syncAssignments
  };
}
