import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StaffShift {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_type: string;
  shift_type_id?: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  house?: { id: string; name: string };
  participants?: Array<{ id: string; name: string; house_id?: string | null }>;
  assigned_checklists?: Array<{ id: string; checklist_id: string; assignment_title: string; is_completed?: boolean }>;
  staff_name?: string;
  duration_hours?: number;
  color_theme?: string;
  icon_name?: string;
  notesCount?: number;
}

export function useGlobalShiftTypesQuery() {
  return useQuery({
    queryKey: ['global-shift-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_shift_types')
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
  return useQuery({
    queryKey: ['leave-requests', staffId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select('id, start_date, end_date, status, leave_type:leave_types(name), staff_id')
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
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useShiftsQuery(staffId: string, startDate: string, endDate: string, houseId?: string) {
  const { houses, staff } = useRosterData();

  const query = useQuery({
    queryKey: ['roster-shifts', staffId, startDate, endDate, houseId],
    queryFn: async () => {
      let query = supabase
        .from('staff_shifts')
        .select(`
          id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_type, shift_type_id, notes,
          type_details:house_shift_types(color_theme, icon_name),
          participants:shift_participants(
            participant:participants(id, name)
          ),
          assigned_checklists:shift_assigned_checklists(
            id, checklist_id, assignment_title,
            submissions:house_checklist_submissions(status)
          ),
          notes_count:shift_notes(count)
        `)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (staffId && staffId !== 'all') query = query.eq('staff_id', staffId);
      if (houseId && houseId !== 'all') query = query.eq('house_id', houseId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const shifts = useMemo(() => {
    if (!query.data) return [];
    
    // Frontend Joining
    const houseMap = new Map(houses.map(h => [h.id, { id: h.id, name: h.name }]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return query.data.map((shift: any): StaffShift => {
      const colorTheme = shift.type_details?.color_theme;
      const iconName = shift.type_details?.icon_name;

      return {
        ...shift,
        house: shift.house_id ? houseMap.get(shift.house_id) : undefined,
        staff_name: shift.staff_id ? staffMap.get(shift.staff_id) || 'Unassigned' : 'Unassigned',
        participants: shift.participants?.map((p: any) => ({
          id: p.participant.id,
          name: p.participant.name,
        })) || [],
        assigned_checklists: shift.assigned_checklists?.map((cl: any) => ({
          ...cl,
          is_completed: cl.submissions?.some((s: any) => s.status === 'completed') || false
        })) || [],
        notesCount: shift.notes_count?.[0]?.count || 0,
        color_theme: colorTheme,
        icon_name: iconName,
      };
    });
  }, [query.data, houses, staff]);

  return {
    ...query,
    shifts,
  };
}

export function useRosterData() {
  const queryClient = useQueryClient();

  const housesQuery = useQuery({
    queryKey: ['houses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, status, branch_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
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
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id, name, status, email,
          house_assignments:house_staff_assignments(
            id,
            house_id,
            house:houses(id, name)
          )
        `)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      
      // Normalize house assignments
      return (data || []).map((s: any) => ({
        ...s,
        house_assignments: (s.house_assignments || []).map((ha: any) => ({
          ...ha,
          house: Array.isArray(ha.house) ? ha.house[0] : ha.house
        }))
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const createShiftMutation = useMutation({
    mutationFn: async (shift: any) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert([shift])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
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
    mutationFn: async ({ ids, updates }: { ids: string[], updates: any }) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .update(updates)
        .in('id', ids)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const bulkDeleteShiftsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('staff_shifts')
        .delete()
        .in('id', ids);
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
        .single();
      if (error) throw error;
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

  const materializeTemplateMutation = useMutation({
    mutationFn: async ({ template_id, house_id, start_date }: { template_id: string, house_id: string, start_date: string }) => {
      console.log('Materializing template', { template_id, house_id, start_date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const materializePatternMutation = useMutation({
    mutationFn: async ({ pattern_id, start_date }: { pattern_id: string, start_date: string }) => {
      console.log('Materializing pattern', { pattern_id, start_date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  const syncShiftChecklistsMutation = useMutation({
    mutationFn: async ({ shift_id, checklist_ids }: { shift_id: string, checklist_ids: string[] }) => {
      console.log('Syncing shift checklists', { shift_id, checklist_ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  // Wrappers to keep the original function API
  const createShift = useCallback((shift: any) => createShiftMutation.mutateAsync(shift), [createShiftMutation]);
  const updateShift = useCallback((id: string, updates: any) => updateShiftMutation.mutateAsync({ id, updates }), [updateShiftMutation]);
  const deleteShift = useCallback((id: string) => deleteShiftMutation.mutateAsync(id), [deleteShiftMutation]);
  const bulkUpdateShifts = useCallback((ids: string[], updates: any) => bulkUpdateShiftsMutation.mutateAsync({ ids, updates }), [bulkUpdateShiftsMutation]);
  const bulkDeleteShifts = useCallback((ids: string[]) => bulkDeleteShiftsMutation.mutateAsync(ids), [bulkDeleteShiftsMutation]);
  const addShiftParticipant = useCallback((shift_id: string, participant_id: string) => addShiftParticipantMutation.mutateAsync({ shift_id, participant_id }), [addShiftParticipantMutation]);
  const removeShiftParticipant = useCallback((shift_id: string, participant_id: string) => removeShiftParticipantMutation.mutateAsync({ shift_id, participant_id }), [removeShiftParticipantMutation]);
  const syncShiftParticipants = useCallback((shift_id: string, participant_ids: string[]) => syncShiftParticipantsMutation.mutateAsync({ shift_id, participant_ids }), [syncShiftParticipantsMutation]);
  const materializeTemplate = useCallback((template_id: string, house_id: string, start_date: string) => materializeTemplateMutation.mutateAsync({ template_id, house_id, start_date }), [materializeTemplateMutation]);
  const materializePattern = useCallback((pattern_id: string, start_date: string) => materializePatternMutation.mutateAsync({ pattern_id, start_date }), [materializePatternMutation]);
  const syncShiftChecklists = useCallback((shift_id: string, checklist_ids: string[]) => syncShiftChecklistsMutation.mutateAsync({ shift_id, checklist_ids }), [syncShiftChecklistsMutation]);

  return {
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
    materializeTemplate,
    materializePattern,
    syncShiftChecklists,
  };
}
