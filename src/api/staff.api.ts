import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STAFF_VIEWS, MISC_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';
import { STATUS } from '@/config/enums';
import { format, subDays } from 'date-fns';

export type StaffStatus = Database['public']['Enums']['ic_status_enum'];
export type StaffCompliance = Database['public']['Tables']['ic_staff_compliance']['Row'];
export type StaffTraining = Database['public']['Tables']['ic_staff_training']['Row'];

export interface StaffUpdateData extends Partial<Omit<Database['public']['Tables']['ic_staff']['Update'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> {
  name?: string; // Kept for backward compatibility in forms, maps to staff_name
}

export interface StaffFilter {
  search?: string;
  statuses?: StaffStatus[];
  roleIds?: string[];
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
      query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.roleIds && filters.roleIds.length > 0) {
      query = query.in('role_id', filters.roleIds);
    }

    if (sort.length > 0) {
      sort.forEach(s => {
        let column = s.id;
        if (s.id === 'department') column = 'department_id';
        if (s.id === 'role') column = 'role_id';
        if (s.id === 'name') column = 'staff_name';
        if (s.id === 'contact') column = 'email';
        
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
   * Fetches all active staff with house assignments.
   */
  async listActive() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .select(`
        id, staff_name, status, email, photo_url,
        house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_staff_assignments_staff_id_fkey(
          id,
          house_id,
          end_date,
          house:${TABLES.HOUSES}(id, house_name)
        )
      `)
      .eq('status', 'active')
      .order('staff_name');
    if (error) throw error;
    
    return (data || []).map((s: any) => {
      const activeAssignments = (s.house_assignments || []).filter((ha: any) => {
        return !ha.end_date || ha.end_date >= today;
      }).map((ha: any) => ({
        ...ha,
        house: Array.isArray(ha.house) ? ha.house[0] : ha.house
      }));

      return {
        ...s,
        name: s.staff_name,
        house_assignments: activeAssignments
      };
    });
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
    const rawPayload = { ...staffData };
    if (rawPayload.name && !rawPayload.staff_name) {
      rawPayload.staff_name = rawPayload.name;
    }
    delete rawPayload.name;

    const payload = this.sanitizeRecord({
      ...rawPayload,
      status: STATUS.draft,
    });

    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .insert([payload])
      .select(STAFF_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create staff member. This is likely an RLS policy violation (missing INSERT permission).');

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
    const rawPayload = { ...updates };
    if (rawPayload.name && !rawPayload.staff_name) {
      rawPayload.staff_name = rawPayload.name;
    }
    delete rawPayload.name;

    const payload = this.sanitizeRecord(rawPayload);

    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .update(payload)
      .eq('id', id)
      .select(STAFF_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Staff member not found or permission denied (RLS Violation).');

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

    if (filters.roleIds && filters.roleIds.length > 0) {
      query = query.in('role_id', filters.roleIds);
    }

    if (filters.search) {
      query = query.or(`staff_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Fetches an ordered list of unique staff names for dropdowns.
   */
  async listNames() {
    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .select('staff_name')
      .order('staff_name');

    if (error) throw error;
    
    // Return unique non-null names
    return [...new Set((data || []).map(s => s.staff_name).filter(Boolean))] as string[];
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
      .select(STAFF_VIEWS.COMPLIANCE)
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
      .select(STAFF_VIEWS.TRAINING)
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
  },

  /**
   * Lists all staff with auth user IDs (potential admins).
   */
  async listAdmins() {
    const { data, error } = await supabase
      .from(TABLES.STAFF)
      .select('auth_user_id')
      .not('auth_user_id', 'is', null);

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches all relevant data for the staff dashboard.
   */
  async getDashboardData(staffId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastWeek = subDays(new Date(), 7).toISOString();
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

    const [shiftsRes, eventsRes, leaveRes, timesheetsRes, allTimesheetsRes, pastShiftsRes, allShiftNotesRes] = await Promise.all([
      supabase
        .from(TABLES.STAFF_SHIFTS)
        .select(`
          id, 
          start_date, 
          end_date,
          start_time, 
          end_time, 
          shift_template,
          type_details:ic_house_shift_templates(color_theme, icon_name),
          house:ic_houses(id, house_name),
          assigned_checklists:ic_shift_assigned_checklists(
            checklist_id,
            assignment_title,
            submissions:ic_house_checklist_submissions(id, status, shift_id)
          )
        `)
        .eq('staff_id', staffId)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5),
      supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(`
          id,
          title,
          event_date,
          start_time,
          end_time,
          location,
          type:ic_house_calendar_event_types_master(event_type_name, color),
          house:ic_houses(house_name),
          staff_assignments:ic_house_calendar_event_staff!inner(staff_id)
        `)
        .eq('staff_assignments.staff_id', staffId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5),
      supabase
        .from(TABLES.LEAVE_REQUESTS)
        .select('id, leave_type:ic_leave_types(leave_type_name), start_date, end_date, status, updated_at')
        .eq('staff_id', staffId)
        .or(`status.eq.pending,and(status.eq.approved,updated_at.gte.${lastWeek})`)
        .order('start_date', { ascending: true })
        .limit(3),
      supabase
        .from(TABLES.TIMESHEETS)
        .select('id, status, clock_in, shift:ic_staff_shifts!timesheets_shift_id_fkey(start_date)')
        .eq('staff_id', staffId)
        .in('status', ['pending'])
        .order('clock_in', { ascending: false })
        .limit(5),
      supabase
        .from(TABLES.TIMESHEETS)
        .select('shift_id')
        .eq('staff_id', staffId)
        .not('shift_id', 'is', null),
      supabase
        .from(TABLES.STAFF_SHIFTS)
        .select('id, end_date, end_time')
        .eq('staff_id', staffId)
        .gte('end_date', thirtyDaysAgo)
        .lt('end_date', today),
      supabase
        .from(TABLES.SHIFT_NOTES)
        .select('shift_id')
        .eq('staff_id', staffId)
        .not('shift_id', 'is', null)
    ]);

    const shifts = (shiftsRes.data as any[]) || [];
    const events = (eventsRes.data as any[]) || [];

    const timesheetedShiftIds = new Set((allTimesheetsRes.data as any[])?.map(ts => ts.shift_id) || []);
    const shiftNotedIds = new Set((allShiftNotesRes.data as any[])?.map(sn => sn.shift_id) || []);
    const now = new Date();
    
    const missingShifts = (pastShiftsRes.data as any[])?.filter(s => {
      if (timesheetedShiftIds.has(s.id)) return false;
      const shiftEnd = new Date(`${s.end_date}T${s.end_time}`);
      return shiftEnd < now;
    }) || [];

    const missingNotes = (pastShiftsRes.data as any[])?.filter(s => {
      if (shiftNotedIds.has(s.id)) return false;
      const shiftEnd = new Date(`${s.end_date}T${s.end_time}`);
      return shiftEnd < now;
    }) || [];

    const upcomingShifts = shifts.map(shift => {
      const checklists = shift.assigned_checklists || [];
      const total = checklists.length;
      const completed = checklists.filter((cl: any) => 
        cl.submissions?.some((s: any) => s.shift_id === shift.id && s.status === 'completed')
      ).length;

      return {
        ...shift,
        entry_type: 'shift' as const,
        type_name: shift.shift_template || 'Shift',
        type_color: shift.type_details?.color_theme || 'blue',
        icon_name: shift.type_details?.icon_name || 'Calendar',
        checklist_stats: {
          total,
          completed,
          all_done: total > 0 && total === completed
        }
      };
    });

    const upcomingEvents = events.map(event => ({
      ...event,
      entry_type: 'event' as const,
      start_date: event.event_date,
      type_name: event.type?.event_type_name || 'Meeting',
      type_color: event.type?.color || 'blue',
    }));

    const upcomingSchedule = [...upcomingShifts, ...upcomingEvents].sort((a, b) => {
      const dateCompare = (a.start_date || '').localeCompare(b.start_date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.start_time || '').localeCompare(b.start_time || '');
    }).slice(0, 5);

    return {
      upcomingSchedule,
      missingTimesheetsCount: missingShifts.length,
      missingShiftNotesCount: missingNotes.length,
      pendingLeave: (leaveRes.data as any[]) || [],
      pendingTimesheets: (timesheetsRes.data as any[]) || [],
    };
  }
};
