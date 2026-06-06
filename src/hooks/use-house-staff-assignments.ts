import { useQuery } from '@tanstack/react-query';
import { housesApi } from '@/api/houses.api';
import { QUERY_KEYS } from '@/config/query-keys';

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
    staff_name?: string; role_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    separation_date?: string | null;
    role_id?: string;
    photo_url?: string;
    role?: {
      id: string;
      staff_name?: string; role_name?: string;
      description?: string;
    };
  };
}

export function useHouseStaffAssignments(houseId?: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_STAFF_ASSIGNMENTS, { houseId }],
    queryFn: async () => {
      return await housesApi.listStaffAssignments(houseId);
    },
    staleTime: 1000 * 60 * 5,
    // Default: only run when houseId is present; caller can further restrict with enabled: false
    enabled: options?.enabled !== undefined ? options.enabled : !!houseId,
  });

  return {
    ...query,
    assignments: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
