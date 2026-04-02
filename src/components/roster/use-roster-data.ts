import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateDuration } from './roster-utils';

export interface House {
  id: string;
  name: string;
  status?: string;
}

export interface Participant {
  id: string;
  name: string;
  house_id?: string | null;
  status?: string;
}

export interface Staff {
  id: string;
  name: string;
  photo_url?: string;
  status: string;
  auth_user_id?: string;
  isQualified?: boolean;
  house_assignments?: Array<{ house_id: string; end_date: string | null }>;
}

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
  org_shift_template_id?: string | null;
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
          id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_type, shift_type_id, org_shift_template_id, notes,
          type_details:house_shift_types(color_theme, icon_name),
          org_template_details:org_shift_templates(color_theme, icon_name),
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
  const colorTheme = shift.org_template_details?.color_theme || shift.type_details?.color_theme;
  const iconName = shift.org_template_details?.icon_name || shift.type_details?.icon_name;

  return {
    ...shift,
    house: shift.house_id ? houseMap.get(shift.house_id) : undefined,

        staff_name: shift.staff_id ? staffMap.get(shift.staff_id) || 'Unassigned' : 'Unassigned',
        participants: shift.participants?.map((sp: any) => ({
          id: sp.participant.id,
          name: sp.participant.name,
        })) || [],
        assigned_checklists: shift.assigned_checklists?.map((ac: any) => ({
          ...ac,
          is_completed: ac.submissions?.some((s: any) => s.status === 'Completed')
        })) || [],
        duration_hours: calculateDuration(shift.start_time, shift.end_time, shift.start_date, shift.end_date ?? shift.start_date),
        color_theme: colorTheme,
        icon_name: iconName,
        notesCount: shift.notes_count?.[0]?.count || 0,
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
  const [loading, setLoading] = useState(false);

  const housesQuery = useQuery({
    queryKey: ['roster-houses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data as House[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const participantsQuery = useQuery({
    queryKey: ['roster-participants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, house_id, status')
        .eq('status', 'active')
        .not('name', 'is', null)
        .order('name');
      
      if (error) throw error;
      return data as Participant[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const staffQuery = useQuery({
    queryKey: ['roster-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id, name, photo_url, status, auth_user_id,
          compliance:staff_compliance(status),
          house_assignments:house_staff_assignments(house_id, end_date)
        `)
        .eq('status', 'active')
        .not('name', 'is', null)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map((s: any) => ({
        ...s,
        isQualified: !s.compliance?.some((c: any) => c.status === 'Expired' || c.status === 'Incomplete')
      })) as Staff[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const syncShiftParticipants = useCallback(async (shiftId: string, participantIds: string[]) => {
    // 1. Get existing participants
    const { data: existing, error: fetchError } = await supabase
      .from('shift_participants')
      .select('participant_id')
      .eq('shift_id', shiftId);

    if (fetchError) {
      console.error('Error fetching existing participants:', fetchError);
      throw fetchError;
    }

    const existingIds = (existing || []).map(p => p.participant_id);
    
    // 2. Determine which to add and remove
    const toAdd = participantIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !participantIds.includes(id));

    // 3. Perform deletions
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('shift_participants')
        .delete()
        .eq('shift_id', shiftId)
        .in('participant_id', toRemove);
      
      if (deleteError) throw deleteError;
    }

    // 4. Perform insertions
    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('shift_participants')
        .insert(toAdd.map(id => ({ shift_id: shiftId, participant_id: id })));
      
      if (insertError) throw insertError;
    }
    
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const createShift = useCallback(async (shiftData: Partial<StaffShift>) => {
    // Filter out non-column fields
    const { 
      participants: _participants, 
      participant_ids: _participant_ids, 
      assigned_checklists: _assigned_checklists, 
      house: _house, 
      staff: _staff, 
      staff_name: _staff_name, 
      duration_hours: _duration_hours, 
      color_theme: _color_theme, 
      icon_name: _icon_name, 
      status: _status, 
      type_details: _type_details, 
      org_template_details: _org_template_details, 
      ...dbData 
    } = shiftData as any;

    const { data, error } = await supabase
      .from('staff_shifts')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    return data;
  }, [queryClient]);

  const updateShift = useCallback(async (shiftId: string, updates: Partial<StaffShift>) => {
    // Filter out non-column fields
    const { 
      participants: _participants, 
      participant_ids: _participant_ids, 
      assigned_checklists: _assigned_checklists, 
      house: _house, 
      staff: _staff, 
      staff_name: _staff_name, 
      duration_hours: _duration_hours, 
      color_theme: _color_theme, 
      icon_name: _icon_name, 
      status: _status, 
      type_details: _type_details, 
      org_template_details: _org_template_details, 
      ...dbData 
    } = updates as any;

    const { error } = await supabase
      .from('staff_shifts')
      .update(dbData)
      .eq('id', shiftId);

    if (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const deleteShift = useCallback(async (shiftId: string) => {
    const { error } = await supabase
      .from('staff_shifts')
      .delete()
      .eq('id', shiftId);

    if (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const bulkDeleteShifts = useCallback(async (params: {
    houseId?: string;
    startDate: string;
    endDate: string;
    staffId?: string;
    shiftTypeId?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('staff_shifts')
        .delete()
        .gte('start_date', params.startDate)
        .lte('start_date', params.endDate);

      if (params.houseId && params.houseId !== 'all') {
        query = query.eq('house_id', params.houseId);
      }
      if (params.staffId && params.staffId !== 'all') {
        query = query.eq('staff_id', params.staffId);
      }
      if (params.shiftTypeId && params.shiftTypeId !== 'all') {
        query = query.eq('shift_type_id', params.shiftTypeId);
      }

      const { error } = await query;
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
      return true;
    } catch (err) {
      console.error('Bulk delete failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const bulkUpdateShifts = useCallback(async (params: {
    houseId?: string;
    startDate: string;
    endDate: string;
    staffId?: string;
    shiftTypeId?: string;
  }, updates: Partial<StaffShift>) => {
    setLoading(true);
    try {
      let query = supabase
        .from('staff_shifts')
        .update(updates)
        .gte('start_date', params.startDate)
        .lte('start_date', params.endDate);

      if (params.houseId && params.houseId !== 'all') {
        query = query.eq('house_id', params.houseId);
      }
      if (params.staffId && params.staffId !== 'all') {
        query = query.eq('staff_id', params.staffId);
      }
      if (params.shiftTypeId && params.shiftTypeId !== 'all') {
        query = query.eq('shift_type_id', params.shiftTypeId);
      }

      const { error } = await query;
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
      return true;
    } catch (err) {
      console.error('Bulk update failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const addShiftParticipant = useCallback(async (shiftId: string, participantId: string) => {
    const { error } = await supabase
      .from('shift_participants')
      .insert([{ shift_id: shiftId, participant_id: participantId }]);

    if (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const removeShiftParticipant = useCallback(async (shiftId: string, participantId: string) => {
    const { error } = await supabase
      .from('shift_participants')
      .delete()
      .eq('shift_id', shiftId)
      .eq('participant_id', participantId);

    if (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const materializeTemplate = useCallback(async (params: { 
    templateId: string, 
    houseId: string, 
    startDate: string, 
    endDate: string,
    withAssignments?: boolean,
    sourceShiftIds?: string[] // Optional: only materialize specific source shifts if copying
  }) => {
    try {
      setLoading(true);
      
      // 1. Fetch the template group with all its items and custom checklists
      const { data: group, error: groupError } = await supabase
        .from('shift_template_groups')
        .select(`
          *,
          items:shift_template_items(
            *,
            shift_type:house_shift_types(id, name),
            checklists:shift_template_item_checklists(checklist_id, checklist:house_checklists(name)),
            participants:shift_template_item_participants(participant_id)
          )
        `)
        .eq('id', params.templateId)
        .single();

      if (groupError) throw groupError;
      if (!group.items || group.items.length === 0) return { created: 0, skipped: 0 };

      // 2. Fetch Default Checklists for these shift types as fallback
      const shiftTypeIds = group.items.map((i: any) => i.shift_type_id);
      const { data: defaults } = await supabase
        .from('shift_type_default_checklists')
        .select('shift_type_id, checklist_id, checklist:house_checklists(name)')
        .in('shift_type_id', shiftTypeIds);

      // 3. Prepare Date Range (simplified for now, usually one day or expanded via RRule)
      // For a single "Apply" action, we'll assume startDate to endDate.
      const dates = [];
      const current = new Date(params.startDate);
      const end = new Date(params.endDate);
      while (current <= end) {
        dates.push(new Date(current).toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      let createdCount = 0;
      let skippedCount = 0;

      // 4. Loop through dates and items
      for (const date of dates) {
        for (const item of group.items) {
          // Check for existing shift to avoid duplicates
          const { data: existing } = await supabase
            .from('staff_shifts')
            .select('id')
            .eq('house_id', params.houseId)
            .eq('start_date', date)
            .eq('start_time', item.start_time)
            .eq('shift_type', item.shift_type.name)
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }

          // Create the Shift
          const isOvernight = item.end_time < item.start_time;
          let shiftEndDate = date;
          if (isOvernight) {
             const d = new Date(date);
             d.setDate(d.getDate() + 1);
             shiftEndDate = d.toISOString().split('T')[0];
          }

          const { data: newShift, error: shiftError } = await supabase
            .from('staff_shifts')
            .insert({
              house_id: params.houseId,
              start_date: date,
              end_date: shiftEndDate,
              start_time: item.start_time,
              end_time: item.end_time,
              shift_type: item.shift_type.name,
              template_item_id: item.id
            })
            .select()
            .single();

          if (shiftError) throw shiftError;
          createdCount++;

          // Attach Checklists (Custom Overrides > Defaults)
          let checklistsToAssign = [];
          if (item.checklists && item.checklists.length > 0) {
            checklistsToAssign = item.checklists.map((c: any) => ({
              checklist_id: c.checklist_id,
              assignment_title: c.checklist.name
            }));
          } else {
            // Fallback to defaults
            const itemDefaults = defaults?.filter(d => d.shift_type_id === item.shift_type_id) || [];
            checklistsToAssign = itemDefaults.map(d => ({
              checklist_id: d.checklist_id,
              assignment_title: d.checklist.name
            }));
          }

          if (checklistsToAssign.length > 0) {
            const toInsert = checklistsToAssign.map((cl, index) => ({
              shift_id: newShift.id,
              checklist_id: cl.checklist_id,
              assignment_title: cl.assignment_title,
              sort_order: index
            }));
            await supabase.from('shift_assigned_checklists').insert(toInsert);
          }

          // Attach Participants (from template item overrides)
          if (item.participants && item.participants.length > 0) {
            const participantsToInsert = item.participants.map((p: any) => ({
              shift_id: newShift.id,
              participant_id: p.participant_id
            }));
            await supabase.from('shift_participants').insert(participantsToInsert);
          }
        }
      }
      
      if (createdCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
      }
      return { created: createdCount, skipped: skippedCount };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const bulkMaterializeTemplate = useCallback(async (params: {
    templateId: string,
    houseIds: string[],
    startDate: string,
    endDate: string,
    withAssignments?: boolean,
    sourceShiftIds?: string[]
  }) => {
    setLoading(true);
    try {
      let totalCreated = 0;
      let totalSkipped = 0;
      for (const houseId of params.houseIds) {
        const result = await materializeTemplate({
          templateId: params.templateId,
          houseId,
          startDate: params.startDate,
          endDate: params.endDate,
          withAssignments: params.withAssignments,
          sourceShiftIds: params.sourceShiftIds
        });
        totalCreated += result.created;
        totalSkipped += result.skipped;
      }
      return { created: totalCreated, skipped: totalSkipped };
    } finally {
      setLoading(false);
    }
  }, [materializeTemplate]);

  const syncShiftChecklists = useCallback(async (shiftId: string, checklists: any[]) => {
    // Simple approach: delete existing and insert new
    const { error: deleteError } = await supabase
      .from('shift_assigned_checklists')
      .delete()
      .eq('shift_id', shiftId);

    if (deleteError) {
      console.error('Error clearing checklists:', deleteError);
      throw deleteError;
    }

    if (checklists.length > 0) {
      const toInsert = checklists.map((cl, index) => ({
        shift_id: shiftId,
        checklist_id: cl.checklist_id,
        assignment_title: cl.assignment_title,
        sort_order: index
      }));

      const { error: insertError } = await supabase
        .from('shift_assigned_checklists')
        .insert(toInsert);

      if (insertError) {
        console.error('Error syncing checklists:', insertError);
        throw insertError;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
  }, [queryClient]);

  const materializePattern = useCallback(async (params: {
    houseId: string,
    houseName: string,
    startDate: string,
    endDate: string,
    pattern: Record<number, string[]>[], // Array of weeks, each week is dayIndex -> shiftTypeIds
    shiftTypes: any[],
    defaults: any[],
    participants: any[]
  }) => {
    setLoading(true);
    let createdCount = 0;
    let skippedCount = 0;
    let checklistCount = 0;
    
    try {
      const { eachDayOfInterval, format, getDay, differenceInCalendarDays, startOfDay } = await import('date-fns');
      const interval = eachDayOfInterval({
        start: new Date(params.startDate),
        end: new Date(params.endDate)
      });
      
      const startDay = startOfDay(new Date(params.startDate));
      const rotationWeeks = params.pattern.length || 1;

      // Fetch existing shifts for the given date range to avoid duplicates
      const { data: existingShifts, error: existingError } = await supabase
        .from('staff_shifts')
        .select('id, start_date, shift_type_id, start_time, end_time')
        .eq('house_id', params.houseId)
        .gte('start_date', params.startDate)
        .lte('start_date', params.endDate);

      if (existingError) throw existingError;

      for (const date of interval) {
        const dayIndex = getDay(date);
        const daysDiff = differenceInCalendarDays(startOfDay(date), startDay);
        const weekIndex = Math.floor(daysDiff / 7) % rotationWeeks;
        
        const selectedTypes = params.pattern[weekIndex]?.[dayIndex] || [];
        const dateStr = format(date, 'yyyy-MM-dd');

        for (const typeId of selectedTypes) {
          const type = params.shiftTypes.find(t => t.id === typeId);
          if (!type) continue;

          // Duplicate check
          const isDuplicate = existingShifts?.some(s => 
            s.start_date === dateStr &&
            s.shift_type_id === type.id &&
            s.start_time === type.default_start_time &&
            s.end_time === type.default_end_time
          );

          if (isDuplicate) {
            skippedCount++;
            continue;
          }

          // 1. Create the Shift (Confirmed & Open)
          const isOvernight = type.default_end_time < type.default_start_time;
          let shiftEndDate = dateStr;
          if (isOvernight) {
             const d = new Date(date);
             d.setDate(d.getDate() + 1);
             shiftEndDate = format(d, 'yyyy-MM-dd');
          }

          const { data: newShift, error: shiftError } = await supabase
            .from('staff_shifts')
            .insert({
              house_id: params.houseId,
              start_date: dateStr,
              end_date: shiftEndDate,
              start_time: type.default_start_time,
              end_time: type.default_end_time,
              shift_type: type.name,
              shift_type_id: type.id,
              staff_id: null,      
              notes: `Auto-generated from Shift Model for ${params.houseName}`
            })
            .select()
            .single();

          if (shiftError) throw shiftError;
          createdCount++;

          // 2. Assign Default Checklists
          const typeDefaults = params.defaults?.filter(d => d.shift_type_id === type.id) || [];
          if (typeDefaults.length > 0) {
            const checklistPayload = typeDefaults.map((d, index) => ({
              shift_id: newShift.id,
              checklist_id: d.checklist_id,
              assignment_title: d.checklist?.name || type.name,
              sort_order: index
            }));
            const { error: clErr } = await supabase.from('shift_assigned_checklists').insert(checklistPayload);
            if (!clErr) checklistCount += checklistPayload.length;
          }

          // 3. Assign Active Participants
          const activeParticipants = params.participants.filter(p => p.status === 'active');
          if (activeParticipants.length > 0) {
            const participantPayload = activeParticipants.map(p => ({
              shift_id: newShift.id,
              participant_id: p.id
            }));
            await supabase.from('shift_participants').insert(participantPayload);
          }
        }
      }
      if (createdCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
      }
      return { created: createdCount, skipped: skippedCount, checklists: checklistCount };
    } catch (err) {
      console.error('materializePattern error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);
return {
  houses: housesQuery.data || [],
  participants: participantsQuery.data || [],
  staff: staffQuery.data || [],
  loading: loading || housesQuery.isLoading || participantsQuery.isLoading || staffQuery.isLoading,
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
  bulkMaterializeTemplate,
  materializePattern,
  syncShiftChecklists,
};
}

