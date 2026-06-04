import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { SHIFT_NOTE_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';

type ShiftNoteInsert = Database['public']['Tables']['ic_shift_notes']['Insert'];

/**
 * Type-safe list of valid database columns for ic_shift_notes.
 * Derived from Database types to ensure schema alignment.
 */
const VALID_SHIFT_NOTE_COLUMNS: (keyof ShiftNoteInsert)[] = [
  'adl_supports', 'behaviour_intensity', 'behaviour_notes', 'behaviour_observed', 
  'behaviour_type_id', 'bowel_amount', 'bowel_assistance_required', 'bowel_bristol_scale', 
  'bowel_movement_occurred', 'bowel_notes', 'bowel_time', 'capacity_building_goals', 
  'community_access_occurred', 'community_activity_type', 'community_engagement_level', 
  'community_location', 'community_notes', 'domestic_tasks', 'full_note', 'house_id', 
  'hygiene_grooming', 'hygiene_notes', 'hygiene_observed_concerns', 'hygiene_oral_care', 
  'hygiene_shower', 'hygiene_support_required', 'hygiene_toileting', 'id', 'meal_provided', 
  'mtm_concerns', 'mtm_consistency_correct', 'mtm_consistency_notes', 'mtm_diet_type', 'mtm_fluid_intake', 
  'mtm_fluid_intake_notes', 'mtm_fluids', 'mtm_meal_intake', 'mtm_meal_intake_notes', 
  'mtm_meal_provided', 'mtm_notes', 'mtm_positioning_appropriate', 'mtm_positioning_notes', 'mtm_supervision_required', 
  'mtm_supervision_notes', 'mtm_swallowing_concerns', 'mtm_texture_correct', 'mtm_texture_notes', 'notes', 'nutrition_assistance_needed', 
  'nutrition_fluids_intake', 'nutrition_intake', 'nutrition_meal_type', 'nutrition_notes', 
  'nutrition_refusal_alternatives', 'overall_presentation', 'participant_id', 'pbs_outcome', 
  'pbs_strategies_details', 'pbs_strategies_used', 'pbs_when_used', 'prn_description', 
  'prn_medication_given', 'regular_medication_status', 'restrictive_practices_status', 
  'risk_description', 'risks_observed', 'seizure_description', 'seizure_duration_minutes', 
  'seizure_emergency_services', 'seizure_injury_description', 'seizure_injury_occurred', 
  'seizure_notes', 'seizure_occurred', 'seizure_time_started', 'seizure_type_id', 
  'shift_id', 'shift_summary', 'shift_time', 'shift_type', 'sleep_occurred', 
  'sleep_quality', 'sleep_start_time', 'sleep_support_required', 'sleep_type_period', 
  'sleep_wake_time', 'staff_id', 'start_date'
];

export interface ShiftNoteUpdateData extends Partial<ShiftNoteInsert> {
  // Add status explicitly as it may not be in the generated types yet
  status?: 'active' | 'inactive' | 'draft' | 'archived';
}

export const shiftNotesApi = {
  /**
   * Internal helper to strip non-existent columns from payloads to prevent 42703/PGRST204 errors.
   */
  sanitizePayload(payload: any): ShiftNoteInsert {
    const sanitized: any = {};
    
    // We combine the typed valid columns with 'status' which we added manually
    const allValid = [...VALID_SHIFT_NOTE_COLUMNS, 'status' as const];
    
    Object.keys(payload).forEach(key => {
      if (allValid.includes(key as any)) {
        let value = payload[key];
        
        // Data Integrity: Convert empty strings to null (except for 'notes' which might be intentionally empty)
        if (value === '' && key !== 'notes') {
          value = null;
        }
        
        sanitized[key] = value;
      }
    });

    // Remove system-managed audit fields if they were passed
    delete sanitized.created_at;
    delete sanitized.updated_at;
    delete sanitized.created_by;
    delete sanitized.updated_by;

    return sanitized;
  },

  /**
   * List documentation tasks (Shift + Participant pairs) and their completion status.
   */
  async listNoteTasks(params: { staffId?: string; participantId?: string; houseId?: string; startDate?: string } = {}) {
    const { staffId, participantId, houseId, startDate } = params;

    // Default to last 60 days if no start date provided to ensure performance
    const defaultStartDate = format(subDays(new Date(), 60), 'yyyy-MM-dd');
    const effectiveStartDate = startDate || defaultStartDate;

    let query = supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(`
        id,
        start_date,
        end_date,
        start_time,
        end_time,
        shift_template,
        house_id,
        staff_id,
        house:${TABLES.HOUSES}!house_id(house_name),
        staff:${TABLES.STAFF}!staff_id(staff_name, photo_url),
        participants:${TABLES.SHIFT_PARTICIPANTS}!shift_id(
          participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name, photo_url)
        ),
        notes:${TABLES.SHIFT_NOTES}!shift_id(
          id,
          status,
          participant_id
        )
      `)
      .gte('start_date', effectiveStartDate)
      .order('start_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (staffId && staffId !== 'all') query = query.eq('staff_id', staffId);
    if (houseId && houseId !== 'all') query = query.eq('house_id', houseId);
    
    const { data, error } = await query;
    if (error) throw error;

    // Explode shifts into tasks (one task per shift, listing all participants)
    const tasks: any[] = [];

    (data || []).forEach(shift => {
      const shiftParticipants = (shift as any).participants || [];
      const participantNames = shiftParticipants
        .map((p: any) => p.participant?.participant_name)
        .filter(Boolean)
        .join(', ');
      
      // If no participants are assigned, create a single task for a potential general house note
      // Only show this if we ARE NOT filtering for a specific participant
      if (shiftParticipants.length === 0) {
        if (participantId) return;

        const note = (shift as any).notes?.find((n: any) => !n.participant_id);
        tasks.push({
          id: `${shift.id}-general`,
          shift_id: shift.id,
          participant_id: null,
          participant_name: '(No Participants Assigned)',
          participant_names: '(No Participants Assigned)',
          staff_id: shift.staff_id,
          staff_name: (shift as any).staff?.staff_name,
          staff_photo_url: (shift as any).staff?.photo_url,
          house_id: shift.house_id,
          house_name: (shift as any).house?.house_name,
          start_date: shift.start_date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_template: shift.shift_template,
          note_id: note?.id,
          note_status: note?.status || null
        });
      } else {
        // Filter out participants if we are looking for a specific one
        const filteredParticipants = participantId 
          ? shiftParticipants.filter((p: any) => p.participant?.id === participantId)
          : shiftParticipants;

        if (filteredParticipants.length === 0) return;

        // Find a relevant note for status tracking:
        // 1. If we are filtering by participantId, find a note for THAT participant.
        // 2. Otherwise, find ANY note for this shift.
        const note = participantId 
          ? (shift as any).notes?.find((n: any) => n.participant_id === participantId)
          : (shift as any).notes?.[0];
        
        tasks.push({
          id: shift.id,
          shift_id: shift.id,
          participant_id: filteredParticipants[0]?.participant?.id || null,
          participant_name: participantNames,
          participant_names: participantNames,
          participant_photo_url: filteredParticipants[0]?.participant?.photo_url || null,
          staff_id: shift.staff_id,
          staff_name: (shift as any).staff?.staff_name,
          staff_photo_url: (shift as any).staff?.photo_url,
          house_id: shift.house_id,
          house_name: (shift as any).house?.house_name,
          start_date: shift.start_date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_template: shift.shift_template,
          note_id: note?.id,
          note_status: note?.status || null
        });
      }
    });

    return tasks;
  },

  /**
   * List shift notes with optional filters.
   */
  async list(includeInactive = false) {
    let query = supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a specific shift note by its ID.
   */
  async get(id: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * List shift notes by staff ID.
   */
  async listByStaff(staffId: string, includeInactive = false) {
    let query = supabase
      .from(TABLES.SHIFT_NOTES)
      .select(`
        *,
        participant:${TABLES.PARTICIPANTS}!participant_id(participant_name),
        staff:${TABLES.STAFF}!staff_id(staff_name)
      `)
      .eq('staff_id', staffId);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get shift notes by shift ID.
   */
  async getByShiftId(shiftId: string, includeInactive = false) {
    let query = supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('shift_id', shiftId);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get specific shift notes by shift ID, staff ID, and participant ID.
   * Note: Returns an array to handle potential data duplicates gracefully.
   */
  async getByShiftAndStaff(shiftId: string, staffId: string, participantId?: string) {
    let query = supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('shift_id', shiftId)
      .eq('staff_id', staffId)
      .eq('status', 'active');

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query
      // Prioritize notes that are likely more complete
      .order('overall_presentation', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get shift notes by participant ID.
   */
  async getByParticipantId(participantId: string, includeInactive = false) {
    let query = supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .eq('participant_id', participantId);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query
      .order('start_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create or upsert a shift note.
   */
  async upsert(noteData: ShiftNoteUpdateData) {
    const payload = this.sanitizePayload(noteData);

    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .upsert({ ...payload, status: payload.status || 'active' }, { 
        onConflict: 'shift_id,staff_id,participant_id' 
      })
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("You do not have permission to perform this action");
    return data;
  },

  /**
   * Legacy alias for upsert to prevent TypeErrors from stale code or cache.
   */
  async create(noteData: ShiftNoteUpdateData) {
    return this.upsert(noteData);
  },

  /**
   * Update an existing shift note.
   */
  async update(id: string, updates: ShiftNoteUpdateData) {
    const payload = this.sanitizePayload(updates);

    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .update(payload)
      .eq('id', id)
      .select(SHIFT_NOTE_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("You do not have permission to perform this action");
    return data;
  },

  /**
   * Soft-delete a shift note by setting its status to 'inactive'.
   */
  async archive(id: string) {
    const { error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Permanently delete a shift note (Admin only).
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
