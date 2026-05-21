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

      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const yesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');
      const nowTime = format(now, 'HH:mm:ss');

      // 1. First try to find an ACTIVE shift (now is between start and end)
      // This handles overnight shifts (start_date=yesterday, end_date=today)
      const { data: activeShifts, error: activeError } = await supabase
        .from('ic_staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, name)')
        .eq('staff_id', staffId)
        .gte('end_date', today)
        .lte('start_date', today);

      if (!activeError && activeShifts && activeShifts.length > 0) {
        // Filter in memory for precise time check because cross-date time comparison is tricky in SQL
        const active = activeShifts.find(s => {
          const shiftStart = new Date(`${s.start_date}T${s.start_time}`);
          const shiftEnd = new Date(`${s.end_date}T${s.end_time}`);
          
          // If end time is earlier than start time on same date, it's definitely overnight
          if (shiftEnd < shiftStart) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
          
          return now >= shiftStart && now <= shiftEnd;
        });
        
        if (active) return active as unknown as StaffShift;
      }

      // 2. If no active shift, find the NEXT shift for today
      const { data: nextShift, error: nextError } = await supabase
        .from('ic_staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, name)')
        .eq('staff_id', staffId)
        .eq('start_date', today)
        .gt('start_time', nowTime)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextError && nextShift) return nextShift as unknown as StaffShift;

      // 3. If still nothing, check for the most RECENT shift today (in case they just finished)
      const { data: pastShift } = await supabase
        .from('ic_staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, name)')
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
