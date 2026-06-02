import { useQuery } from '@tanstack/react-query';
import { houseOperationsApi } from '@/api/house-operations.api';
import { QUERY_KEYS } from '@/config/query-keys';

export function useHandoverIssues(houseIds: string[]) {
  return useQuery({
    queryKey: [QUERY_KEYS.HANDOVER_ISSUES, houseIds],
    queryFn: async () => {
      if (houseIds.length === 0) return [];
      return await houseOperationsApi.handover.listHandoverIssues(houseIds);
    },
    enabled: houseIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
