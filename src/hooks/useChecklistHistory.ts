import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChecklistSubmission {
  id: string;
  checklist_id: string;
  house_id: string;
  submitted_by?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  checklist_name?: string;
  staff_name?: string;
  item_count?: number;
  completed_item_count?: number;
}

export function useChecklistHistory(houseId?: string) {
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!houseId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch submissions joined with checklist and staff details
      const { data, error: subError } = await supabase
        .from('house_checklist_submissions')
        .select(`
          *,
          house_checklists (name),
          staff (name),
          house_checklist_submission_items (is_completed)
        `)
        .eq('house_id', houseId)
        .order('updated_at', { ascending: false });

      if (subError) throw subError;

      const formattedData: ChecklistSubmission[] = (data || []).map(sub => ({
        ...sub,
        checklist_name: (sub.house_checklists as any)?.name || 'Deleted Checklist',
        staff_name: (sub.staff as any)?.name || 'Unknown Staff',
        item_count: sub.house_checklist_submission_items?.length || 0,
        completed_item_count: sub.house_checklist_submission_items?.filter((i: any) => i.is_completed).length || 0
      }));

      setSubmissions(formattedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch checklist history';
      console.error('Error fetching checklist history:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    submissions,
    loading,
    error,
    refresh: fetchHistory
  };
}
