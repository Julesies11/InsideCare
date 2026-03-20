import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, parseISO } from 'date-fns';
import { expandRRule } from '@/lib/rrule-utils';
import { toast } from 'sonner';

export interface ChecklistSchedule {
  id: string;
  house_id: string;
  house_checklist_id: string; // Correctly links to house_checklists
  rrule: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export function useChecklistSchedules(houseId?: string) {
  const [loading, setLoading] = useState(false);

  /**
   * Creates a schedule and materializes the first batch of calendar events.
   */
  const createSchedule = async (schedule: Omit<ChecklistSchedule, 'id'>) => {
    try {
      setLoading(true);

      // 1. Insert the Schedule
      const { data: newSchedule, error: scheduleError } = await supabase
        .from('checklist_schedules')
        .insert(schedule)
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // 2. Materialize Events (e.g., for the next 6 months)
      const rangeStart = new Date();
      const rangeEnd = schedule.end_date ? new Date(schedule.end_date) : addDays(rangeStart, 180);
      
      const eventDates = expandRRule(
        schedule.rrule, 
        parseISO(schedule.start_date), 
        rangeStart, 
        rangeEnd
      );

      if (eventDates.length > 0) {
        // Fetch the house checklist info for the title
        const { data: houseChecklist } = await supabase
          .from('house_checklists')
          .select('name')
          .eq('id', schedule.house_checklist_id)
          .single();

        const calendarEvents = eventDates.map(date => ({
          house_id: schedule.house_id,
          title: houseChecklist?.name || 'Scheduled Checklist',
          type: 'checklist',
          event_date: format(date, 'yyyy-MM-dd'),
          checklist_schedule_id: newSchedule.id,
          house_checklist_id: schedule.house_checklist_id,
          is_checklist_event: true,
          status: 'scheduled'
        }));

        const { error: eventError } = await supabase
          .from('house_calendar_events')
          .insert(calendarEvents);

        if (eventError) throw eventError;
      }

      toast.success('Checklist schedule created and calendar populated.');
      return newSchedule;
    } catch (err) {
      console.error('Error creating checklist schedule:', err);
      toast.error('Failed to create checklist schedule.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a schedule and its associated future calendar events.
   */
  const deleteSchedule = async (scheduleId: string) => {
    try {
      setLoading(true);
      
      // Deleting the schedule will cascade delete calendar events (due to FK ON DELETE CASCADE)
      const { error } = await supabase
        .from('checklist_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Schedule removed.');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      toast.error('Failed to delete schedule.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a single calendar event instance.
   */
  const deleteEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('house_calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Event removed.');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event.');
    } finally {
      setLoading(false);
    }
  };

  return {
    createSchedule,
    deleteSchedule,
    deleteEvent,
    loading
  };
}
