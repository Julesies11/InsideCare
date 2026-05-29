import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export function useStaffDashboardData(staffId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_DASHBOARD, staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastWeek = subDays(new Date(), 7).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

      const [shiftsRes, eventsRes, leaveRes, timesheetsRes, allTimesheetsRes, pastShiftsRes] = await Promise.all([
        supabase
          .from(TABLES.STAFF_SHIFTS)
          .select(`
            id, 
            start_date, 
            end_date,
            start_time, 
            end_time, 
            shift_template,
            type_details:ic_house_shift_templates(color_theme, icon_name),
            house:ic_houses(id, house_name),
            assigned_checklists:ic_shift_assigned_checklists(
              checklist_id,
              assignment_title,
              submissions:ic_house_checklist_submissions(id, status, shift_id)
            )
          `)
          .eq('staff_id', staffId)
          .gte('end_date', today)
          .order('start_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5),
        supabase
          .from(TABLES.HOUSE_CALENDAR_EVENTS)
          .select(`
            id,
            title,
            event_date,
            start_time,
            end_time,
            location,
            type:ic_house_calendar_event_types_master(event_type_name, color),
            house:ic_houses(house_name),
            staff_assignments:ic_house_calendar_event_staff!inner(staff_id)
          `)
          .eq('staff_assignments.staff_id', staffId)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5),
        supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('id, leave_type:ic_leave_types(leave_type_name), start_date, end_date, status, updated_at')
          .eq('staff_id', staffId)
          .or(`status.eq.pending,and(status.eq.approved,updated_at.gte.${lastWeek})`)
          .order('start_date', { ascending: true })
          .limit(3),
        supabase
          .from(TABLES.TIMESHEETS)
          .select('id, status, clock_in, shift:ic_staff_shifts!timesheets_shift_id_fkey(start_date)')
          .eq('staff_id', staffId)
          .in('status', ['pending'])
          .order('clock_in', { ascending: false })
          .limit(5),
        // All recent timesheet IDs
        supabase
          .from(TABLES.TIMESHEETS)
          .select('shift_id')
          .eq('staff_id', staffId)
          .not('shift_id', 'is', null),
        // Past shifts to cross-reference
        supabase
          .from(TABLES.STAFF_SHIFTS)
          .select('id, end_date, end_time')
          .eq('staff_id', staffId)
          .gte('end_date', thirtyDaysAgo)
          .lt('end_date', today)
      ]);

      const shifts = (shiftsRes.data as any[]) || [];
      const events = (eventsRes.data as any[]) || [];

      // Calculate missing timesheets
      const timesheetedShiftIds = new Set((allTimesheetsRes.data as any[])?.map(ts => ts.shift_id) || []);
      const now = new Date();
      const missingShifts = (pastShiftsRes.data as any[])?.filter(s => {
        if (timesheetedShiftIds.has(s.id)) return false;
        const shiftEnd = new Date(`${s.end_date}T${s.end_time}`);
        return shiftEnd < now;
      }) || [];

      const missingTimesheetsCount = missingShifts.length;

      const upcomingShifts = shifts.map(shift => {
        const checklists = shift.assigned_checklists || [];
        const total = checklists.length;
        const completed = checklists.filter((cl: any) => 
          cl.submissions?.some((s: any) => s.shift_id === shift.id && s.status === 'completed')
        ).length;

        return {
          ...shift,
          entry_type: 'shift' as const,
          type_name: shift.shift_template || 'Shift',
          type_color: shift.type_details?.color_theme || 'blue',
          icon_name: shift.type_details?.icon_name || 'Calendar',
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
        type_name: event.type?.event_type_name || 'Meeting',
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
        missingTimesheetsCount,
        pendingLeave: (leaveRes.data as any[]) || [],
        pendingTimesheets: (timesheetsRes.data as any[]) || [],
      };
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
