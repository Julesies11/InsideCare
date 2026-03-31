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

      // Find shift for today where current time is between start and end
      const { data, error } = await supabase
        .from('staff_shifts')
        .select('id, staff_id, house_id, start_date, start_time, end_time, house:houses(id, name)')
        .eq('staff_id', staffId)
        .eq('start_date', today)
        .lte('start_time', nowTime)
        .gte('end_time', nowTime)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current shift:', error);
        return null;
      }

      return data as unknown as StaffShift;
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
