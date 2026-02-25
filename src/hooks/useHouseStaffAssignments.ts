import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseStaffAssignment {
  id: string;
  house_id: string;
  staff_id: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    id: string;
    name: string;
    email?: string;
    status?: string;
  };
}

export function useHouseStaffAssignments() {
  const [houseStaffAssignments, setHouseStaffAssignments] = useState<HouseStaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHouseStaffAssignments = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_staff_assignments')
          .select(`
            *,
            staff:staff(id, name, email, status)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setHouseStaffAssignments(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house staff assignments';
        console.error('Error fetching house staff assignments:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseStaffAssignments();
  }, []);

  return {
    houseStaffAssignments,
    loading,
    error,
  };
}
