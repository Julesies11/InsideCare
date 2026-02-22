import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { calculateDuration } from './roster-utils';

export interface House {
  id: string;
  name: string;
}

export interface Participant {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
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
  participants?: Array<{ id: string; name: string }>;
  staff_name?: string;
  duration_hours?: number;
}

export function useRosterData() {
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHouses = useCallback(async () => {
    const { data, error } = await supabase
      .from('houses')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    
    if (!error && data) {
      setHouses(data);
    }
  }, []);

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');
    
    if (!error && data) {
      setParticipants(data);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name')
      .neq('status', 'draft')
      .not('name', 'is', null)
      .order('name');
    
    if (!error && data) {
      setStaff(data);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    await Promise.all([loadHouses(), loadParticipants(), loadStaff()]);
  }, [loadHouses, loadParticipants, loadStaff]);

  const loadShifts = useCallback(async (staffId: string, startDate: string, endDate: string): Promise<StaffShift[]> => {
    setLoading(true);
    try {
      if (staffId === 'all') {
        const { data, error } = await supabase
          .from('staff_shifts')
          .select(`
            *,
            house:houses(id, name),
            participants:shift_participants(
              participant:participants(id, name)
            ),
            staff:staff(id, name)
          `)
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('shift_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error loading shifts:', error);
          toast.error('Failed to load shifts');
          return [];
        }

        const formattedShifts = (data || []).map(shift => ({
          ...shift,
          participants: shift.participants?.map((sp: any) => ({
            id: sp.participant.id,
            name: sp.participant.name,
          })) || [],
          staff_name: shift.staff?.name || 'Unassigned',
          duration_hours: calculateDuration(shift.start_time, shift.end_time, shift.shift_date, shift.end_date ?? shift.shift_date),
        }));

        return formattedShifts;
      } else {
        const { data: shifts, error: shiftsError } = await supabase
          .from('staff_shifts')
          .select('*, house:houses(id, name)')
          .eq('staff_id', staffId)
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('shift_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (shiftsError) {
          console.error('Error loading shifts:', shiftsError);
          toast.error('Failed to load shifts');
          return [];
        }

        if (!shifts || shifts.length === 0) {
          return [];
        }

        const shiftIds = shifts.map((s) => s.id);
        const { data: participantsData, error: participantsError } = await supabase
          .from('shift_participants')
          .select(`
            shift_id,
            participant:participants(id, name)
          `)
          .in('shift_id', shiftIds);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
        }

        const shiftsWithParticipants = shifts.map((shift) => {
          const shiftParticipants = participantsData
            ?.filter((p) => p.shift_id === shift.id)
            .map((p) => p.participant ? {
              id: p.participant.id,
              name: p.participant.name
            } : null)
            .filter((p) => p !== null) || [];

          const duration = calculateDuration(shift.start_time, shift.end_time, shift.shift_date, shift.end_date ?? shift.shift_date);

          return {
            ...shift,
            participants: shiftParticipants,
            duration_hours: duration,
          };
        });

        return shiftsWithParticipants;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createShift = useCallback(async (shiftData: any) => {
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

  const updateShift = useCallback(async (shiftId: string, updates: any) => {
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
