import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { CHECKLIST_STATUS } from '@/config/enums';
import { rosterApi } from '@/api/roster.api';
import { housesApi } from '@/api/houses.api';
import { participantsApi } from '@/api/participants.api';
import { staffApi } from '@/api/staff.api';

export interface StaffShift {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_template: string;
  shift_template_id?: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  house?: { id: string; house_name: string };
  participants?: Array<{ id: string; participant_name: string; house_id?: string | null }>;
  assigned_checklists?: Array<{ 
    id: string; 
    checklist_id: string; 
    assignment_title: string; 
    is_completed?: boolean;
    items?: Array<{ id: string; title: string }>;
  }>;
  staff_name?: string;
  duration_hours?: number;
  color_theme?: string;
  icon_name?: string;
  notesCount?: number;
  // Event fields
  entry_type?: 'shift' | 'event';
  title?: string;
  location?: string;
  type_name?: string;
  type_color?: string;
}

export interface AssignedChecklist {
  checklist_id: string;
  assignment_title: string;
}

export function useGlobalShiftTemplatesQuery() {
  return useQuery({
    queryKey: ['global-shift-templates'],
    queryFn: () => rosterApi.listGlobalShiftTemplates(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLeaveRequestsQuery(staffId: string, startDate: string, endDate: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, staffId, startDate, endDate],
    queryFn: async () => {
      const data = await rosterApi.listLeaveRequests(staffId, startDate, endDate);
      
      return (data || []).map((r: any) => ({
        id: r.id,
        start_date: r.start_date,
        end_date: r.end_date,
        status: r.status,
        leave_type_name: r.leave_type?.leave_type_name ?? 'Leave',
        staff_id: r.staff_id,
        reason: r.reason,
      }));
    },
    enabled: staffId !== 'skip',
    staleTime: 1000 * 60 * 5,
  });

  return useMemo(() => ({
    ...query,
    data: query.data || [],
  }), [query]);
}

export function useShiftsQuery(staffId: string, startDate: string, endDate: string, houseId?: string, includeEvents: boolean = false, options: { includeMetadata?: boolean } = { includeMetadata: true }) {
  const { houses, staff } = useRosterData('all', { includeMetadata: options.includeMetadata });

  const query = useQuery({
    queryKey: ['roster-shifts', staffId, startDate, endDate, houseId, includeEvents, options.includeMetadata],
    queryFn: () => rosterApi.listShifts({ staffId, startDate, endDate, houseId, includeEvents }),
    staleTime: 1000 * 60 * 5,
  });

  const shifts = useMemo(() => {
    if (!query.data) return [];
    
    const houseMap = new Map(houses.map(h => [h.id, { id: h.id, house_name: h.house_name }]));
    const staffMap = new Map(staff.map(s => [s.id, s.staff_name]));

    return (query.data as any[]).map((item: any): StaffShift => {
      const colorTheme = item.type_details?.color_theme || item.type_color;
      const iconName = item.type_details?.icon_name;

      // Use joined data if available (compact mode), otherwise fallback to global map (full mode)
      const staffName = item.staff_info?.staff_name || (item.staff_id ? staffMap.get(item.staff_id) : 'Unassigned') || 'Unassigned';
      const houseData = item.house_info || (item.house_id ? houseMap.get(item.house_id) : undefined);

      // Flatten participants if they are in the nested ic_shift_participants format
      const rawParticipants = item.participants || item.ic_shift_participants;
      const participants = (rawParticipants || [])?.map((p: any) => {
        // Extract the actual participant data regardless of how Supabase structured the join
        const part = p.participant || p.participants || p;
        const actualPart = Array.isArray(part) ? part[0] : part;

        const participantName = actualPart?.participant_name || p.participant_name;
        return {
          id: actualPart?.id || p.id || p.participant_id,
          participant_name: participantName,
          name: participantName
        };
      }).filter((p: any) => p.id && p.participant_name) || [];

      return {
        ...item,
        house: item.house || houseData,
        staff_name: staffName,
        participants,
        assigned_checklists: item.assigned_checklists?.map((cl: any) => ({
          ...cl,
          is_completed: cl.submissions?.some((s: any) => s.status === CHECKLIST_STATUS.completed) || false,
          items: (cl.checklist?.items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
        })) || [],
        notesCount: item.notes_count?.[0]?.count || 0,
        color_theme: colorTheme,
        icon_name: iconName,
      };
    }).sort((a, b) => {
      const dateCompare = (a.start_date || '').localeCompare(b.start_date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [query.data, houses, staff]);

  return useMemo(() => ({
    ...query,
    shifts,
  }), [query, shifts]);
}

export function useRosterData(staffId?: string, options: { includeMetadata?: boolean } = { includeMetadata: true }) {
  const queryClient = useQueryClient();
  const { includeMetadata = true } = options;

  const housesQuery = useQuery({
    queryKey: [QUERY_KEYS.HOUSES, staffId],
    queryFn: async () => {
      if (staffId && staffId !== 'all') {
        return await housesApi.listStaffAssignmentsByStaff(staffId);
      }
      return await housesApi.listActive();
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const participantsQuery = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANTS],
    queryFn: async () => {
      return await participantsApi.listActive();
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const staffQuery = useQuery({
    queryKey: [QUERY_KEYS.STAFF],
    queryFn: async () => {
      return await staffApi.listActive();
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const createShiftMutation = useMutation({
    mutationFn: (newShift: any) => rosterApi.createShift(newShift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => rosterApi.updateShift(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => rosterApi.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const bulkUpdateShiftsMutation = useMutation({
    mutationFn: ({ params, updates }: { params: any; updates: any }) => rosterApi.bulkUpdateShifts(params, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const bulkDeleteShiftsMutation = useMutation({
    mutationFn: (params: any) => rosterApi.bulkDeleteShifts(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const syncShiftParticipantsMutation = useMutation({
    mutationFn: ({ shiftId, participantIds }: { shiftId: string; participantIds: string[] }) => rosterApi.syncShiftParticipants(shiftId, participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const addShiftParticipantMutation = useMutation({
    mutationFn: ({ shiftId, participantId }: { shiftId: string; participantId: string }) => rosterApi.addShiftParticipant(shiftId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const materializePatternMutation = useMutation({
    mutationFn: (params: any) => rosterApi.materializePattern(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const syncShiftChecklistsMutation = useMutation({
    mutationFn: ({ shiftId, checklists }: { shiftId: string; checklists: any[] }) => rosterApi.syncShiftChecklists(shiftId, checklists),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  return {
    houses: housesQuery.data || [],
    participants: participantsQuery.data || [],
    staff: staffQuery.data || [],
    loading: housesQuery.isLoading || participantsQuery.isLoading || staffQuery.isLoading,
    refresh: () => {
      housesQuery.refetch();
      participantsQuery.refetch();
      staffQuery.refetch();
    },
    createShift: createShiftMutation.mutateAsync,
    updateShift: (id: string, updates: any) => updateShiftMutation.mutateAsync({ id, updates }),
    deleteShift: deleteShiftMutation.mutateAsync,
    bulkUpdateShifts: (params: any, updates: any) => bulkUpdateShiftsMutation.mutateAsync({ params, updates }),
    bulkDeleteShifts: bulkDeleteShiftsMutation.mutateAsync,
    syncShiftParticipants: (shiftId: string, participantIds: string[]) => syncShiftParticipantsMutation.mutateAsync({ shiftId, participantIds }),
    addShiftParticipant: (shiftId: string, participantId: string) => addShiftParticipantMutation.mutateAsync({ shiftId, participantId }),
    materializePattern: materializePatternMutation.mutateAsync,
    syncShiftChecklists: (shiftId: string, checklists: any[]) => syncShiftChecklistsMutation.mutateAsync({ shiftId, checklists }),
  };
}
