import { useQuery } from '@tanstack/react-query';
import { staffDetailsApi } from '@/api/staff-details.api';
import { QUERY_KEYS } from '@/config/query-keys';

export function useStaffHouseAssignments(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_STAFF_ASSIGNMENTS, 'by-staff', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return await staffDetailsApi.houses.listAssignments(staffId);
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    ...query,
    assignments: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
