import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';

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

      const [shiftsRes, eventsRes, leaveRes] = await Promise.all([
        supabase
          .from('ic_staff_shifts')
          .select(`
            id, 
            start_date, 
            start_time, 
            end_time, 
            shift_template, 
            house:ic_houses(house_name),
            participants:ic_shift_participants(
              participant:ic_participants(id, participant_name)
            )
          `)
          .eq('staff_id', staffId)
          .order('start_date', { ascending: false }),
        supabase
          .from('ic_house_calendar_events')
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
          .order('event_date', { ascending: false }),
        supabase
          .from('ic_leave_requests')
          .select(`
            id,
            start_date,
            end_date,
            status,
            reason,
            leave_type:ic_leave_types(leave_type_name)
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
        .from('ic_timesheets')
        .select('shift_id')
        .in('shift_id', shiftIds.length > 0 ? shiftIds : ['00000000-0000-0000-0000-000000000000']);

      if (tsError) {
        console.error('Error fetching timesheets:', tsError);
      }

      const timesheetedIds = new Set((timesheetData || []).map((t) => t.shift_id));
      
      const shifts = shiftsData.map((s) => ({
        ...s,
        entry_type: 'shift' as const,
        house: (Array.isArray(s.house) ? s.house[0] : s.house) as { house_name: string } | null,
        has_timesheet: timesheetedIds.has(s.id),
        participants: (s.participants || [])?.map((p: any) => {
          const part = p.participant;
          const actualPart = Array.isArray(part) ? part[0] : part;
          
          return {
            id: actualPart?.id || p.id || p.participant_id,
            participant_name: actualPart?.participant_name || p.participant_name
          };
        }).filter((p: any) => p.id && p.participant_name) || []
      }));

      const events = eventsData.map((e) => ({
        id: e.id,
        start_date: e.event_date,
        start_time: e.start_time,
        end_time: e.end_time,
        entry_type: 'event' as const,
        title: e.title,
        location: e.location,
        type_name: (Array.isArray(e.type) ? e.type[0] : e.type)?.event_type_name || 'Meeting',
        type_color: (Array.isArray(e.type) ? e.type[0] : e.type)?.color || 'blue',
        house: (Array.isArray(e.house) ? e.house[0] : e.house) as { house_name: string } | null,
        has_timesheet: false,
      }));

      const leaves = leaveData.map((l) => ({
        id: l.id,
        start_date: l.start_date,
        end_date: l.end_date,
        start_time: '00:00:00',
        end_time: '23:59:59',
        entry_type: 'leave' as const,
        title: (Array.isArray(l.leave_type) ? l.leave_type[0] : l.leave_type)?.leave_type_name || 'Leave',
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
      }) as unknown as RosterEntry[];
    },
    enabled: !!staffId,
    staleTime: 0, // Real-time RLS enforcement
  });
}
