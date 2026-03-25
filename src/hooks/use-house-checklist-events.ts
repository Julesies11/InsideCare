import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HouseChecklistItem } from './use-house-checklists';

export interface HouseChecklistEvent {
  id: string;
  house_id: string;
  title: string;
  event_date: string;
  is_checklist_event: boolean;
  is_shift_routine?: boolean;
  shift_id?: string;
  shift_type_id?: string;
  house_checklist_id: string;
  status: string;
  checklist?: {
    id: string;
    name: string;
    frequency: string;
    description: string;
    items: HouseChecklistItem[];
  };
  latest_submission?: {
    id: string;
    status: string;
    updated_at: string;
    scheduled_date: string;
  };
}

export function useHouseChecklistEvents(houseId?: string, date?: string, shiftId?: string) {
  const query = useQuery({
    queryKey: ['house-checklist-events', houseId, date, shiftId],
    queryFn: async () => {
      if (!houseId || !date) return [];

      let shiftSpecificChecklists: any[] = [];
      
      // 1. If shiftId is provided, fetch the assigned checklists for that shift from junction table
      if (shiftId) {
        const { data: assignedData, error: shiftError } = await supabase
          .from('shift_assigned_checklists')
          .select('checklist_id, assignment_title, shift_type_id')
          .eq('shift_id', shiftId)
          .order('sort_order', { ascending: true });
        
        if (!shiftError && assignedData) {
          shiftSpecificChecklists = assignedData;
        }
      }

      // 2. Fetch checklist events for the house on the specific date
      const { data: events, error: eventError } = await supabase
        .from('house_calendar_events')
        .select(`
          id, 
          house_id, 
          title, 
          event_date, 
          is_checklist_event, 
          house_checklist_id, 
          status,
          submissions:house_checklist_submissions(
            id, 
            status, 
            updated_at, 
            scheduled_date
          )
        `)
        .eq('house_id', houseId)
        .eq('event_date', date)
        .eq('is_checklist_event', true);

      if (eventError) throw eventError;

      // 3. Combine calendar events with shift-assigned checklists
      const combinedEvents = [...(events || [])];

      if (shiftId && shiftSpecificChecklists.length > 0) {
        for (const ac of shiftSpecificChecklists) {
          // Check if this template already has a calendar event for this date
          const existingEvent = combinedEvents.find(e => e.house_checklist_id === ac.checklist_id);
          
          if (!existingEvent) {
            // Check for existing submission for this specific shift
            const { data: shiftSub } = await supabase
              .from('house_checklist_submissions')
              .select('id, status, updated_at, scheduled_date')
              .eq('checklist_id', ac.checklist_id)
              .eq('shift_id', shiftId)
              .maybeSingle();

            combinedEvents.push({
              id: `shift-cl-${ac.checklist_id}-${shiftId}`, // Unique synthetic ID
              house_id: houseId,
              title: ac.assignment_title, 
              event_date: date,
              is_checklist_event: true,
              is_shift_routine: true,
              shift_id: shiftId,
              shift_type_id: ac.shift_type_id,
              house_checklist_id: ac.checklist_id,
              status: 'scheduled',
              submissions: shiftSub ? [shiftSub] : []
            });
          } else {
            // Overwrite the generic title with the specific assignment title
            existingEvent.title = ac.assignment_title;
          }
        }
      }

      if (combinedEvents.length === 0) return [];

      // 4. Fetch the actual checklist details for all identified checklists
      const checklistIds = [...new Set(combinedEvents.map(e => e.house_checklist_id))];
      
      const { data: checklists, error: clError } = await supabase
        .from('house_checklists')
        .select(`
          id, 
          name, 
          frequency, 
          description,
          items:house_checklist_items(
            id, 
            checklist_id, 
            title, 
            instructions, 
            group_id,
            group_title,
            priority, 
            is_required, 
            sort_order, 
            created_at, 
            updated_at,
            group:house_shift_types(id, name, short_name, color_theme)
          )
        `)
        .in('id', checklistIds);

      if (clError) throw clError;

      // 5. Map everything together
      return combinedEvents.map(event => {
        const checklist = checklists?.find(cl => cl.id === event.house_checklist_id);
        const sortedItems = checklist?.items 
          ? [...checklist.items].sort((a, b) => a.sort_order - b.sort_order)
          : [];

        return {
          ...event,
          checklist: checklist ? {
            ...checklist,
            items: sortedItems
          } : undefined,
          latest_submission: event.submissions?.[0] || null
        } as HouseChecklistEvent;
      });
    },
    enabled: !!houseId && !!date,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    events: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
