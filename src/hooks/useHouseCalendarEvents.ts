import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

export interface HouseCalendarEventType {
  id: string;
  event_type_name: string;
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
  event_participants?: Array<{ participant: { id: string; participant_name: string } }>;
  event_staff?: Array<{ staff: { id: string; staff_name: string } }>;
  // Checklist-specific fields
  is_checklist_event?: boolean;
  house_checklist_id?: string;
  checklist_schedule_id?: string;
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
    staff_name: string;
    email?: string;
  };
}

export function useHouseCalendarEvents(houseId?: string, staffId?: string, startDate?: string, endDate?: string) {
  const [houseCalendarEvents, setHouseCalendarEvents] = useState<HouseCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseCalendarEvents = async (signal?: AbortSignal): Promise<void> => {
    if (!houseId) {
      setHouseCalendarEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
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
          event_type_info:ic_house_calendar_event_types_master(*),
          attachments:ic_house_calendar_event_attachments(*),
          creator:ic_staff!created_by(id, staff_name, email),
          submissions:ic_house_checklist_submissions(
            id, 
            status, 
            completed_at,
            ic_house_checklist_submission_items:ic_house_checklist_submission_items(
              id,
              item_id,
              status,
              is_completed,
              note,
              completed_by_staff:ic_staff!completed_by(id, staff_name)
            )
          ),
          event_participants:ic_house_calendar_event_participants(participant:ic_participants(id, participant_name)),
          event_staff:ic_house_calendar_event_staff(staff:ic_staff(id, staff_name))
        `)
        .eq('house_id', houseId);
        
      if (startDate) query = query.gte('event_date', startDate);
      if (endDate) query = query.lte('event_date', endDate);
        
      const { data: events, error: eventError } = await query
        .order('event_date', { ascending: true })
        .abortSignal(signal as any);

      if (eventError) {
        if (eventError.code === 'PGRST100') return;
        throw eventError;
      }

      const combinedEvents = (events || []).map((e: any) => {
        let type = 'other';
        if (e.is_checklist_event) {
          type = 'checklist';
        } else if (e.event_type_info?.event_type_name) {
          const name = e.event_type_info.event_type_name.toLowerCase();
          if (name.includes('meeting')) type = 'meeting';
          else if (name.includes('appointment')) type = 'appointment';
          else if (name.includes('clinical')) type = 'clinical';
          else type = 'other';
        } else {
          type = 'other';
        }

        return {
          ...e,
          type
        };
      });

      setHouseCalendarEvents(combinedEvents);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house calendar events';
      console.error('Error fetching house calendar events:', err);
      setError(errorMessage);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHouseCalendarEvents(controller.signal);
    return () => controller.abort();
  }, [houseId, staffId, startDate, endDate]);

  return {
    houseCalendarEvents,
    loading,
    error,
    refresh: fetchHouseCalendarEvents
  };
}
