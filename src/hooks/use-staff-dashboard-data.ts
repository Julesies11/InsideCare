import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subDays } from 'date-fns';

export function useStaffDashboardData(staffId?: string) {
  return useQuery({
    queryKey: ['staff-dashboard-data', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const today = new Date().toISOString().split('T')[0];

      const lastWeek = subDays(new Date(), 7).toISOString();

      const [shiftsRes, leaveRes, timesheetsRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select('id, start_date, start_time, end_time, house:houses(id, name)')
          .eq('staff_id', staffId)
          .gte('start_date', today)
          .order('start_date', { ascending: true })
          .limit(3),
        supabase
          .from('leave_requests')
          .select('id, leave_type:leave_types(name), start_date, end_date, status, updated_at')
          .eq('staff_id', staffId)
          .or(`status.eq.pending,and(status.eq.approved,updated_at.gte.${lastWeek})`)
          .order('start_date', { ascending: true })
          .limit(3),
        supabase
          .from('timesheets')
          .select('id, status, clock_in, shift:staff_shifts(start_date)')
          .eq('staff_id', staffId)
          .in('status', ['draft', 'pending'])
          .order('clock_in', { ascending: false })
          .limit(5),
      ]);

      return {
        upcomingShifts: (shiftsRes.data as any[]) || [],
        pendingLeave: (leaveRes.data as any[]) || [],
        pendingTimesheets: (timesheetsRes.data as any[]) || [],
      };
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
