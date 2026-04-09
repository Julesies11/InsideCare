import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

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
    queryKey: ['current-staff-shift', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const nowTime = format(new Date(), 'HH:mm:ss');

      // 1. First try to find an ACTIVE shift (now is between start and end)
      const { data: activeShift, error: activeError } = await supabase
        .from('staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_time, house:houses(id, name)')
        .eq('staff_id', staffId)
        .eq('start_date', today)
        .lte('start_time', nowTime)
        .gte('end_time', nowTime)
        .maybeSingle();

      if (!activeError && activeShift) return activeShift as unknown as StaffShift;

      // 2. If no active shift, find the NEXT shift for today
      const { data: nextShift, error: nextError } = await supabase
        .from('staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_time, house:houses(id, name)')
        .eq('staff_id', staffId)
        .eq('start_date', today)
        .gt('start_time', nowTime)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextError && nextShift) return nextShift as unknown as StaffShift;

      // 3. If still nothing, check for the most RECENT shift today (in case they just finished)
      const { data: pastShift } = await supabase
        .from('staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_time, house:houses(id, name)')
        .eq('staff_id', staffId)
        .eq('start_date', today)
        .lt('end_time', nowTime)
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      return pastShift as unknown as StaffShift;
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
