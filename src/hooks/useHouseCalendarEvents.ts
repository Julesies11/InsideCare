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
  participant_id?: string;
  assigned_staff_id?: string;
  status: string;
  location?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Checklist-specific fields
  is_checklist_event?: boolean;
  house_checklist_id?: string;
  checklist_schedule_id?: string;
  target_shift?: string;
  shift_type?: string;
  shift_type_id?: string;
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
  participant?: {
    id: string;
    name: string;
    email?: string;
  };
  assigned_staff?: {
    id: string;
    name: string;
    email?: string;
  };
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
      
      // 1. Fetch regular calendar events
      const { data: events, error: eventError } = await supabase
        .from('house_calendar_events')
        .select(`
          *,
          event_type_info:house_calendar_event_types_master(*),
          attachments:house_calendar_event_attachments(*),
          participant:participants(id, name, email),
          assigned_staff:staff!assigned_staff_id(id, name, email),
          creator:staff!created_by(id, name, email),
          submissions:house_checklist_submissions(id, status, completed_at)
        `)
        .eq('house_id', houseId)
        .order('event_date', { ascending: true });

      if (eventError) throw eventError;

      const combinedEvents = [...(events || [])];

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
          shift_type,
          shift_type_id,
          type_details:house_shift_types(color_theme, icon_name),
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
            title: `${shift.shift_type || 'Shift'} - ${shift.staff?.name || 'Unassigned'}`,
            type: 'shift',
            shift_type: shift.shift_type,
            shift_type_id: shift.shift_type_id,
            type_details: shift.type_details,
            event_date: shift.start_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            assigned_staff_id: shift.staff_id,
            assigned_staff: shift.staff,
            assigned_checklists: shift.assigned_checklists,
            status: 'scheduled'
          } as any);

          // B. Add shift-assigned checklists
          for (const ac of (shift.assigned_checklists as any[] || [])) {
            // Unique key per checklist per shift instance
            const syntheticId = `shift-cl-${ac.checklist_id}-${shift.id}`;
            
            // Avoid duplicates if already present as a house-wide event
            if (!combinedEvents.some(e => e.house_checklist_id === ac.checklist_id && e.event_date === shift.start_date)) {
              combinedEvents.push({
                id: syntheticId,
                house_id: houseId,
                title: ac.assignment_title,
                type: 'checklist',
                event_date: shift.start_date,
                is_checklist_event: true,
                house_checklist_id: ac.checklist_id,
                assigned_staff_id: shift.staff_id,
                assigned_staff: shift.staff,
                status: 'scheduled',
                submissions: ac.submissions || []
              } as HouseCalendarEvent);
            }
          }
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
