import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { Database } from '@/models/database.types';

/**
 * Data Access Layer (DAL) for Timesheets.
 */
export const timesheetsApi = {
  /**
   * List timesheets with filters.
   */
  async list(params: {
    staffId?: string;
    houseId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const { staffId, houseId, startDate, endDate, status } = params;
    
    let query = supabase
      .from(TABLES.TIMESHEETS)
      .select(`
        *,
        staff:${TABLES.STAFF}!timesheets_staff_id_fkey(id, staff_name, auth_user_id),
        shift:${TABLES.STAFF_SHIFTS}!timesheets_shift_id_fkey(
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          shift_template,
          house:${TABLES.HOUSES}(id, house_name)
        )
      `)
      .order('clock_in', { ascending: false });

    if (staffId && staffId !== 'all') query = query.eq('staff_id', staffId);
    if (houseId && houseId !== 'all') query = query.eq(`${TABLES.STAFF_SHIFTS}.house_id`, houseId);
    if (startDate) query = query.gte('clock_in', startDate);
    if (endDate) query = query.lte('clock_in', endDate);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches all timesheets for a specific staff member.
   */
  async listByStaff(staffId: string) {
    const { data, error } = await supabase
      .from(TABLES.TIMESHEETS)
      .select(`
        id, shift_id, clock_in, clock_out, actual_start, actual_end,
        break_minutes, shift_notes_text, status, admin_notes,
        rejection_reason, submitted_at, incident_tag, sick_shift,
        overtime_hours, travel_km, created_at,
        shift:ic_staff_shifts!timesheets_shift_id_fkey(id, start_date, end_date, start_time, end_time, shift_template, house:ic_houses(house_name))
      `)
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Updates a timesheet.
   */
  async update(id: string, updates: Database['public']['Tables']['ic_timesheets']['Update']) {
    const { data, error } = await supabase
      .from(TABLES.TIMESHEETS)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches specific timesheets by shift and staff ID.
   * Note: Returns an array to handle potential data duplicates gracefully.
   */
  async getExisting(shiftId: string, staffId: string) {
    const { data, error } = await supabase
      .from(TABLES.TIMESHEETS)
      .select('id, actual_start, actual_end, break_minutes, overtime_explanation, travel_km, sick_shift, notes, status')
      .eq('shift_id', shiftId)
      .eq('staff_id', staffId)
      .order('status', { ascending: true }) // Prioritize 'approved' status
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Deletes a timesheet.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.TIMESHEETS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Creates a new timesheet.
   */
  async create(payload: Database['public']['Tables']['ic_timesheets']['Insert']) {
    const { data, error } = await supabase
      .from(TABLES.TIMESHEETS)
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
