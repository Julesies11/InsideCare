import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RosterShift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  house: { name: string } | null;
  has_timesheet?: boolean;
}

export function useStaffRoster(staffId?: string) {
  return useQuery({
    queryKey: ['staff-roster', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data: shiftsData, error } = await supabase
        .from('staff_shifts')
        .select('id, shift_date, start_time, end_time, shift_type, status, house:houses(name)')
        .eq('staff_id', staffId)
        .order('shift_date', { ascending: false });

      if (error) throw error;
      if (!shiftsData) return [];

      const shiftIds = shiftsData.map((s) => s.id);
      
      // Fetch timesheets for these shifts to see which ones have been submitted
      const { data: timesheetData, error: tsError } = await supabase
        .from('timesheets')
        .select('shift_id')
        .in('shift_id', shiftIds.length > 0 ? shiftIds : ['00000000-0000-0000-0000-000000000000']);

      if (tsError) {
        console.error('Error fetching timesheets:', tsError);
      }

      const timesheetedIds = new Set((timesheetData || []).map((t) => t.shift_id));
      
      return shiftsData.map((s) => ({
        ...s,
        house: s.house as { name: string } | null,
        has_timesheet: timesheetedIds.has(s.id),
      })) as RosterShift[];
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5,
  });
}
