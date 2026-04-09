import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseCalendarEventType {
  id: string;
  name: string;
  description: string | null;
  status: 'Active' | 'Inactive';
  color: string;
}

export interface HouseCalendarEventAttachment {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface HouseCalendarEvent {
  id: string;
  house_id: string;
  title: string;
  type: string;
  event_type_id?: string | null;
  event_type_info?: HouseCalendarEventType;
  attachments?: HouseCalendarEventAttachment[];
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  participant_ids?: string[];
  assigned_staff_ids?: string[];
  status: string;
  location?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relationship data from junction tables
  event_participants?: Array<{ participant: { id: string; name: string } }>;
  event_staff?: Array<{ staff: { id: string; name: string } }>;
  // Checklist-specific fields
  is_checklist_event?: boolean;
  house_checklist_id?: string;
  checklist_schedule_id?: string;
  shift_template?: string;
  shift_template_id?: string;
  type_details?: {
    color_theme?: string;
    icon_name?: string;
  };
  assigned_checklists?: any[];
  submissions?: Array<{
    id: string;
    status: string;
    completed_at: string | null;
  }>;
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
}

export function useHouseCalendarEvents(houseId?: string, staffId?: string) {
  const [houseCalendarEvents, setHouseCalendarEvents] = useState<HouseCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseCalendarEvents = async () => {
    if (!houseId) {
      setHouseCalendarEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch regular calendar events including junction data
      const { data: events, error: eventError } = await supabase
        .from('house_calendar_events')
        .select(`
          id,
          house_id,
          title,
          event_type_id,
          description,
          event_date,
          start_time,
          end_time,
          status,
          location,
          created_by,
          created_at,
          updated_at,
          is_checklist_event,
          house_checklist_id,
          checklist_schedule_id,
          event_type_info:house_calendar_event_types_master(*),
          attachments:house_calendar_event_attachments(*),
          creator:staff!created_by(id, name, email),
          submissions:house_checklist_submissions(
            id, 
            status, 
            completed_at,
            house_checklist_submission_items(
              id,
              item_id,
              status,
              is_completed,
              note,
              completed_by_staff:staff!completed_by(id, name)
            )
          ),
          event_participants:house_calendar_event_participants(participant:participants(id, name)),
          event_staff:house_calendar_event_staff(staff:staff(id, name))
        `)
        .eq('house_id', houseId)
        .order('event_date', { ascending: true });

      if (eventError) throw eventError;

      const combinedEvents = (events || []).map((e: any) => ({
        ...e,
        type: e.is_checklist_event ? 'checklist' : 'event'
      }));

      // 2. Fetch shifts at this house (+/- 60 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      let shiftQuery = supabase
        .from('staff_shifts')
        .select(`
          id, 
          start_date,
          start_time,
          end_time,
          staff_id,
          shift_template,
          shift_template_id,
          type_details:house_shift_templates(color_theme, icon_name),
          staff:staff(id, name),
          assigned_checklists:shift_assigned_checklists(
            id, 
            checklist_id, 
            assignment_title,
            submissions:house_checklist_submissions(id, status, completed_at)
          )
        `)
        .eq('house_id', houseId)
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0]);

      if (staffId) {
        shiftQuery = shiftQuery.eq('staff_id', staffId);
      }

      const { data: shifts } = await shiftQuery;

      if (shifts) {
        for (const shift of shifts) {
          // A. Add the shift itself as a calendar entry
          combinedEvents.push({
            id: `shift-${shift.id}`,
            house_id: houseId,
            title: `${shift.shift_template || 'Shift'} - ${shift.staff?.name || 'Unassigned'}`,
            type: 'shift',
            shift_template: shift.shift_template,
            shift_template_id: shift.shift_template_id,
            type_details: shift.type_details,
            event_date: shift.start_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            event_staff: shift.staff ? [{ staff: shift.staff }] : [],
            assigned_checklists: shift.assigned_checklists,
            status: 'scheduled'
          } as any);

          // Shift-assigned checklists are rendered inside the Shift component itself
          // We no longer duplicate them as standalone calendar events.
        }
      }

      setHouseCalendarEvents(combinedEvents);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house calendar events';
      console.error('Error fetching house calendar events:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseCalendarEvents();
  }, [houseId, staffId]);

  return {
    houseCalendarEvents,
    loading,
    error,
    refresh: fetchHouseCalendarEvents
  };
}
