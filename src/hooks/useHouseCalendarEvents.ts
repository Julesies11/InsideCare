import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseCalendarEvent {
  id: string;
  house_id: string;
  title: string;
  type: string;
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

  useEffect(() => {
    if (!houseId) {
      setHouseCalendarEvents([]);
      setLoading(false);
      return;
    }

    const fetchHouseCalendarEvents = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_calendar_events')
          .select(`
            *,
            participant:participants(id, name, email),
            assigned_staff:staff!assigned_staff_id(id, name, email),
            creator:staff!created_by(id, name, email)
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

    fetchHouseCalendarEvents();
  }, [houseId]);

  return {
    houseCalendarEvents,
    loading,
    error,
  };
}
