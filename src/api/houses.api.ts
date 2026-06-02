import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { HOUSE_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';

export interface HousesFilter {
  search?: string;
  statuses?: string[];
}

export interface HousesSort {
  id: string;
  desc: boolean;
}

/**
 * Data Access Layer (DAL) for Houses.
 */
export const housesApi = {
  /**
   * Helper to strip non-existent columns from payloads to prevent 42703 errors.
   */
  sanitizeRecord(record: any, forbidden: string[] = []) {
    const sanitized = { ...record };
    forbidden.forEach(key => delete sanitized[key]);
    
    // Standard system-managed fields that should never be sent in mutations
    const systemFields = ['created_at', 'updated_at', 'created_by', 'updated_by'];
    systemFields.forEach(key => delete sanitized[key]);
    
    return sanitized;
  },

  /**
   * Fetches a paginated list of houses with relations.
   */
  async list({
    pageIndex = 0,
    pageSize = 10,
    sort = [],
    filters = {},
    branchId
  }: {
    pageIndex?: number;
    pageSize?: number;
    sort?: HousesSort[];
    filters?: HousesFilter;
    branchId?: string;
  } = {}) {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from(TABLES.HOUSES)
      .select(HOUSE_VIEWS.STANDARD, { count: 'exact' });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (filters.search) {
      query = query.or(`house_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,house_manager.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses as any);
    }

    if (sort.length > 0) {
      sort.forEach(s => {
        const column = s.id === 'name' || s.id === 'house_name' ? 'house_name' : s.id;
        query = query.order(column as any, { ascending: !s.desc });
      });
    } else {
      query = query.order('house_name', { ascending: true });
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    // Calculate active staff count on the client side for each house
    const formattedData = (data || []).map((house: any) => {
      const activeStaffCount = (house.staff_assignments || []).filter((assignment: any) => {
        const staffObj = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff;
        const isStaffActive = staffObj?.status === 'active';
        const isAssignmentActive = !assignment.end_date || assignment.end_date >= today;
        return isStaffActive && isAssignmentActive;
      }).length;

      return {
        ...house,
        staff_assignments: [{ count: activeStaffCount }]
      };
    });

    return { data: formattedData, count: count || 0 };
  },

  /**
   * Fetches all active houses.
   */
  async listActive() {
    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .select('id, house_name, status, branch_id')
      .eq('status', 'active')
      .order('house_name');
    if (error) throw error;
    return (data || []).map((h: any) => ({ ...h, name: h.house_name }));
  },

  /**
   * Fetches a single house by ID.
   */
  async get(id: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .select(HOUSE_VIEWS.STANDARD)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const activeStaffCount = ((data as any).staff_assignments || []).filter((assignment: any) => {
      const staffObj = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff;
      const isStaffActive = staffObj?.status === 'active';
      const isAssignmentActive = !assignment.end_date || assignment.end_date >= today;
      return isStaffActive && isAssignmentActive;
    }).length;

    return {
      ...data,
      staff_assignments: [{ count: activeStaffCount }]
    };
  },

  /**
   * Creates a new house.
   */
  async create(house: Database['public']['Tables']['ic_houses']['Insert']) {
    const payload = this.sanitizeRecord(house, ['resource_name', 'file_path']);

    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .insert([payload])
      .select(HOUSE_VIEWS.STANDARD)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create house. This is likely an RLS policy violation (missing INSERT permission).');

    return data;
  },

  /**
   * Creates a new house with minimal data.
   */
  async createMinimal(name: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .insert([
        {
          house_name: name,
          status: 'active',
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create house. This is likely an RLS policy violation (missing INSERT permission).");

    return data;
  },

  /**
   * Fetches houses with their shift templates.
   */
  async listWithTemplates() {
    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .select(`
        id, 
        house_name, 
        address,
        templates:ic_house_shift_templates(
          id, 
          shift_template_name, 
          color_theme, 
          sort_order, 
          is_active
        )
      `)
      .eq('status', 'active')
      .order('house_name');
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Updates an existing house.
   */
  async update(id: string, updates: Database['public']['Tables']['ic_houses']['Update']) {
    const payload = this.sanitizeRecord(updates, ['resource_name', 'file_path']);

    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .update(payload)
      .eq('id', id)
      .select(HOUSE_VIEWS.STANDARD)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('House not found or permission denied (RLS Violation).');

    return data;
  },

  /**
   * Deletes a house.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.HOUSES)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async updateSetupStep(id: string, step: number) {
    const { error } = await supabase
      .from(TABLES.HOUSES)
      .update({ setup_step: step })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async finalizeSetup(id: string) {
    const { error } = await supabase
      .from(TABLES.HOUSES)
      .update({ 
        setup_step: 3,
        is_configured: true,
        status: 'active'
      })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * House Forms & Assignments
   */
  async listForms(houseId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_FORMS)
      .select(`
        *,
        creator:ic_staff!fk_ic_house_forms_created_by(id, staff_name, email),
        house_form_assignments:ic_house_form_assignments(
          id,
          form_id,
          participant_id,
          staff_id,
          assigned_by,
          due_date,
          status,
          completed_at,
          completed_by,
          notes,
          created_at,
          updated_at,
          participant:ic_participants(id, participant_name, email),
          staff:ic_staff!house_form_assignments_staff_id_fkey(id, staff_name, email),
          assigned_by_staff:ic_staff!house_form_assignments_assigned_by_fkey(id, staff_name, email),
          completed_by_staff:ic_staff!house_form_assignments_completed_by_fkey(id, staff_name, email)
        )
      `)
      .eq('house_id', houseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Staff Assignments
   */
  async listStaffAssignments(houseId?: string) {
    let query = supabase
      .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
      .select(`
        id, house_id, staff_id, is_primary, start_date, end_date, notes, created_at, updated_at,
        staff:${TABLES.STAFF}!house_staff_assignments_staff_id_fkey(
          id, staff_name, email, phone, status, separation_date, role_id, photo_url, 
          role:ic_roles!staff_role_id_fkey(id, role_name, description)
        )
      `)
      .order('created_at', { ascending: false });

    if (houseId) {
      query = query.eq('house_id', houseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((assignment: any) => {
      if (assignment.staff) {
        return {
          ...assignment,
          staff: {
            ...assignment.staff,
            role: Array.isArray(assignment.staff.role) ? assignment.staff.role[0] : assignment.staff.role
          }
        };
      }
      return assignment;
    });
  },

  async listStaffAssignmentsByStaff(staffId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
      .select(`house:${TABLES.HOUSES}(id, house_name, status, branch_id)`)
      .eq('staff_id', staffId)
      .or(`end_date.is.null,end_date.gte.${today}`);
      
    if (error) throw error;
    
    const houses = (data || [])
      .map((a: any) => a.house)
      .filter((h: any) => h && h.status === 'active');
    
    // Deduplicate by ID
    const uniqueHouses = Array.from(new Map(houses.map(h => [h.id, h])).values());
    
    return uniqueHouses.map((h: any) => ({ 
      ...h, 
      name: h.house_name 
    })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
};
