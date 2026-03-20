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

export function useHouseCalendarEvents(houseId?: string) {
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
      
      const { data, error } = await supabase
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

      if (error) throw error;

      setHouseCalendarEvents(data || []);
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
  }, [houseId]);

  return {
    houseCalendarEvents,
    loading,
    error,
    refresh: fetchHouseCalendarEvents
  };
}
