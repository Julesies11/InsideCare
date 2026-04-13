import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RosterEntry {
  id: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  entry_type: 'shift' | 'event' | 'leave';
  title?: string;
  shift_template?: string;
  type_name?: string;
  type_color?: string;
  house: { name: string } | null;
  has_timesheet?: boolean;
  location?: string;
  participants?: Array<{ id: string; name: string }>;
  status?: string;
  reason?: string | null;
}

export function useStaffRoster(staffId?: string) {
  return useQuery({
    queryKey: ['staff-roster', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const [shiftsRes, eventsRes, leaveRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select(`
            id, 
            start_date, 
            start_time, 
            end_time, 
            shift_template, 
            house:houses(name),
            participants:shift_participants(
              participant:participants(id, name)
            )
          `)
          .eq('staff_id', staffId)
          .order('start_date', { ascending: false }),
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
          .order('event_date', { ascending: false }),
        supabase
          .from('leave_requests')
          .select(`
            id,
            start_date,
            end_date,
            status,
            reason,
            leave_type:leave_types(name)
          `)
          .eq('staff_id', staffId)
          .neq('status', 'rejected')
          .order('start_date', { ascending: false })
      ]);

      if (shiftsRes.error) throw shiftsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (leaveRes.error) throw leaveRes.error;

      const shiftsData = shiftsRes.data || [];
      const eventsData = eventsRes.data || [];
      const leaveData = leaveRes.data || [];

      const shiftIds = shiftsData.map((s) => s.id);
      
      // Fetch timesheets for these shifts
      const { data: timesheetData, error: tsError } = await supabase
        .from('timesheets')
        .select('shift_id')
        .in('shift_id', shiftIds.length > 0 ? shiftIds : ['00000000-0000-0000-0000-000000000000']);

      if (tsError) {
        console.error('Error fetching timesheets:', tsError);
      }

      const timesheetedIds = new Set((timesheetData || []).map((t) => t.shift_id));
      
      const shifts = shiftsData.map((s) => ({
        ...s,
        entry_type: 'shift' as const,
        house: s.house as { name: string } | null,
        has_timesheet: timesheetedIds.has(s.id),
        participants: s.participants?.map((p: any) => ({
          id: p.participant?.id,
          name: p.participant?.name
        })).filter((p: any) => p.id && p.name) || []
      }));

      const events = eventsData.map((e) => ({
        id: e.id,
        start_date: e.event_date,
        start_time: e.start_time,
        end_time: e.end_time,
        entry_type: 'event' as const,
        title: e.title,
        location: e.location,
        type_name: e.type?.name || 'Meeting',
        type_color: e.type?.color || 'blue',
        house: e.house as { name: string } | null,
        has_timesheet: false,
      }));

      const leaves = leaveData.map((l) => ({
        id: l.id,
        start_date: l.start_date,
        end_date: l.end_date,
        start_time: '00:00:00',
        end_time: '23:59:59',
        entry_type: 'leave' as const,
        title: l.leave_type?.name || 'Leave',
        reason: l.reason,
        status: l.status,
        house: null,
        has_timesheet: false,
      }));

      // Combine and sort by date descending
      return [...shifts, ...events, ...leaves].sort((a, b) => {
        const dateCompare = b.start_date.localeCompare(a.start_date);
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
      }) as RosterEntry[];
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5,
  });
}
