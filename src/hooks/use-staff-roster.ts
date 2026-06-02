import { useQuery } from '@tanstack/react-query';
import { rosterApi } from '@/api/roster.api';

export interface RosterEntry {
  id: string;
  start_date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
  entry_type: 'shift' | 'event' | 'leave';
  title?: string | null;
  shift_template?: string | null;
  type_name?: string | null;
  type_color?: string | null;
  house: { house_name: string } | null;
  has_timesheet?: boolean;
  has_shift_note?: boolean;
  location?: string | null;
  participants?: Array<{ id: string; participant_name: string }>;
  status?: string | null;
  reason?: string | null;
}

export function useStaffRoster(staffId?: string) {
  return useQuery({
    queryKey: ['staff-roster', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return await rosterApi.getStaffRoster(staffId) as unknown as RosterEntry[];
    },
    enabled: !!staffId,
    staleTime: 0, // Real-time RLS enforcement
  });
}

export function useStaffShiftsPaginated(params: {
  staffId?: string;
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  sorting?: Array<{ id: string; desc: boolean }>;
}) {
  const { staffId, pageIndex = 0, pageSize = 50, search, sorting } = params;
  return useQuery({
    queryKey: ['staff-shifts-paginated', staffId, pageIndex, pageSize, search, sorting],
    queryFn: async () => {
      if (!staffId) return { data: [], count: 0 };
      return await rosterApi.listStaffShiftsPaginated({ staffId, pageIndex, pageSize, search, sorting });
    },
    enabled: !!staffId,
    staleTime: 0,
  });
}
