import { useState } from 'react';
import { checklistsApi } from '@/api/checklists.api';
import { addDays, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { expandRRule } from '@/lib/rrule-utils';

export interface ChecklistSchedule {
  id: string;
  house_id: string;
  house_checklist_id: string; // Correctly links to house_checklists
  rrule: string;
  start_date: string;
  end_date: string | null;
  target_shift: string;
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

      // 1. Insert the Schedule via API
      const newSchedule = await checklistsApi.createSchedule(schedule);

      // 2. Materialize Events (e.g., for the next 6 months)
      const rangeStart = new Date();
      const rangeEnd = schedule.end_date
        ? new Date(schedule.end_date)
        : addDays(rangeStart, 180);

      const eventDates = expandRRule(
        schedule.rrule,
        parseISO(schedule.start_date),
        rangeStart,
        rangeEnd,
      );

      if (eventDates.length > 0) {
        // Fetch the house checklist info for the title
        const houseChecklist = await checklistsApi.getHouseChecklist(
          schedule.house_checklist_id,
        );

        if (!houseChecklist) {
          throw new Error('You do not have permission to perform this action');
        }

        const calendarEvents = eventDates.map((date) => ({
          house_id: schedule.house_id,
          title: houseChecklist?.house_checklist_name || 'Scheduled Checklist',
          event_date: format(date, 'yyyy-MM-dd'),
          checklist_schedule_id: newSchedule.id,
          house_checklist_id: schedule.house_checklist_id,
          is_checklist_event: true,
          status: 'scheduled',
        }));

        // We should probably add a bulk insert to checklistsApi or similar
        // For now, I'll use the existing pattern if I can.
        // Wait, I'll add bulk insert to houseOperationsApi.calendar.upsert
        await checklistsApi.upsertCalendarEvents(calendarEvents);
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
      await checklistsApi.deleteSchedule(scheduleId);
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
      await checklistsApi.deleteCalendarEvent(eventId);
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
    loading,
  };
}
