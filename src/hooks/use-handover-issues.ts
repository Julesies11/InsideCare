import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';

export function useHandoverIssues(houseIds: string[]) {
  return useQuery({
    queryKey: ['handover-issues', houseIds],
    queryFn: async () => {
      if (houseIds.length === 0) return [];

      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('ic_house_checklist_submissions')
        .select(`
          id, status, scheduled_date, house_id,
          houses:ic_houses(house_name),
          house_checklists:ic_house_checklists(house_checklist_name),
         ic_house_checklist_submission_items:ic_house_checklist_submission_items(id, is_completed, house_checklist_items:ic_house_checklist_items(title, is_required))
        `)
        .in('house_id', houseIds)
        .eq('scheduled_date', yesterday);

      if (error) throw error;

      return (data || []).filter(sub => {
        if (sub.status === 'in_progress') return true;
        const items = (sub.ic_house_checklist_submission_items as any[]) || [];
        return items.some(item => !item.is_completed && item.house_checklist_items?.is_required);
      });
    },
    enabled: houseIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
