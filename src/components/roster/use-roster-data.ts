import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, addDays, parseISO, startOfWeek } from 'date-fns';

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
  house?: { id: string; name: string };
  participants?: Array<{ id: string; name: string; house_id?: string | null }>;
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
        .from('house_shift_templates')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      const uniqueNames = Array.from(new Set(data.map(t => t.name)));
      return uniqueNames.map(name => ({ id: name, name }));
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLeaveRequestsQuery(staffId: string, startDate: string, endDate: string) {
  const query = useQuery({
    queryKey: ['leave-requests', staffId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select('id, start_date, end_date, status, leave_type:leave_types(name), staff_id, reason')
        .neq('status', 'rejected')
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
        leave_type_name: r.leave_type?.name ?? 'Leave',
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
        .from('staff_shifts')
        .select(`
          id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
          staff_info:staff(id, name),
          house_info:houses(id, name),
          type_details:house_shift_templates(color_theme, icon_name),
          participants:shift_participants(
            participant:participants(id, name)
          ),
          assigned_checklists:shift_assigned_checklists(
            id, checklist_id, assignment_title,
            submissions:house_checklist_submissions(status),
            checklist:house_checklists(
              items:house_checklist_items(id, title, sort_order)
            )
          ),
          notes_count:shift_notes(count)
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
          .from('house_calendar_events')
          .select(`
            id,
            title,
            event_date,
            start_time,
            end_time,
            location,
            type:house_calendar_event_types_master(name, color),
            house_id,
            house:houses(name),
            staff_assignments:house_calendar_event_staff!inner(staff_id)
          `)
          .eq('house_calendar_event_staff.staff_id', staffId)
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
        type_name: e.type?.name,
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
    
    const houseMap = new Map(houses.map(h => [h.id, { id: h.id, name: h.name }]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return query.data.map((item: any): StaffShift => {
      const colorTheme = item.type_details?.color_theme || item.type_color;
      const iconName = item.type_details?.icon_name;

      // Use joined data if available (compact mode), otherwise fallback to global map (full mode)
      const staffName = item.staff_info?.name || (item.staff_id ? staffMap.get(item.staff_id) : 'Unassigned') || 'Unassigned';
      const houseData = item.house_info || (item.house_id ? houseMap.get(item.house_id) : undefined);

      // Flatten participants if they are in the nested shift_participants format
      const rawParticipants = item.participants || item.shift_participants;
      const participants = (rawParticipants || [])?.map((p: any) => {
        // Extract the actual participant data regardless of how Supabase structured the join
        const part = p.participant || p.participants || p;
        const actualPart = Array.isArray(part) ? part[0] : part;

        return {
          id: actualPart?.id || p.id || p.participant_id,
          name: actualPart?.name || p.name
        };
      }).filter((p: any) => p.id && p.name) || [];

      return {
        ...item,
        house: item.house || houseData,
        staff_name: staffName,
        participants,
        assigned_checklists: item.assigned_checklists?.map((cl: any) => ({
          ...cl,
          is_completed: cl.submissions?.some((s: any) => s.status === 'completed') || false,
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
    queryKey: ['houses', staffId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      if (staffId && staffId !== 'all') {
        const { data, error } = await supabase
          .from('house_staff_assignments')
          .select('house:houses(id, name, status, branch_id)')
          .eq('staff_id', staffId)
          .or(`end_date.is.null,end_date.gte.${today}`);
        
        if (error) throw error;
        
        const houses = (data || [])
          .map((a: any) => a.house)
          .filter((h: any) => h && h.status === 'active');
        
        // Deduplicate by ID
        const uniqueHouses = Array.from(new Map(houses.map(h => [h.id, h])).values());
        
        return uniqueHouses.sort((a, b) => a.name.localeCompare(b.name));
      }

      const { data, error } = await supabase
        .from('houses')
        .select('id, name, status, branch_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const participantsQuery = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, status, house_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: includeMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id, name, status, email,
          house_assignments:house_staff_assignments(
            id,
            house_id,
            end_date,
            house:houses(id, name)
          )
        `)
        .eq('status', 'active')
        .order('name');
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
        .from('staff_shifts')
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
        .from('staff_shifts')
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
        .from('staff_shifts')
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
      let query = supabase.from('staff_shifts').update(updates);
      
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
      let query = supabase.from('staff_shifts').delete();
      
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
        .from('shift_participants')
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
        .from('shift_participants')
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
        .from('shift_participants')
        .delete()
        .eq('shift_id', shift_id);
      
      // Insert new
      if (participant_ids.length > 0) {
        const { error } = await supabase
          .from('shift_participants')
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
              shift_template: type.name,
              shift_template_id: type.id,
              notes: null
            });
          });
        });
      });

      if (shiftsToCreate.length === 0) return { created: 0, checklists: 0, skipped: 0 };

      // Bulk create shifts
      const { data: createdShifts, error: shiftError } = await supabase
        .from('staff_shifts')
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
            assignment_title: d.checklist?.name || 'Routine Checklist',
            house_id: houseId,
            shift_template_id: shift.shift_template_id
          });
          checklistsCount++;
        });
      });

      if (participantInserts.length > 0) {
        await supabase.from('shift_participants').insert(participantInserts);
      }

      if (checklistInserts.length > 0) {
        await supabase.from('shift_assigned_checklists').insert(checklistInserts);
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
        .from('staff_shifts')
        .select('house_id, shift_template_id')
        .eq('id', shift_id)
        .maybeSingle();
      
      if (!shift) throw new Error("You do not have permission to perform this action");

      // Delete existing
      await supabase
        .from('shift_assigned_checklists')
        .delete()
        .eq('shift_id', shift_id);
      
      // Insert new
      if (checklists.length > 0) {
        const { error } = await supabase
          .from('shift_assigned_checklists')
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

