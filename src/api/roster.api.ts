import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { ROSTER_VIEWS } from '@/config/query-views';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { format, addDays, parseISO, startOfWeek } from 'date-fns';

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
      .select(ROSTER_VIEWS.SHIFT_DETAIL)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (startDate) shiftQuery = shiftQuery.gte('end_date', startDate);
    if (endDate) shiftQuery = shiftQuery.lte('start_date', endDate);
    if (staffId && staffId !== 'all') shiftQuery = shiftQuery.eq('staff_id', staffId);
    if (houseId && houseId !== 'all') shiftQuery = shiftQuery.eq('house_id', houseId);

    let eventQuery: any = null;
    if (includeEvents && staffId && staffId !== 'all') {
      eventQuery = supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(CALENDAR_VIEWS.STANDARD)
        .eq('staff_assignments.staff_id', staffId)
        .gte('event_date', startDate || '')
        .lte('event_date', endDate || '');
    }

    const [shiftsRes, eventsRes] = await Promise.all([
      shiftQuery,
      eventQuery || Promise.resolve({ data: [], error: null })
    ]);

    if (shiftsRes.error) throw shiftsRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const shifts = (shiftsRes.data || []).map(s => ({ ...s, entry_type: 'shift' as const }));
    const events = (eventsRes.data || []).map(e => ({
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
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const nowTime = format(now, 'HH:mm:ss');

    // 1. Try to find an ACTIVE shift
    const { data: activeShifts, error: activeError } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)')
      .eq('staff_id', staffId)
      .gte('end_date', today)
      .lte('start_date', today);

    if (!activeError && activeShifts && activeShifts.length > 0) {
      const active = activeShifts.find(s => {
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
      .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)')
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
      .select('id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)')
      .eq('staff_id', staffId)
      .eq('start_date', today)
      .lt('end_time', nowTime)
      .order('end_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    return pastShift;
  },

  /**
   * Create a new shift.
   */
  async createShift(shift: any) {
    const { 
      participant_ids, 
      assigned_checklists, 
      ...dbPayload 
    } = shift;
    
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
    if (!data) throw new Error("You do not have permission to perform this action");

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
  async updateShift(id: string, updates: any) {
    const { 
      participant_ids, 
      assigned_checklists, 
      ...dbPayload 
    } = updates;
    
    // Remove UI-only fields before updating
    delete dbPayload.entry_type;
    delete dbPayload.title;
    delete dbPayload.location;
    delete dbPayload.participants;

    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .update(dbPayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("You do not have permission to perform this action");

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
    const { error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Bulk update shifts.
   */
  async bulkUpdateShifts(params: string[] | any, updates: any) {
    let query = supabase.from(TABLES.STAFF_SHIFTS).update(updates);
    
    if (Array.isArray(params)) {
      query = query.in('id', params);
    } else {
      if (params.houseId && params.houseId !== 'all') query = query.eq('house_id', params.houseId);
      if (params.staffId && params.staffId !== 'all') query = query.eq('staff_id', params.staffId);
      if (params.startDate) query = query.gte('start_date', params.startDate);
      if (params.endDate) query = query.lte('start_date', params.endDate);
    }
    
    const { data, error } = await query.select();
    if (error) throw error;
    return data;
  },

  /**
   * Bulk delete shifts.
   */
  async bulkDeleteShifts(params: string[] | any) {
    let query = supabase.from(TABLES.STAFF_SHIFTS).delete();
    
    if (Array.isArray(params)) {
      query = query.in('id', params);
    } else {
      if (params.houseId && params.houseId !== 'all') query = query.eq('house_id', params.houseId);
      if (params.staffId && params.staffId !== 'all') query = query.eq('staff_id', params.staffId);
      if (params.startDate) query = query.gte('start_date', params.startDate);
      if (params.endDate) query = query.lte('start_date', params.endDate);
    }
    
    const { error } = await query;
    if (error) throw error;
  },

  /**
   * List leave requests for staff.
   */
  async listLeaveRequests(staffId: string, startDate: string, endDate: string) {
    let query = supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(ROSTER_VIEWS.LEAVE_LIST)
      .neq('status', 'REJECTED')
      .lte('start_date', endDate)
      .gte('end_date', startDate);
      
    if (staffId !== 'all') query = query.eq('staff_id', staffId);
    
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
      .eq('is_active', true)
      .order('shift_template_name');
    
    if (error) throw error;
    const uniqueNames = Array.from(new Set(data.map(t => t.shift_template_name)));
    return uniqueNames.map(name => ({ id: name, name }));
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
        .insert(participantIds.map(pid => ({ shift_id: shiftId, participant_id: pid })));
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
    
    if (!shift) throw new Error("Shift not found");

    await supabase
      .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
      .delete()
      .eq('shift_id', shiftId);
    
    if (checklists.length > 0) {
      const { error } = await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .insert(checklists.map(cl => ({ 
          shift_id: shiftId, 
          checklist_id: cl.checklist_id,
          assignment_title: cl.assignment_title,
          house_id: shift.house_id,
          shift_template_id: shift.shift_template_id
        })));
      if (error) throw error;
    }
  },

  /**
   * Materialize a roster pattern into actual shifts.
   */
  async materializePattern(params: MaterializePatternParams) {
    const { houseId, startDate, pattern, shiftTemplates, defaults, participants } = params;
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

        shiftTemplateIds.forEach(typeId => {
          const type = shiftTemplates.find(t => t.id === typeId);
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
            notes: null
          });
        });
      });
    });

    if (shiftsToCreate.length === 0) return { created: 0, checklists: 0, skipped: 0 };

    const { data: createdShifts, error: shiftError } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .insert(shiftsToCreate)
      .select('id, shift_template_id');

    if (shiftError) throw shiftError;

    let checklistsCount = 0;
    const participantInserts: any[] = [];
    const checklistInserts: any[] = [];

    createdShifts.forEach(shift => {
      participants.forEach(p => {
        participantInserts.push({ shift_id: shift.id, participant_id: p.id });
      });

      const typeDefaults = defaults.filter(d => d.shift_template_id === shift.shift_template_id);
      typeDefaults.forEach(d => {
        checklistInserts.push({
          shift_id: shift.id,
          checklist_id: d.checklist_id,
          assignment_title: d.checklist?.house_checklist_name || 'Routine Checklist',
          house_id: houseId,
          shift_template_id: shift.shift_template_id
        });
        checklistsCount++;
      });
    });

    if (participantInserts.length > 0) {
      await supabase.from(TABLES.SHIFT_PARTICIPANTS).insert(participantInserts);
    }

    if (checklistInserts.length > 0) {
      await supabase.from(TABLES.SHIFT_ASSIGNED_CHECKLISTS).insert(checklistInserts);
    }

    return {
      created: createdShifts.length,
      checklists: checklistsCount,
      skipped: shiftsToCreate.length - createdShifts.length
    };
  },

  /**
   * List leave types.
   */
  async listLeaveTypes() {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_TYPES)
      .select('id, leave_type_name')
      .eq('is_active', true)
      .order('leave_type_name');
    
    if (error) throw error;
    return (data as any[])?.map(d => ({ id: d.id, name: d.leave_type_name })) || [];
  },

  /**
   * Get a specific leave request.
   */
  async getLeaveRequest(id: string) {
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select('leave_type_id, start_date, end_date, reason, attachment_url')
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
   * List conflicting shifts for a staff member.
   */
  async listConflictingShifts(staffId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from(TABLES.STAFF_SHIFTS)
      .select(`id, start_date, start_time, end_time, house:${TABLES.HOUSES}(house_name)`)
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
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
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
      .createSignedUrl(filePath, 3600);
    
    if (error) throw error;
    return data.signedUrl;
  }
};
