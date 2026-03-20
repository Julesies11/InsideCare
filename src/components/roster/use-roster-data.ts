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
  photo_url?: string | null;
  status?: string;
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
  status: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  house?: { id: string; name: string };
  participants?: Array<{ id: string; name: string; house_id?: string | null }>;
  staff_name?: string;
  duration_hours?: number;
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
      console.log('Fetching active staff members...');
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, photo_url, status')
        .eq('status', 'active')
        .not('name', 'is', null)
        .order('name');
      
      if (error) {
        console.error('Error loading staff for roster:', error);
        return;
      }
      
      console.log(`Loaded ${data?.length || 0} active staff members`);
      if (data) {
        setStaff(data as Staff[]);
      }
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
          house:houses(id, name),
          staff:staff(id, name),
          participants:shift_participants(
            participant:participants(id, name)
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
        staff_name: shift.staff?.name || 'Unassigned',
        duration_hours: calculateDuration(shift.start_time, shift.end_time, shift.shift_date, shift.end_date ?? shift.shift_date),
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
  };
}
