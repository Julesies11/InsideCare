import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { LEAVE_STATUS } from '@/config/enums';
import { CALENDAR_VIEWS, ROSTER_VIEWS } from '@/config/query-views';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { supabase } from '@/lib/supabase';
import { getStoragePath } from '@/lib/helpers';

export interface ShiftParticipantSync {
  shift_id: string;
  participant_ids: string[];
}

export interface ShiftChecklistSync {
  shift_id: string;
  checklists: Array<{
    checklist_id: string;
    assignment_title: string;
  }>;
}

export interface MaterializePatternParams {
  houseId: string;
  startDate: string;
  pattern: Record<number, string[]>[];
  shiftTemplates: any[];
  defaults: any[];
  participants: any[];
}

export const rosterApi = {
  /**
   * List shifts with optional filters and related data.
   */
  async listShifts(params: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    houseId?: string;
    includeEvents?: boolean;
  }) {
    const { staffId, startDate, endDate, houseId, includeEvents } = params;

    let shiftQuery = supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(ROSTER_VIEWS.CALENDAR_SHIFTS)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (startDate) shiftQuery = shiftQuery.gte('end_date', startDate);
    if (endDate) shiftQuery = shiftQuery.lte('start_date', endDate);
    if (
      staffId &&
      staffId !== 'all' &&
      staffId !== 'undefined' &&
      staffId !== 'null'
    )
      shiftQuery = shiftQuery.eq('staff_id', staffId);
    if (houseId && houseId !== 'all')
      shiftQuery = shiftQuery.eq('house_id', houseId);

    let eventQuery;
    if (
      includeEvents &&
      staffId &&
      staffId !== 'all' &&
      staffId !== 'undefined' &&
      staffId !== 'null'
    ) {
      eventQuery = supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(
          `
          id,
          title,
          event_date,
          start_time,
          end_time,
          location,
          type:ic_house_calendar_event_types_master(event_type_name, color),
          house_id,
          house:ic_houses(house_name),
          staff_assignments:ic_house_calendar_event_staff!inner(staff_id)
        `,
        )
        .eq('staff_assignments.staff_id', staffId)
        .gte('event_date', startDate || '')
        .lte('event_date', endDate || '');
    }

    const [shiftsRes, eventsRes] = await Promise.all([
      shiftQuery,
      eventQuery || Promise.resolve({ data: [], error: null }),
    ]);

    if (shiftsRes.error) throw shiftsRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const shifts = (shiftsRes.data || []).map((s) => ({
      ...s,
      entry_type: 'shift' as const,
    }));
    const events = (eventsRes.data || []).map((e) => ({
      id: e.id,
      staff_id: staffId,
      start_date: e.event_date,
      end_date: e.event_date,
      start_time: e.start_time,
      end_time: e.end_time,
      house_id: e.house_id,
      shift_template: 'Event',
      title: e.title,
      location: e.location,
      type_name: e.type?.event_type_name,
      type_color: e.type?.color,
      entry_type: 'event' as const,
      house: e.house,
    }));

    return [...shifts, ...events];
  },

  /**
   * Get a single shift by ID.
   */
  async getShift(id: string) {
    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(ROSTER_VIEWS.SHIFT_DETAIL)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get the current or next/past shift for a staff member.
   */
  async getCurrentShift(staffId: string) {
    if (!staffId || staffId === 'undefined' || staffId === 'null') return null;
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const nowTime = format(now, 'HH:mm:ss');

    // 1. Try to find an ACTIVE shift
    const { data: activeShifts, error: activeError } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(
        'id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)',
      )
      .eq('staff_id', staffId)
      .gte('end_date', today)
      .lte('start_date', today);

    if (!activeError && activeShifts && activeShifts.length > 0) {
      const active = activeShifts.find((s) => {
        const shiftStart = new Date(`${s.start_date}T${s.start_time}`);
        const shiftEnd = new Date(`${s.end_date}T${s.end_time}`);
        if (shiftEnd < shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);
        return now >= shiftStart && now <= shiftEnd;
      });
      if (active) return active;
    }

    // 2. Try to find the NEXT shift
    const { data: nextShift, error: nextError } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(
        'id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)',
      )
      .eq('staff_id', staffId)
      .eq('start_date', today)
      .gt('start_time', nowTime)
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextError && nextShift) return nextShift;

    // 3. Try to find the most RECENT shift
    const { data: pastShift } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(
        'id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)',
      )
      .eq('staff_id', staffId)
      .eq('start_date', today)
      .lt('end_time', nowTime)
      .order('end_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    return pastShift;
  },

  /**
   * List paginated shifts for a specific staff member.
   */
  async listStaffShiftsPaginated(params: {
    staffId: string;
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    sorting?: Array<{ id: string; desc: boolean }>;
  }) {
    const { staffId, pageIndex = 0, pageSize = 50, search, sorting } = params;
    if (!staffId || staffId === 'undefined' || staffId === 'null')
      return { data: [], count: 0 };
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(
        `
        id, 
        start_date, 
        end_date,
        start_time, 
        end_time, 
        shift_template, 
        notes,
        house:ic_houses(house_name),
        participants:ic_shift_participants(
          participant:ic_participants(id, participant_name)
        )
      `,
        { count: 'exact' },
      )
      .eq('staff_id', staffId);

    if (search) {
      query = query.or(
        `shift_template.ilike.%${search}%,notes.ilike.%${search}%`,
      );
    }

    if (sorting && sorting.length > 0) {
      sorting.forEach((s) => {
        const column = s.id === 'details' ? 'shift_template' : s.id;
        query = query.order(column as any, { ascending: !s.desc });
      });
    } else {
      query = query
        .order('start_date', { ascending: false })
        .order('start_time', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    const shiftIds = (data || []).map((s) => s.id);

    // Fetch timesheets and shift notes for these shifts
    const [timesheetRes, shiftNoteRes] = await Promise.all([
      supabase
        .from(TABLES.TIMESHEETS)
        .select('shift_id')
        .in(
          'shift_id',
          shiftIds.length > 0
            ? shiftIds
            : ['00000000-0000-0000-0000-000000000000'],
        ),
      supabase
        .from(TABLES.SHIFT_NOTES)
        .select('shift_id')
        .in(
          'shift_id',
          shiftIds.length > 0
            ? shiftIds
            : ['00000000-0000-0000-0000-000000000000'],
        ),
    ]);

    const timesheetedIds = new Set(
      (timesheetRes.data || []).map((t) => t.shift_id),
    );
    const shiftNotedIds = new Set(
      (shiftNoteRes.data || []).map((n) => n.shift_id),
    );

    const formattedData = (data || []).map((s) => ({
      ...s,
      entry_type: 'shift' as const,
      house: (Array.isArray(s.house) ? s.house[0] : s.house) as {
        house_name: string;
      } | null,
      has_timesheet: timesheetedIds.has(s.id),
      has_shift_note: shiftNotedIds.has(s.id),
      participants:
        (s.participants || [])
          ?.map((p: any) => {
            const part = p.participant;
            const actualPart = Array.isArray(part) ? part[0] : part;
            return {
              id: actualPart?.id || p.id || p.participant_id,
              participant_name:
                actualPart?.participant_name || p.participant_name,
            };
          })
          .filter((p: any) => p.id && p.participant_name) || [],
    }));

    return { data: formattedData, count: count || 0 };
  },

  /**
   * Create a new shift.
   */
  async createShift(shift: any) {
    const { participant_ids, assigned_checklists, ...dbPayload } = shift;

    // Remove UI-only fields before inserting
    delete dbPayload.entry_type;
    delete dbPayload.title;
    delete dbPayload.location;
    delete dbPayload.participants;

    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .insert([dbPayload])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data)
      throw new Error('You do not have permission to perform this action');

    if (participant_ids) {
      await this.syncShiftParticipants(data.id, participant_ids);
    }

    if (assigned_checklists) {
      await this.syncShiftChecklists(data.id, assigned_checklists);
    }

    return data;
  },

  /**
   * Update an existing shift.
   */
  async updateShift(id: string, updates: any = {}) {
    const { participant_ids, assigned_checklists, ...dbPayload } =
      updates || {};

    // Remove UI-only fields before updating
    if (dbPayload) {
      delete dbPayload.entry_type;
      delete dbPayload.title;
      delete dbPayload.location;
      delete dbPayload.participants;
    }

    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .update(dbPayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data)
      throw new Error('You do not have permission to perform this action');

    if (participant_ids) {
      await this.syncShiftParticipants(id, participant_ids);
    }

    if (assigned_checklists) {
      await this.syncShiftChecklists(id, assigned_checklists);
    }

    return data;
  },

  /**
   * Delete a shift.
   */
  async deleteShift(id: string) {
    // Check for references in shift notes, timesheets, and checklist submissions
    const [notesRes, timesheetsRes, submissionsRes] = await Promise.all([
      supabase.from(TABLES.SHIFT_NOTES).select('id').eq('shift_id', id),
      supabase.from(TABLES.TIMESHEETS).select('id').eq('shift_id', id),
      supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .select('id')
        .eq('shift_id', id),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (timesheetsRes.error) throw timesheetsRes.error;
    if (submissionsRes.error) throw submissionsRes.error;

    const hasNotes = (notesRes.data || []).length > 0;
    const hasTimesheets = (timesheetsRes.data || []).length > 0;
    const hasSubmissions = (submissionsRes.data || []).length > 0;

    if (hasNotes || hasTimesheets || hasSubmissions) {
      const reasons: string[] = [];
      if (hasNotes) reasons.push('shift notes');
      if (hasTimesheets) reasons.push('timesheets');
      if (hasSubmissions) reasons.push('checklist submissions');

      throw new Error(
        `This shift cannot be deleted because it is referenced by: ${reasons.join(', ')}.`,
      );
    }

    // Delete child associations first
    await Promise.all([
      supabase.from(TABLES.SHIFT_PARTICIPANTS).delete().eq('shift_id', id),
      supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .delete()
        .eq('shift_id', id),
    ]);

    const { error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Fetches the complete roster for a staff member, including shifts, events, and leave.
   */
  async getStaffRoster(staffId: string) {
    if (!staffId || staffId === 'undefined' || staffId === 'null') return [];
    const [shiftsRes, eventsRes, leaveRes] = await Promise.all([
      supabase
        .from(TABLES.STAFF_SHIFTS)
        .select(ROSTER_VIEWS.CALENDAR_SHIFTS)
        .eq('staff_id', staffId)
        .order('start_date', { ascending: false }),
      supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(CALENDAR_VIEWS.STANDARD)
        .eq('staff_assignments.staff_id', staffId)
        .order('event_date', { ascending: false }),
      supabase
        .from(TABLES.LEAVE_REQUESTS)
        .select(ROSTER_VIEWS.LEAVE_LIST)
        .eq('staff_id', staffId)
        .neq('status', 'rejected')
        .order('start_date', { ascending: false }),
    ]);

    if (shiftsRes.error) throw shiftsRes.error;
    if (eventsRes.error) throw eventsRes.error;
    if (leaveRes.error) throw leaveRes.error;

    const shiftsData = shiftsRes.data || [];
    const eventsData = eventsRes.data || [];
    const leaveData = leaveRes.data || [];

    const shiftIds = shiftsData.map((s) => s.id);

    // Fetch timesheets and shift notes for these shifts
    const [timesheetRes, shiftNoteRes] = await Promise.all([
      supabase
        .from(TABLES.TIMESHEETS)
        .select('shift_id')
        .in(
          'shift_id',
          shiftIds.length > 0
            ? shiftIds
            : ['00000000-0000-0000-0000-000000000000'],
        ),
      supabase
        .from(TABLES.SHIFT_NOTES)
        .select('shift_id')
        .in(
          'shift_id',
          shiftIds.length > 0
            ? shiftIds
            : ['00000000-0000-0000-0000-000000000000'],
        ),
    ]);

    const timesheetedIds = new Set(
      (timesheetRes.data || []).map((t) => t.shift_id),
    );
    const shiftNotedIds = new Set(
      (shiftNoteRes.data || []).map((n) => n.shift_id),
    );

    const shifts = shiftsData.map((s: any) => ({
      ...s,
      entry_type: 'shift' as const,
      house: (s.house_info || s.house) as { house_name: string } | null,
      has_timesheet: timesheetedIds.has(s.id),
      has_shift_note: shiftNotedIds.has(s.id),
      participants:
        (s.participants || [])
          ?.map((p: any) => {
            const part = p.participant || p;
            const actualPart = Array.isArray(part) ? part[0] : part;
            return {
              id: actualPart?.id || p.id || p.participant_id,
              participant_name:
                actualPart?.participant_name || p.participant_name,
            };
          })
          .filter((p: any) => p.id && p.participant_name) || [],
    }));

    const events = eventsData.map((e: any) => ({
      id: e.id,
      start_date: e.event_date,
      start_time: e.start_time,
      end_time: e.end_time,
      entry_type: 'event' as const,
      title: e.title,
      location: e.location,
      type_name:
        (Array.isArray(e.type) ? e.type[0] : e.type)?.event_type_name ||
        'Meeting',
      type_color: (Array.isArray(e.type) ? e.type[0] : e.type)?.color || 'blue',
      house: (Array.isArray(e.house) ? e.house[0] : e.house) as {
        house_name: string;
      } | null,
      has_timesheet: false,
    }));

    const leaves = leaveData.map((l) => ({
      id: l.id,
      start_date: l.start_date,
      end_date: l.end_date,
      start_time: '00:00:00',
      end_time: '23:59:59',
      entry_type: 'leave' as const,
      title:
        (Array.isArray(l.leave_type) ? l.leave_type[0] : l.leave_type)
          ?.leave_type_name || 'Leave',
      reason: l.reason,
      status: l.status,
      house: null,
      has_timesheet: false,
    }));

    return [...shifts, ...events, ...leaves].sort((a, b) => {
      const dateCompare = (b.start_date || '').localeCompare(
        a.start_date || '',
      );
      if (dateCompare !== 0) return dateCompare;
      return (b.start_time || '').localeCompare(a.start_time || '');
    });
  },

  /**
   * Bulk update shifts.
   */
  async bulkUpdateShifts(params: string[] | any, updates: any) {
    let query = supabase.from(TABLES.STAFF_SHIFTS).update(updates);

    if (Array.isArray(params)) {
      query = query.in('id', params);
    } else {
      if (params.houseId && params.houseId !== 'all')
        query = query.eq('house_id', params.houseId);
      if (params.staffId && params.staffId !== 'all')
        query = query.eq('staff_id', params.staffId);
      if (params.shiftTemplateId && params.shiftTemplateId !== 'all') {
        const isUuid = params.shiftTemplateId.length === 36;
        if (isUuid) {
          query = query.eq('shift_template_id', params.shiftTemplateId);
        } else {
          query = query.eq('shift_template', params.shiftTemplateId);
        }
      }
      if (params.startDate) query = query.gte('start_date', params.startDate);
      if (params.endDate) query = query.lte('start_date', params.endDate);
    }

    const { data, error } = await query.select();
    if (error) throw error;
    return data;
  },

  async bulkDeleteShifts(params: string[] | any) {
    let shiftIds: string[] = [];

    if (Array.isArray(params)) {
      shiftIds = params;
    } else {
      let selectQuery = supabase.from(TABLES.STAFF_SHIFTS).select('id');

      if (params.houseId && params.houseId !== 'all')
        selectQuery = selectQuery.eq('house_id', params.houseId);
      if (params.staffId && params.staffId !== 'all')
        selectQuery = selectQuery.eq('staff_id', params.staffId);
      if (params.shiftTemplateId && params.shiftTemplateId !== 'all') {
        const isUuid = params.shiftTemplateId.length === 36;
        if (isUuid) {
          selectQuery = selectQuery.eq(
            'shift_template_id',
            params.shiftTemplateId,
          );
        } else {
          selectQuery = selectQuery.eq(
            'shift_template',
            params.shiftTemplateId,
          );
        }
      }
      if (params.startDate)
        selectQuery = selectQuery.gte('start_date', params.startDate);
      if (params.endDate)
        selectQuery = selectQuery.lte('start_date', params.endDate);

      const { data, error: selectError } = await selectQuery;
      if (selectError) throw selectError;
      shiftIds = (data || []).map((s) => s.id);
    }

    if (shiftIds.length === 0) {
      return { deletedCount: 0, skippedCount: 0 };
    }

    // Check for references in shift notes, timesheets, and checklist submissions
    const [notesRes, timesheetsRes, submissionsRes] = await Promise.all([
      supabase
        .from(TABLES.SHIFT_NOTES)
        .select('shift_id')
        .in('shift_id', shiftIds),
      supabase
        .from(TABLES.TIMESHEETS)
        .select('shift_id')
        .in('shift_id', shiftIds),
      supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .select('shift_id')
        .in('shift_id', shiftIds),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (timesheetsRes.error) throw timesheetsRes.error;
    if (submissionsRes.error) throw submissionsRes.error;

    const referencedShiftIds = new Set(
      [
        ...(notesRes.data || []).map((n) => n.shift_id),
        ...(timesheetsRes.data || []).map((t) => t.shift_id),
        ...(submissionsRes.data || []).map((s) => s.shift_id),
      ].filter(Boolean) as string[],
    );

    const deleteShiftIds = shiftIds.filter((id) => !referencedShiftIds.has(id));

    if (deleteShiftIds.length > 0) {
      // Delete child associations first
      await Promise.all([
        supabase
          .from(TABLES.SHIFT_PARTICIPANTS)
          .delete()
          .in('shift_id', deleteShiftIds),
        supabase
          .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
          .delete()
          .in('shift_id', deleteShiftIds),
      ]);

      const { error: deleteError } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .delete()
        .in('id', deleteShiftIds);

      if (deleteError) throw deleteError;
    }

    return {
      deletedCount: deleteShiftIds.length,
      skippedCount: referencedShiftIds.size,
    };
  },

  /**
   * List all leave requests for admin review.
   */
  async listAdminLeaveRequests() {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(
        `
        *, 
        staff:${TABLES.STAFF}!leave_requests_staff_id_fkey(id, staff_name, photo_url, auth_user_id), 
        leave_type:${TABLES.LEAVE_TYPES}!leave_type_id(leave_type_name)
      `,
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Updates a leave request status and admin notes.
   */
  async updateLeaveRequestStatus(
    id: string,
    status: 'approved' | 'rejected',
    adminNotes?: string | null,
  ) {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .update({ status, admin_notes: adminNotes })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * List leave requests for staff.
   */
  async listLeaveRequests(
    staffId: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!staffId || staffId === 'undefined' || staffId === 'null') return [];
    let query = supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(ROSTER_VIEWS.LEAVE_LIST)
      .neq('status', LEAVE_STATUS.rejected);

    if (endDate) query = query.lte('start_date', endDate);
    if (startDate) query = query.gte('end_date', startDate);

    if (staffId !== 'all') query = query.eq('staff_id', staffId);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * List active global shift templates.
   */
  async listGlobalShiftTemplates() {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_SHIFT_TEMPLATES)
      .select('shift_template_name')
      .order('shift_template_name');

    if (error) throw error;
    const uniqueNames = Array.from(
      new Set(data.map((t) => t.shift_template_name)),
    );
    return uniqueNames.map((name) => ({ id: name, name }));
  },

  /**
   * Sync participants assigned to a shift.
   */
  async syncShiftParticipants(shiftId: string, participantIds: string[]) {
    await supabase
      .from(TABLES.SHIFT_PARTICIPANTS)
      .delete()
      .eq('shift_id', shiftId);

    if (participantIds.length > 0) {
      const { error } = await supabase
        .from(TABLES.SHIFT_PARTICIPANTS)
        .insert(
          participantIds.map((pid) => ({
            shift_id: shiftId,
            participant_id: pid,
          })),
        );
      if (error) throw error;
    }
  },

  /**
   * Add a single participant to a shift.
   */
  async addShiftParticipant(shiftId: string, participantId: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_PARTICIPANTS)
      .insert([{ shift_id: shiftId, participant_id: participantId }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a single participant from a shift.
   */
  async removeShiftParticipant(shiftId: string, participantId: string) {
    const { error } = await supabase
      .from(TABLES.SHIFT_PARTICIPANTS)
      .delete()
      .eq('shift_id', shiftId)
      .eq('participant_id', participantId);

    if (error) throw error;
  },

  /**
   * Sync checklists assigned to a shift.
   */
  async syncShiftChecklists(shiftId: string, checklists: any[]) {
    const { data: shift } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select('house_id, shift_template_id')
      .eq('id', shiftId)
      .maybeSingle();

    if (!shift) throw new Error('Shift not found');

    await supabase
      .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
      .delete()
      .eq('shift_id', shiftId);

    if (checklists.length > 0) {
      const { error } = await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .insert(
          checklists.map((cl) => ({
            shift_id: shiftId,
            checklist_id: cl.checklist_id,
            assignment_title: cl.assignment_title,
            house_id: shift.house_id,
            shift_template_id: shift.shift_template_id,
          })),
        );
      if (error) throw error;
    }
  },

  /**
   * Materialize a roster pattern into actual shifts.
   */
  async materializePattern(params: MaterializePatternParams) {
    const {
      houseId,
      startDate,
      pattern,
      shiftTemplates,
      defaults,
      participants,
    } = params;
    const shiftsToCreate: any[] = [];
    const anchorMonday = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });

    pattern.forEach((weekPattern, weekIndex) => {
      const weekStartDate = addDays(anchorMonday, weekIndex * 7);
      Object.entries(weekPattern).forEach(([dayStr, shiftTemplateIds]) => {
        const dayId = parseInt(dayStr);
        const dayOffset = dayId === 0 ? 6 : dayId - 1;
        const targetDate = addDays(weekStartDate, dayOffset);
        const targetDateStr = format(targetDate, 'yyyy-MM-dd');

        if (targetDateStr < startDate) return;

        shiftTemplateIds.forEach((typeId) => {
          const type = shiftTemplates.find((t) => t.id === typeId);
          if (!type) return;

          shiftsToCreate.push({
            house_id: houseId,
            staff_id: null,
            start_date: targetDateStr,
            end_date: targetDateStr,
            start_time: type.default_start_time,
            end_time: type.default_end_time,
            shift_template: type.shift_template_name,
            shift_template_id: type.id,
            notes: null,
          });
        });
      });
    });

    if (shiftsToCreate.length === 0)
      return { created: 0, checklists: 0, skipped: 0 };

    const { data: createdShifts, error: shiftError } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .insert(shiftsToCreate)
      .select('id, shift_template_id');

    if (shiftError) throw shiftError;

    let checklistsCount = 0;
    const participantInserts: any[] = [];
    const checklistInserts: any[] = [];

    createdShifts.forEach((shift) => {
      participants.forEach((p) => {
        participantInserts.push({ shift_id: shift.id, participant_id: p.id });
      });

      const typeDefaults = defaults.filter(
        (d) => d.shift_template_id === shift.shift_template_id,
      );
      typeDefaults.forEach((d) => {
        checklistInserts.push({
          shift_id: shift.id,
          checklist_id: d.checklist_id,
          assignment_title:
            d.checklist?.house_checklist_name || 'Routine Checklist',
          house_id: houseId,
          shift_template_id: shift.shift_template_id,
        });
        checklistsCount++;
      });
    });

    if (participantInserts.length > 0) {
      await supabase.from(TABLES.SHIFT_PARTICIPANTS).insert(participantInserts);
    }

    if (checklistInserts.length > 0) {
      await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .insert(checklistInserts);
    }

    return {
      created: createdShifts.length,
      checklists: checklistsCount,
      skipped: shiftsToCreate.length - createdShifts.length,
    };
  },

  /**
   * List leave types.
   */
  async listLeaveTypes() {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_TYPES)
      .select('id, leave_type_name')
      .order('leave_type_name');

    if (error) throw error;
    return (
      (data as any[])?.map((d) => ({ id: d.id, name: d.leave_type_name })) || []
    );
  },

  /**
   * Get a specific leave request.
   */
  async getLeaveRequest(id: string) {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(ROSTER_VIEWS.LEAVE_LIST)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Create or update a leave request.
   */
  async upsertLeaveRequest(payload: any, id?: string) {
    if (id) {
      const { data, error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  /**
   * List shifts for multiple staff IDs within a date range.
   */
  async listShiftsForStaffIds(
    staffIds: string[],
    startDate: string,
    endDate: string,
  ) {
    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select('id, staff_id, start_date')
      .in('staff_id', staffIds)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    if (error) throw error;
    return (data as any[]) || [];
  },

  /**
   * List conflicting shifts for a staff member.
   */
  async listConflictingShifts(
    staffId: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!startDate || !endDate) return [];

    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(ROSTER_VIEWS.SHIFT_LIST)
      .eq('staff_id', staffId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date');

    if (error) throw error;
    return (data as any[]) || [];
  },

  /**
   * Uploads a staff document.
   */
  async uploadStaffDocument(staffId: string, file: File) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `leave-attachments/${staffId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  },

  /**
   * Generates a signed URL for a staff document.
   */
  async getStaffDocumentSignedUrl(filePath: string) {
    const cleanPath = getStoragePath(filePath);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
      .createSignedUrl(cleanPath, 3600);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Shift Assigned Checklists (Routines)
   */
  async listShiftAssignments(houseId: string) {
    const { data, error } = await supabase
      .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
      .select('*')
      .eq('house_id', houseId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async syncShiftAssignments(houseId: string, assignments: any[]) {
    // 1. Delete existing for this house
    const { error: deleteError } = await supabase
      .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
      .delete()
      .eq('house_id', houseId);

    if (deleteError) throw deleteError;

    // 2. Insert new batch
    if (assignments.length > 0) {
      const { error: insertError } = await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .insert(assignments);

      if (insertError) throw insertError;
    }
    return true;
  },

  /**
   * Appends new shift assignments without clearing existing ones.
   */
  async appendShiftAssignments(assignments: any[]) {
    const { error } = await supabase
      .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
      .insert(assignments);
    if (error) throw error;
    return true;
  },

  /**
   * Lists approved leave requests that might conflict with a roster rollout.
   */
  async listApprovedLeaveForRollout(startDate: string, rolloutEndDate: string) {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select('staff_id, start_date, end_date')
      .eq('status', 'approved')
      .gte('end_date', startDate)
      .lte('start_date', rolloutEndDate);
    if (error) throw error;
    return data || [];
  },
};
