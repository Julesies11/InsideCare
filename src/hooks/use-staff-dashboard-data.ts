import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/api/staff.api';
import { QUERY_KEYS } from '@/config/query-keys';

export function useStaffDashboardData(staffId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_DASHBOARD, staffId],
    queryFn: async () => {
      if (!staffId) return null;
      return await staffApi.getDashboardData(staffId);
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
