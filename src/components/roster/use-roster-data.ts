import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
}

export interface StaffShift {
  id: string;
  staff_id: string;
  shift_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_type: string;
  shift_type_id?: string | null;
  status: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  house?: { id: string; name: string };
  participants?: Array<{ id: string; name: string; house_id?: string | null }>;
  assigned_checklists?: Array<{ id: string; checklist_id: string; assignment_title: string }>;
  staff_name?: string;
  duration_hours?: number;
  color_theme?: string;
  icon_name?: string;
}

export function useRosterData() {
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHouses = useCallback(async () => {
    try {
      // Use ilike for case-insensitive matching
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        console.error('Error loading houses for roster:', error);
        return;
      }
      
      if (data) {
        setHouses(data);
      }
    } catch (err) {
      console.error('Exception loading houses:', err);
    }
  }, []);

  const loadParticipants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, house_id, status')
        .eq('status', 'active')
        .not('name', 'is', null)
        .order('name');
      
      if (error) {
        console.error('Error loading participants for roster:', error);
        return;
      }
      
      if (data) {
        setParticipants(data);
      }
    } catch (err) {
      console.error('Exception loading participants:', err);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      console.log('Fetching active staff members with compliance...');
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id, name, photo_url, status, auth_user_id,
          compliance:staff_compliance(status)
        `)
        .eq('status', 'active')
        .not('name', 'is', null)
        .order('name');
      
      if (error) {
        console.error('Error loading staff for roster:', error);
        return;
      }
      
      const enrichedStaff = (data || []).map((s: any) => ({
        ...s,
        isQualified: !s.compliance?.some((c: any) => c.status === 'Expired' || c.status === 'Incomplete')
      }));

      console.log(`Loaded ${enrichedStaff.length} enriched staff members`);
      setStaff(enrichedStaff as Staff[]);
    } catch (err) {
      console.error('Exception loading staff:', err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadHouses(), 
        loadParticipants(), 
        loadStaff()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadHouses, loadParticipants, loadStaff]);

  const loadShifts = useCallback(async (staffId: string, startDate: string, endDate: string): Promise<StaffShift[]> => {
    setLoading(true);
    try {
      // Build the base query with all joins
      let query = supabase
        .from('staff_shifts')
        .select(`
          *,
          shift_type_id,
          house:houses(id, name),
          staff:staff(id, name),
          type_details:house_shift_types(color_theme, icon_name),
          participants:shift_participants(
            participant:participants(id, name)
          ),
          assigned_checklists:shift_assigned_checklists(
            id, checklist_id, assignment_title
          )
        `)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Apply staff filter if not 'all'
      if (staffId !== 'all') {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading shifts:', error);
        toast.error('Failed to load shifts');
        return [];
      }

      // Shared mapping logic
      return (data || []).map(shift => ({
        ...shift,
        participants: (shift.participants as any[])?.map((sp) => ({
          id: sp.participant.id,
          name: sp.participant.name,
        })) || [],
        assigned_checklists: shift.assigned_checklists || [],
        staff_name: shift.staff?.name || 'Unassigned',
        duration_hours: calculateDuration(shift.start_time, shift.end_time, shift.shift_date, shift.end_date ?? shift.shift_date),
        color_theme: (shift as any).type_details?.color_theme,
        icon_name: (shift as any).type_details?.icon_name,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const createShift = useCallback(async (shiftData: Partial<StaffShift>) => {
    const { data, error } = await supabase
      .from('staff_shifts')
      .insert([shiftData])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift:', error);
      throw error;
    }

    return data;
  }, []);

  const updateShift = useCallback(async (shiftId: string, updates: Partial<StaffShift>) => {
    const { error } = await supabase
      .from('staff_shifts')
      .update(updates)
      .eq('id', shiftId);

    if (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  }, []);

  const deleteShift = useCallback(async (shiftId: string) => {
    const { error } = await supabase
      .from('staff_shifts')
      .delete()
      .eq('id', shiftId);

    if (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  }, []);

  const addShiftParticipant = useCallback(async (shiftId: string, participantId: string) => {
    const { error } = await supabase
      .from('shift_participants')
      .insert([{ shift_id: shiftId, participant_id: participantId }]);

    if (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }, []);

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
  }, []);

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
            checklists:shift_template_item_checklists(checklist_id, checklist:house_checklists(name))
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
            .eq('shift_date', date)
            .eq('start_time', item.start_time)
            .eq('shift_type', item.shift_type.name)
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }

          // Create the Shift
          const { data: newShift, error: shiftError } = await supabase
            .from('staff_shifts')
            .insert({
              house_id: params.houseId,
              shift_date: date,
              start_time: item.start_time,
              end_time: item.end_time,
              shift_type: item.shift_type.name,
              status: 'scheduled',
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
        }
      }

      return { created: createdCount, skipped: skippedCount };
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, []);

  return {
    houses,
    participants,
    staff,
    loading,
    loadHouses,
    loadParticipants,
    loadStaff,
    loadAllData,
    loadShifts,
    createShift,
    updateShift,
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant,
    syncShiftChecklists,
  };
}
