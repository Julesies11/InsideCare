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
    photo_url?: string;
    role?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

const HOUSE_STAFF_ASSIGNMENT_COLUMNS = `
  id, house_id, staff_id, is_primary, start_date, end_date, notes, created_at, updated_at,
  staff:staff(id, name, email, phone, status, role_id, photo_url, role:roles!staff_role_id_fkey(id, name, description))
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

      // Format joined data to ensure objects instead of arrays where expected
      const formatted = (data || []).map((assignment: any) => {
        if (assignment.staff) {
          return {
            ...assignment,
            staff: {
              ...assignment.staff,
              role: Array.isArray(assignment.staff.role) ? assignment.staff.role[0] : assignment.staff.role
            }
          };
        }
        return assignment;
      });

      return formatted as HouseStaffAssignment[];
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
