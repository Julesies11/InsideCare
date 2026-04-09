import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';

export function useStaffDashboardData(staffId?: string) {
  return useQuery({
    queryKey: ['staff-dashboard-data', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const today = format(new Date(), 'yyyy-MM-dd');

      const lastWeek = subDays(new Date(), 7).toISOString();

      const [shiftsRes, eventsRes, leaveRes, timesheetsRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select(`
            id, 
            start_date, 
            start_time, 
            end_time, 
            house:houses(id, name),
            assigned_checklists:shift_assigned_checklists(
              checklist_id,
              submissions:house_checklist_submissions!house_checklist_submissions_checklist_id_fkey(id, status, shift_id)
            )
          `)
          .eq('staff_id', staffId)
          .gte('start_date', today)
          .order('start_date', { ascending: true })
          .limit(5),
        supabase
          .from('house_calendar_events')
          .select(`
            id,
            title,
            event_date,
            start_time,
            end_time,
            location,
            type:house_calendar_event_types_master(name, color),
            house:houses(name),
            staff_assignments:house_calendar_event_staff!inner(staff_id)
          `)
          .eq('house_calendar_event_staff.staff_id', staffId)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5),
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

      const shifts = (shiftsRes.data as any[]) || [];
      const events = (eventsRes.data as any[]) || [];

      const upcomingShifts = shifts.map(shift => {
        const checklists = shift.assigned_checklists || [];
        const total = checklists.length;
        const completed = checklists.filter((cl: any) => 
          cl.submissions?.some((s: any) => s.shift_id === shift.id && s.status === 'completed')
        ).length;

        return {
          ...shift,
          entry_type: 'shift' as const,
          checklist_stats: {
            total,
            completed,
            all_done: total > 0 && total === completed
          }
        };
      });

      const upcomingEvents = events.map(event => ({
        ...event,
        entry_type: 'event' as const,
        start_date: event.event_date,
        type_name: event.type?.name || 'Meeting',
        type_color: event.type?.color || 'blue',
      }));

      // Combine and sort
      const upcomingSchedule = [...upcomingShifts, ...upcomingEvents].sort((a, b) => {
        const dateCompare = a.start_date.localeCompare(b.start_date);
        if (dateCompare !== 0) return dateCompare;
        return (a.start_time || '').localeCompare(b.start_time || '');
      }).slice(0, 5);

      return {
        upcomingSchedule,
        pendingLeave: (leaveRes.data as any[]) || [],
        pendingTimesheets: (timesheetsRes.data as any[]) || [],
      };
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
