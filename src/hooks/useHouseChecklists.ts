import { useState, useEffect } from 'react';
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
}

export function useHouseChecklists(houseId?: string) {
  const [houseChecklists, setHouseChecklists] = useState<HouseChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      setHouseChecklists([]);
      setLoading(false);
      return;
    }

    const fetchHouseChecklists = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_checklists')
          .select(`
            *,
            house_checklist_items (
              id,
              title,
              instructions,
              priority,
              is_required,
              sort_order,
              created_at,
              updated_at
            )
          `)
          .eq('house_id', houseId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Sort items within each checklist
        const checklistsWithSortedItems = (data || []).map(checklist => ({
          ...checklist,
          items: (checklist.house_checklist_items || []).sort((a, b) => a.sort_order - b.sort_order)
        }));

        setHouseChecklists(checklistsWithSortedItems);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house checklists';
        console.error('Error fetching house checklists:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseChecklists();
  }, [houseId]);

  return {
    houseChecklists,
    loading,
    error,
  };
}
