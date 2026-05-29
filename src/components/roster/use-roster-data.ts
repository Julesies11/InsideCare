import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, addDays, parseISO, startOfWeek } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { STATUS, CHECKLIST_STATUS, LEAVE_STATUS } from '@/config/enums';

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_SHIFT_TEMPLATES)
        .select('shift_template_name')
        .eq('is_active', true)
        .order('shift_template_name');
      
      if (error) throw error;
      const uniqueNames = Array.from(new Set(data.map(t => t.shift_template_name)));
      return uniqueNames.map(name => ({ id: name, name }));
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLeaveRequestsQuery(staffId: string, startDate: string, endDate: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, staffId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.LEAVE_REQUESTS)
        .select(`id, start_date, end_date, status, leave_type:ic_leave_types(leave_type_name), staff_id, reason`)
        .neq('status', LEAVE_STATUS.REJECTED)
        .lte('start_date', endDate)
        .gte('end_date', startDate);
        
      if (staffId !== 'all') query = query.eq('staff_id', staffId);
      
      const { data, error } = await query;
      if (error) throw error;
      
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
    queryFn: async () => {
      // Fetch shifts
      let shiftQuery = supabase
        .from(TABLES.STAFF_SHIFTS)
        .select(`
          id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
          staff_info:${TABLES.STAFF}!staff_shifts_staff_id_fkey(id, staff_name),
          house_info:${TABLES.HOUSES}(id, house_name),
          type_details:${TABLES.HOUSE_SHIFT_TEMPLATES}(color_theme, icon_name),
          participants:${TABLES.SHIFT_PARTICIPANTS}(
            participant:${TABLES.PARTICIPANTS}(id, participant_name)
          ),
          assigned_checklists:${TABLES.SHIFT_ASSIGNED_CHECKLISTS}(
            id, checklist_id, assignment_title,
            submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}(status),
            checklist:${TABLES.HOUSE_CHECKLISTS}(
              house_checklist_name,
              items:${TABLES.HOUSE_CHECKLIST_ITEMS}(id, title, sort_order)
            )
          ),
          notes_count:${TABLES.SHIFT_NOTES}(count)
        `)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Handle overlapping date ranges (useful for overnight shifts)
      // Intersection rule: (Shift End >= Range Start) AND (Shift Start <= Range End)
      if (startDate) shiftQuery = shiftQuery.gte('end_date', startDate);
      if (endDate) shiftQuery = shiftQuery.lte('start_date', endDate);

      if (staffId && staffId !== 'all') shiftQuery = shiftQuery.eq('staff_id', staffId);
      if (houseId && houseId !== 'all') shiftQuery = shiftQuery.eq('house_id', houseId);

      // Fetch events if requested and staffId is provided
      let eventQuery: any = null;
      if (includeEvents && staffId && staffId !== 'all') {
        eventQuery = supabase
          .from(TABLES.HOUSE_CALENDAR_EVENTS)
          .select(`
            id,
            title,
            event_date,
            start_time,
            end_time,
            location,
            type:${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}(event_type_name, color),
            house_id,
            house:${TABLES.HOUSES}(house_name),
            staff_assignments:${TABLES.HOUSE_CALENDAR_EVENT_STAFF}!inner(staff_id)
          `)
          .eq('staff_assignments.staff_id', staffId)
          .gte('event_date', startDate)
          .lte('event_date', endDate);
      }

      const [shiftsRes, eventsRes] = await Promise.all([
        shiftQuery,
        eventQuery || Promise.resolve({ data: [], error: null })
      ]);

      if (shiftsRes.error) throw shiftsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const shifts = (shiftsRes.data || []).map(s => ({ ...s, entry_type: 'shift' as const }));
      const events = (eventsRes.data || []).map(e => ({
        id: e.id,
        staff_id: staffId,
        start_date: e.event_date,
        end_date: e.event_date,
        start_time: e.start_time,
        end_time: e.end_time,
        house_id: e.house_id,
        shift_template: 'Event',
        title: e.title,
        location: e.location,
        type_name: e.type?.event_type_name,
        type_color: e.type?.color,
        entry_type: 'event' as const,
        house: e.house,
      }));

      return [...shifts, ...events];
    },
    staleTime: 1000 * 60 * 5,
  });

  const shifts = useMemo(() => {
    if (!query.data) return [];
    
    const houseMap = new Map(houses.map(h => [h.id, { id: h.id, house_name: h.house_name }]));
    const staffMap = new Map(staff.map(s => [s.id, s.staff_name]));

    return query.data.map((item: any): StaffShift => {
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
      const dateCompare = a.start_date.localeCompare(b.start_date);
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
      const today = new Date().toISOString().split('T')[0];

      if (staffId && staffId !== 'all') {
        const { data, error } = await supabase
          .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
          .select(`house:${TABLES.HOUSES}(id, house_name, status, branch_id)`)
          .eq('staff_id', staffId)
          .or(`end_date.is.null,end_date.gte.${today}`);
        
        if (error) throw error;
        
        const houses = (data || [])
          .map((a: any) => a.house)
          .filter((h: any) => h && h.status === STATUS.active);
        
        // Deduplicate by ID
        const uniqueHouses = Array.from(new Map(houses.map(h => [h.id, h])).values());
        
        return uniqueHouses.map((h: any) => ({ ...h, name: h.house_name })).sort((a, b) => a.house_name.localeCompare(b.house_name));
      }

      const { data, error } = await supabase
        .from(TABLES.HOUSES)
        .select('id, house_name, status, branch_id')
        .eq('status', STATUS.active)
        .order('house_name');
      if (error) throw error;
      return (data || []).map((h: any) => ({ ...h, name: h.house_name }));
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const participantsQuery = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANTS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('id, participant_name, status, house_id')
        .eq('status', STATUS.active)
        .order('participant_name');
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, name: p.participant_name }));
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const staffQuery = useQuery({
    queryKey: [QUERY_KEYS.STAFF],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select(`
          id, staff_name, status, email,
          house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_staff_assignments_staff_id_fkey(
            id,
            house_id,
            end_date,
            house:${TABLES.HOUSES}(id, house_name)
          )
        `)
        .eq('status', STATUS.active)
        .order('staff_name');
      if (error) throw error;
      
      // Normalize and Filter house assignments (only active ones)
      return (data || []).map((s: any) => {
        const activeAssignments = (s.house_assignments || []).filter((ha: any) => {
          return !ha.end_date || ha.end_date >= today;
        }).map((ha: any) => ({
          ...ha,
          house: Array.isArray(ha.house) ? ha.house[0] : ha.house
        }));

        return {
          ...s,
          name: s.staff_name,
          house_assignments: activeAssignments
        };
      });
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const createShiftMutation = useMutation({
    mutationFn: async (shift: any) => {
      // Sanitize payload: Remove UI-only fields and relational data that doesn't belong in staff_shifts table
      const { 
        participant_ids, 
        assigned_checklists, 
        entry_type, 
        title, 
        location,
        participants, // Sometimes passed as array of objects
        ...dbPayload 
      } = shift;

      const { data, error } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .insert([dbPayload])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");

      // Sync participants if provided
      if (participant_ids) {
        await syncShiftParticipantsMutation.mutateAsync({ shift_id: data.id, participant_ids });
      }

      // Sync checklists if provided
      if (assigned_checklists) {
        await syncShiftChecklistsMutation.mutateAsync({ shift_id: data.id, checklists: assigned_checklists });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      // Sanitize payload: Remove UI-only fields and relational data that doesn't belong in staff_shifts table
      const { 
        participant_ids, 
        assigned_checklists, 
        entry_type, 
        title, 
        location,
        participants, // Sometimes passed from calendar events
        ...dbPayload 
      } = updates;

      const { data, error } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .update(dbPayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");

      // Sync participants if provided
      if (participant_ids) {
        await syncShiftParticipantsMutation.mutateAsync({ shift_id: id, participant_ids });
      }

      // Sync checklists if provided
      if (assigned_checklists) {
        await syncShiftChecklistsMutation.mutateAsync({ shift_id: id, checklists: assigned_checklists });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const bulkUpdateShiftsMutation = useMutation({
    mutationFn: async ({ params, updates }: { params: string[] | any, updates: any }) => {
      let query = supabase.from(TABLES.STAFF_SHIFTS).update(updates);
      
      if (Array.isArray(params)) {
        query = query.in('id', params);
      } else {
        // Handle criteria object
        if (params.houseId && params.houseId !== 'all') {
          query = query.eq('house_id', params.houseId);
        }
        if (params.staffId && params.staffId !== 'all') {
          query = query.eq('staff_id', params.staffId);
        }
        if (params.startDate) {
          query = query.gte('start_date', params.startDate);
        }
        if (params.endDate) {
          query = query.lte('start_date', params.endDate);
        }
      }
      
      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const bulkDeleteShiftsMutation = useMutation({
    mutationFn: async (params: string[] | any) => {
      let query = supabase.from(TABLES.STAFF_SHIFTS).delete();
      
      if (Array.isArray(params)) {
        query = query.in('id', params);
      } else {
        // Handle criteria object
        if (params.houseId && params.houseId !== 'all') {
          query = query.eq('house_id', params.houseId);
        }
        if (params.staffId && params.staffId !== 'all') {
          query = query.eq('staff_id', params.staffId);
        }
        if (params.startDate) {
          query = query.gte('start_date', params.startDate);
        }
        if (params.endDate) {
          query = query.lte('start_date', params.endDate);
        }
      }
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const addShiftParticipantMutation = useMutation({
    mutationFn: async ({ shift_id, participant_id }: { shift_id: string, participant_id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.SHIFT_PARTICIPANTS)
        .insert([{ shift_id, participant_id }])
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const removeShiftParticipantMutation = useMutation({
    mutationFn: async ({ shift_id, participant_id }: { shift_id: string, participant_id: string }) => {
      const { error } = await supabase
        .from(TABLES.SHIFT_PARTICIPANTS)
        .delete()
        .eq('shift_id', shift_id)
        .eq('participant_id', participant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const syncShiftParticipantsMutation = useMutation({
    mutationFn: async ({ shift_id, participant_ids }: { shift_id: string, participant_ids: string[] }) => {
      // Delete existing
      await supabase
        .from(TABLES.SHIFT_PARTICIPANTS)
        .delete()
        .eq('shift_id', shift_id);
      
      // Insert new
      if (participant_ids.length > 0) {
        const { error } = await supabase
          .from(TABLES.SHIFT_PARTICIPANTS)
          .insert(participant_ids.map(pid => ({ shift_id, participant_id: pid })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const materializePatternMutation = useMutation({
    mutationFn: async ({ 
      houseId, 
      startDate, 
      pattern, 
      shiftTemplates, 
      defaults, 
      participants 
    }: { 
      houseId: string;
      startDate: string;
      pattern: Record<number, string[]>[];
      shiftTemplates: any[];
      defaults: any[];
      participants: any[];
    }) => {
      const shiftsToCreate: any[] = [];
      const anchorMonday = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });

      pattern.forEach((weekPattern, weekIndex) => {
        const weekStartDate = addDays(anchorMonday, weekIndex * 7);
        Object.entries(weekPattern).forEach(([dayStr, shiftTemplateIds]) => {
          const dayId = parseInt(dayStr);
          // dayId 0=Sun, 1=Mon... in pattern. DAYS_OF_WEEK helper in modal uses 1-Mon to 0-Sun.
          // date-fns addDays(anchorMonday, offset) where 0=Mon, 1=Tue... 6=Sun
          const dayOffset = dayId === 0 ? 6 : dayId - 1;
          const targetDate = addDays(weekStartDate, dayOffset);
          const targetDateStr = format(targetDate, 'yyyy-MM-dd');

          // Skip if before start date
          if (targetDateStr < startDate) return;

          shiftTemplateIds.forEach(typeId => {
            const type = shiftTemplates.find(t => t.id === typeId);
            if (!type) return;

            shiftsToCreate.push({
              house_id: houseId,
              staff_id: null,
              start_date: targetDateStr,
              end_date: targetDateStr,
              start_time: type.default_start_time,
              end_time: type.default_end_time,
              shift_template: type.shift_template_name,
              shift_template_id: type.id,
              notes: null
            });
          });
        });
      });

      if (shiftsToCreate.length === 0) return { created: 0, checklists: 0, skipped: 0 };

      // Bulk create shifts
      const { data: createdShifts, error: shiftError } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .insert(shiftsToCreate)
        .select('id, shift_template_id');

      if (shiftError) throw shiftError;

      let checklistsCount = 0;
      const participantInserts: any[] = [];
      const checklistInserts: any[] = [];

      createdShifts.forEach(shift => {
        // Participants
        participants.forEach(p => {
          participantInserts.push({ shift_id: shift.id, participant_id: p.id });
        });

        // Checklists from defaults
        const typeDefaults = defaults.filter(d => d.shift_template_id === shift.shift_template_id);
        typeDefaults.forEach(d => {
          checklistInserts.push({
            shift_id: shift.id,
            checklist_id: d.checklist_id,
            assignment_title: d.checklist?.house_checklist_name || 'Routine Checklist',
            house_id: houseId,
            shift_template_id: shift.shift_template_id
          });
          checklistsCount++;
        });
      });

      if (participantInserts.length > 0) {
        await supabase.from(TABLES.SHIFT_PARTICIPANTS).insert(participantInserts);
      }

      if (checklistInserts.length > 0) {
        await supabase.from(TABLES.SHIFT_ASSIGNED_CHECKLISTS).insert(checklistInserts);
      }

      return {
        created: createdShifts.length,
        checklists: checklistsCount,
        skipped: shiftsToCreate.length - createdShifts.length
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const syncShiftChecklistsMutation = useMutation({
    mutationFn: async ({ shift_id, checklists }: { shift_id: string, checklists: AssignedChecklist[] }) => {
      // Get current shift info to get house_id and shift_template_id
      const { data: shift } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .select('house_id, shift_template_id')
        .eq('id', shift_id)
        .maybeSingle();
      
      if (!shift) throw new Error("You do not have permission to perform this action");

      // Delete existing
      await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .delete()
        .eq('shift_id', shift_id);
      
      // Insert new
      if (checklists.length > 0) {
        const { error } = await supabase
          .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
          .insert(checklists.map(cl => ({ 
            shift_id, 
            checklist_id: cl.checklist_id,
            assignment_title: cl.assignment_title,
            house_id: shift?.house_id,
            shift_template_id: shift?.shift_template_id
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const materializePattern = useCallback((params: any) => materializePatternMutation.mutateAsync(params), [materializePatternMutation]);
  const syncShiftChecklists = useCallback((shift_id: string, checklists: AssignedChecklist[]) => syncShiftChecklistsMutation.mutateAsync({ shift_id, checklists }), [syncShiftChecklistsMutation]);

  // Wrappers to keep the original function API
  const createShift = useCallback((shift: any) => createShiftMutation.mutateAsync(shift), [createShiftMutation]);
  const updateShift = useCallback((id: string, updates: any) => updateShiftMutation.mutateAsync({ id, updates }), [updateShiftMutation]);
  const deleteShift = useCallback((id: string) => deleteShiftMutation.mutateAsync(id), [deleteShiftMutation]);
  const bulkUpdateShifts = useCallback((params: string[] | any, updates: any) => bulkUpdateShiftsMutation.mutateAsync({ params, updates }), [bulkUpdateShiftsMutation]);
  const bulkDeleteShifts = useCallback((params: string[] | any) => bulkDeleteShiftsMutation.mutateAsync(params), [bulkDeleteShiftsMutation]);
  const addShiftParticipant = useCallback((shift_id: string, participant_id: string) => addShiftParticipantMutation.mutateAsync({ shift_id, participant_id }), [addShiftParticipantMutation]);
  const removeShiftParticipant = useCallback((shift_id: string, participant_id: string) => removeShiftParticipantMutation.mutateAsync({ shift_id, participant_id }), [removeShiftParticipantMutation]);
  const syncShiftParticipants = useCallback((shift_id: string, participant_ids: string[]) => syncShiftParticipantsMutation.mutateAsync({ shift_id, participant_ids }), [syncShiftParticipantsMutation]);

  return useMemo(() => ({
    houses: housesQuery.data || [],
    participants: participantsQuery.data || [],
    staff: staffQuery.data || [],
    loading: housesQuery.isLoading || participantsQuery.isLoading || staffQuery.isLoading,
    loadHouses: housesQuery.refetch,
    loadParticipants: participantsQuery.refetch,
    loadStaff: staffQuery.refetch,
    createShift,
    updateShift,
    deleteShift,
    bulkUpdateShifts,
    bulkDeleteShifts,
    addShiftParticipant,
    removeShiftParticipant,
    syncShiftParticipants,
    materializePattern,
    syncShiftChecklists,
  }), [
    housesQuery.data, 
    housesQuery.isLoading, 
    housesQuery.refetch,
    participantsQuery.data, 
    participantsQuery.isLoading, 
    participantsQuery.refetch,
    staffQuery.data, 
    staffQuery.isLoading, 
    staffQuery.refetch,
    createShift,
    updateShift,
    deleteShift,
    bulkUpdateShifts,
    bulkDeleteShifts,
    addShiftParticipant,
    removeShiftParticipant,
    syncShiftParticipants,
    materializePattern,
    syncShiftChecklists
  ]);
}
