import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STAFF_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';
import { STATUS } from '@/config/enums';

export type StaffStatus = Database['public']['Enums']['ic_status_enum'];
export type StaffCompliance = Database['public']['Tables']['ic_staff_compliance']['Row'];
export type StaffTraining = Database['public']['Tables']['ic_staff_training']['Row'];

export interface StaffUpdateData extends Partial<Omit<Database['public']['Tables']['ic_staff']['Update'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> {
  name?: string; // Kept for backward compatibility in forms, maps to staff_name
}

export interface StaffFilter {
  search?: string;
  statuses?: StaffStatus[];
}

export interface StaffSort {
  id: string;
  desc: boolean;
}

/**
 * Data Access Layer (DAL) for Staff.
 */
export const staffApi = {
  /**
   * Fetches a paginated list of staff with related info.
   */
  async list({
    pageIndex = 0,
    pageSize = 10,
    sort = [],
    filters = {}
  }: {
    pageIndex?: number;
    pageSize?: number;
    sort?: StaffSort[];
    filters?: StaffFilter;
  } = {}) {
    let query = supabase
      .from(TABLES.STAFF)
      .select(STAFF_VIEWS.LIST, { count: 'exact' });

    if (filters.search) {
      query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (sort.length > 0) {
      sort.forEach(s => {
        const column = s.id === 'department' ? 'department_id' : s.id;
        query = query.order(column as any, { ascending: !s.desc });
      });
    } else {
      query = query.order('staff_name', { ascending: true });
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const formatted = (data || []).map((item: any) => ({
      ...item,
      name: item.staff_name,
      department_info: Array.isArray(item.department_info) ? item.department_info[0] : item.department_info,
      employment_type_info: Array.isArray(item.employment_type_info) ? item.employment_type_info[0] : item.employment_type_info,
      role: Array.isArray(item.role) ? item.role[0] : item.role,
      house_assignments: (item.house_assignments || []).map((ha: any) => ({
        ...ha,
        house: Array.isArray(ha.house) ? ha.house[0] : ha.house
      }))
    }));

    return { data: formatted, count: count || 0 };
  },

  /**
   * Fetches a single staff member by ID with full details.
   */
  async get(id: string) {
    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .select(STAFF_VIEWS.DETAIL)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const formatted = {
      ...data,
      name: (data as any).staff_name,
      department_info: Array.isArray((data as any).department_info) ? (data as any).department_info[0] : (data as any).department_info,
      employment_type_info: Array.isArray((data as any).employment_type_info) ? (data as any).employment_type_info[0] : (data as any).employment_type_info,
      manager_info: Array.isArray((data as any).manager_info) ? (data as any).manager_info[0] : (data as any).manager_info,
      role: Array.isArray((data as any).role) ? (data as any).role[0] : (data as any).role,
    };

    return formatted;
  },

  /**
   * Creates a new staff member.
   */
  async create(staffData: StaffUpdateData) {
    const payload = { ...staffData };
    if (payload.name && !payload.staff_name) {
      payload.staff_name = payload.name;
      delete payload.name;
    }

    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .insert([{
        ...payload,
        status: STATUS.draft,
      } as any])
      .select(STAFF_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create staff member or permission denied');

    const formatted = {
      ...data,
      name: (data as any).staff_name,
    };

    return formatted;
  },

  /**
   * Updates an existing staff member.
   */
  async update(id: string, updates: StaffUpdateData) {
    const payload = { ...updates };
    if (payload.name && !payload.staff_name) {
      payload.staff_name = payload.name;
      delete payload.name;
    }

    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .update(payload as any)
      .eq('id', id)
      .select(STAFF_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Staff member not found or permission denied');

    const formatted = {
      ...data,
      name: (data as any).staff_name,
    };

    return formatted;
  },

  /**
   * Deletes a staff member.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.STAFF)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Gets total count of staff based on filters.
   */
  async count(filters: StaffFilter = {}) {
    let query = supabase
      .from(TABLES.STAFF)
      .select('*', { count: 'exact', head: true });

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.search) {
      query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Fetches staff members by role.
   */
  async listByRole(roleId: string) {
    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .select(MISC_VIEWS.STAFF_BY_ROLE)
      .eq('role_id', roleId)
      .order('staff_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      name: item.staff_name,
      department_info: Array.isArray(item.department_info) ? item.department_info[0] : item.department_info,
    }));
  },

  /**
   * Fetches compliance records for a staff member.
   */
  async getCompliance(staffId: string) {
    const { data, error } = await supabase
      .from(TABLES.STAFF_COMPLIANCE)
      .select('*')
      .eq('staff_id', staffId)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches training records for a staff member.
   */
  async getTraining(staffId?: string) {
    let query = supabase
      .from(TABLES.STAFF_TRAINING)
      .select('*')
      .order('created_at', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Invites a staff member.
   */
  async invite(staffId: string, email: string) {
    const { data, error } = await supabase.functions.invoke('ic-invite-staff-user', {
      body: { 
        staffId, 
        email,
        redirectTo: `${window.location.origin}/auth/change-password`
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Revokes a staff invite.
   */
  async revokeInvite(staffId: string, authUserId: string) {
    const { data, error } = await supabase.functions.invoke('ic-revoke-staff-invite', {
      body: { staffId, authUserId },
    });

    if (error) throw error;
    return data;
  }
};
