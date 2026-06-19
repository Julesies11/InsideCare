import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

export type StaffAvailabilityRow = Database['public']['Tables']['ic_staff_availability']['Row'];
export type StaffAvailabilityInsert = Database['public']['Tables']['ic_staff_availability']['Insert'];
export type StaffAvailabilityUpdate = Database['public']['Tables']['ic_staff_availability']['Update'];

/**
 * Data Access Layer (DAL) for Staff Availability.
 */
export const availabilityApi = {
  /**
   * List all active availability blocks for a given staff member.
   */
  async listForStaff(staffId: string): Promise<StaffAvailabilityRow[]> {
    const { data, error } = await supabase
      .from(TABLES.STAFF_AVAILABILITY)
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('day_of_week', { ascending: true })
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * List all active availability blocks across all staff (used for bulk roster conflict checks).
   */
  async listAll(): Promise<StaffAvailabilityRow[]> {
    const { data, error } = await supabase
      .from(TABLES.STAFF_AVAILABILITY)
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert one or more availability records.
   */
  async upsert(
    blocks: StaffAvailabilityInsert | StaffAvailabilityInsert[],
  ): Promise<StaffAvailabilityRow[]> {
    const payload = Array.isArray(blocks) ? blocks : [blocks];
    
    // Sanitize audit columns to avoid DB errors
    const sanitized = payload.map(b => {
      const copy = { ...b };
      delete (copy as any).created_at;
      delete (copy as any).updated_at;
      delete (copy as any).created_by;
      delete (copy as any).updated_by;
      return copy;
    });

    const { data, error } = await supabase
      .from(TABLES.STAFF_AVAILABILITY)
      .upsert(sanitized)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Soft deletes a specific availability record.
   */
  async softDelete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.STAFF_AVAILABILITY)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};
