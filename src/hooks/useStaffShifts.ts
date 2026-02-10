import { supabase } from '@/lib/supabase';

export interface StaffShift {
  id: string;
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_type: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  house?: {
    id: string;
    name: string;
  };
  participants?: Array<{
    id: string;
    name: string;
  }>;
  duration_hours?: number;
}

export interface ShiftParticipant {
  id: string;
  shift_id: string;
  participant_id: string;
  created_at?: string;
}

export const useStaffShifts = () => {
  const getStaffShifts = async (
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: StaffShift[] | null; error: any }> => {
    try {
      const { data: shifts, error: shiftsError } = await supabase
        .from('staff_shifts')
        .select(`
          id,
          staff_id,
          shift_date,
          start_time,
          end_time,
          house_id,
          shift_type,
          status,
          notes,
          created_at,
          updated_at,
          house:houses(id, name)
        `)
        .eq('staff_id', staffId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (shiftsError) {
        return { data: null, error: shiftsError };
      }

      if (!shifts || shifts.length === 0) {
        return { data: [], error: null };
      }

      const shiftIds = shifts.map((s) => s.id);
      const { data: participants, error: participantsError } = await supabase
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
        const shiftParticipants = participants
          ?.filter((p) => p.shift_id === shift.id)
          .map((p) => p.participant)
          .filter((p) => p !== null) || [];

        const duration = calculateDuration(shift.start_time, shift.end_time);

        return {
          ...shift,
          participants: shiftParticipants,
          duration_hours: duration,
        };
      });

      return { data: shiftsWithParticipants, error: null };
    } catch (error) {
      console.error('Error in getStaffShifts:', error);
      return { data: null, error };
    }
  };

  const createShift = async (
    shiftData: Omit<StaffShift, 'id' | 'created_at' | 'updated_at' | 'house' | 'participants' | 'duration_hours'>
  ): Promise<{ data: StaffShift | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert([shiftData])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createShift:', error);
      return { data: null, error };
    }
  };

  const updateShift = async (
    shiftId: string,
    updates: Partial<Omit<StaffShift, 'id' | 'created_at' | 'updated_at' | 'house' | 'participants' | 'duration_hours'>>
  ): Promise<{ data: StaffShift | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateShift:', error);
      return { data: null, error };
    }
  };

  const deleteShift = async (shiftId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteShift:', error);
      return { error };
    }
  };

  const getShiftParticipants = async (
    shiftId: string
  ): Promise<{ data: any[] | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('shift_participants')
        .select(`
          id,
          shift_id,
          participant_id,
          participant:participants(id, name)
        `)
        .eq('shift_id', shiftId);

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getShiftParticipants:', error);
      return { data: null, error };
    }
  };

  const addShiftParticipant = async (
    shiftId: string,
    participantId: string
  ): Promise<{ data: ShiftParticipant | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('shift_participants')
        .insert([{ shift_id: shiftId, participant_id: participantId }])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in addShiftParticipant:', error);
      return { data: null, error };
    }
  };

  const removeShiftParticipant = async (
    shiftId: string,
    participantId: string
  ): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('shift_participants')
        .delete()
        .eq('shift_id', shiftId)
        .eq('participant_id', participantId);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in removeShiftParticipant:', error);
      return { error };
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      let endMinutes = endHour * 60 + endMinute;

      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }

      const durationMinutes = endMinutes - startMinutes;
      return Math.round((durationMinutes / 60) * 10) / 10;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  };

  return {
    getStaffShifts,
    createShift,
    updateShift,
    deleteShift,
    getShiftParticipants,
    addShiftParticipant,
    removeShiftParticipant,
    calculateDuration,
  };
};
