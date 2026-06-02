import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { SHIFT_NOTE_VIEWS } from '@/config/query-views';

export interface ShiftNoteUpdateData {
  participant_id?: string | null;
  staff_id?: string | null;
  start_date?: string;
  shift_time?: string | null;
  house_id?: string | null;
  shift_id?: string | null;
  notes?: string | null;
  full_note?: string | null;
}

export const shiftNotesApi = {
  /**
   * List shift notes with optional filters.
   */
  async list() {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get shift notes by shift ID.
   */
  async getByShiftId(shiftId: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a specific shift note by shift ID and staff ID.
   */
  async getByShiftAndStaff(shiftId: string, staffId: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('shift_id', shiftId)
      .eq('staff_id', staffId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get shift notes by participant ID.
   */
  async getByParticipantId(participantId: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('participant_id', participantId)
      .order('start_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create or upsert a shift note.
   */
  async create(noteData: ShiftNoteUpdateData) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .upsert(noteData, { onConflict: 'shift_id,staff_id' })
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("You do not have permission to perform this action");
    return data;
  },

  /**
   * Update an existing shift note.
   */
  async update(id: string, updates: ShiftNoteUpdateData) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .update(updates)
      .eq('id', id)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("You do not have permission to perform this action");
    return data;
  },

  /**
   * Delete a shift note.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
