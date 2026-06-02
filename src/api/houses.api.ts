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
    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .insert([house])
      .select(HOUSE_VIEWS.STANDARD)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create house or permission denied');

    return data;
  },

  /**
   * Updates an existing house.
   */
  async update(id: string, updates: Database['public']['Tables']['ic_houses']['Update']) {
    const { data, error } = await supabase
      .from(TABLES.HOUSES)
      .update(updates)
      .eq('id', id)
      .select(HOUSE_VIEWS.STANDARD)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('House not found or permission denied');

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
  }
};
