import { useQuery } from '@tanstack/react-query';
import { houseOperationsApi } from '@/api/house-operations.api';
import { CALENDAR_VIEWS } from '@/config/query-views';
import { QUERY_KEYS } from '@/config/query-keys';

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
  const query = useQuery({
    queryKey: [QUERY_KEYS.CALENDAR_EVENTS, { houseId, staffId, startDate, endDate }],
    queryFn: async ({ signal }) => {
      if (!houseId) return [];

      const events = await houseOperationsApi.calendar.list({
        houseId,
        startDate,
        endDate,
        view: CALENDAR_VIEWS.FULL_LIST,
        signal
      });

      return (events || []).map((e: any) => {
        let type = 'other';
        const typeName = e.type?.event_type_name || '';
        
        if (e.is_checklist_event) {
          type = 'checklist';
        } else if (typeName) {
          const name = typeName.toLowerCase();
          if (name.includes('meeting')) type = 'meeting';
          else if (name.includes('appointment')) type = 'appointment';
          else if (name.includes('clinical')) type = 'clinical';
          else type = 'other';
        }

        return {
          ...e,
          type
        };
      });
    },
    enabled: !!houseId,
  });

  return {
    houseCalendarEvents: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch
  };
}
