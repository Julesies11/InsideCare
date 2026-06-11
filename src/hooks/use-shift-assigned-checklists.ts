import { rosterApi } from '@/api/roster.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';

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
    queryKey: [QUERY_KEYS.SHIFT_ASSIGNED_CHECKLISTS, houseId],
    queryFn: async () => {
      if (!houseId) return [];
      return await rosterApi.listShiftAssignments(houseId);
    },
    enabled: !!houseId,
  });

  const syncAssignments = useMutation({
    mutationFn: async (newAssignments: Partial<ShiftAssignedChecklist>[]) => {
      if (!houseId) throw new Error('House ID is required');

      const toInsert = newAssignments.map((a, index) => ({
        house_id: houseId,
        checklist_id: a.checklist_id,
        shift_template_id: a.shift_template_id,
        assignment_title: a.assignment_title || 'Routine',
        sort_order: a.sort_order ?? index,
      }));

      await rosterApi.syncShiftAssignments(houseId, toInsert);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SHIFT_ASSIGNED_CHECKLISTS, houseId],
      });
      toast.success('Shift routines updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to sync shift routines: ${error.message}`);
    },
  });

  return {
    ...query,
    assignments: query.data || [],
    syncAssignments,
  };
}
