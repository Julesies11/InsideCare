import { useQuery } from '@tanstack/react-query';
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
    phone?: string;
    status?: string;
    role_id?: string;
    role?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

const HOUSE_STAFF_ASSIGNMENT_COLUMNS = `
  id, house_id, staff_id, is_primary, start_date, end_date, notes, created_at, updated_at,
  staff:staff(id, name, email, phone, status, role_id, role:roles!staff_role_id_fkey(id, name, description))
`;

export function useHouseStaffAssignments(houseId?: string) {
  const query = useQuery({
    queryKey: ['house-staff-assignments', { houseId }],
    queryFn: async () => {
      let query = supabase
        .from('house_staff_assignments')
        .select(HOUSE_STAFF_ASSIGNMENT_COLUMNS)
        .order('created_at', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HouseStaffAssignment[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    assignments: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
