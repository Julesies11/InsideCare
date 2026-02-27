import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChecklistMasterItem {
  id: string;
  master_id: string;
  title: string;
  instructions?: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
}

export interface ChecklistMaster {
  id: string;
  name: string;
  frequency: string;
  description?: string;
  items?: ChecklistMasterItem[];
}

export function useChecklistMaster() {
  const [masterChecklists, setMasterChecklists] = useState<ChecklistMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMasterChecklists = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('checklist_master')
        .select(`
          *,
          checklist_item_master (*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const checklistsWithSortedItems = (data || []).map(checklist => ({
        ...checklist,
        items: (checklist.checklist_item_master || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
      }));

      setMasterChecklists(checklistsWithSortedItems);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch master checklists';
      console.error('Error fetching master checklists:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterChecklists();
  }, [fetchMasterChecklists]);

  return {
    masterChecklists,
    loading,
    error,
    refresh: fetchMasterChecklists,
  };
}
