import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { rosterApi } from '@/api/roster.api';

export interface StaffShift {
  id: string;
  staff_id: string;
  house_id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  house?: {
    id: string;
    name: string;
  };
}

export function useCurrentStaffShift(staffId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CURRENT_SHIFT, staffId],
    queryFn: async () => {
      if (!staffId) return null;
      const data = await rosterApi.getCurrentShift(staffId);
      return data as unknown as StaffShift;
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

