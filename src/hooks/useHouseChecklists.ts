import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  instructions?: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HouseChecklist {
  id: string;
  house_id: string;
  name: string;
  frequency: string;
  description?: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
  items?: HouseChecklistItem[];
  latest_submission?: {
    id: string;
    status: string;
    updated_at: string;
  };
}

export function useHouseChecklists(houseId?: string) {
  const [houseChecklists, setHouseChecklists] = useState<HouseChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseChecklists = useCallback(async () => {
    if (!houseId) {
      setHouseChecklists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch checklists with items
      const { data: checklists, error: clError } = await supabase
        .from('house_checklists')
        .select(`
          *,
          house_checklist_items (*)
        `)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (clError) throw clError;

      // Fetch latest in_progress submissions for these checklists in this house
      const { data: submissions, error: subError } = await supabase
        .from('house_checklist_submissions')
        .select('id, checklist_id, status, updated_at')
        .eq('house_id', houseId)
        .eq('status', 'in_progress');

      if (subError) throw subError;

      // Combine data
      const combined = (checklists || []).map(cl => ({
        ...cl,
        items: (cl.house_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        latest_submission: submissions?.find(s => s.checklist_id === cl.id)
      }));

      setHouseChecklists(combined);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house checklists';
      console.error('Error fetching house checklists:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    fetchHouseChecklists();
  }, [fetchHouseChecklists]);

  return {
    houseChecklists,
    loading,
    error,
    refresh: fetchHouseChecklists
  };
}
