import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { CHECKLIST_STATUS } from '@/config/enums';
import { CALENDAR_VIEWS, CHECKLIST_VIEWS } from '@/config/query-views';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { supabase } from '@/lib/supabase';

export const checklistsApi = {
  /**
   * Fetches a single house checklist template with its items.
   */
  async getHouseChecklist(id: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CHECKLISTS)
      .select(
        `
        *,
        items:${TABLES.HOUSE_CHECKLIST_ITEMS}(*)
      `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      data.items = (data.items || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      );
    }
    return data;
  },

  /**
   * List checklists for a house with their items and optionally their latest submission.
   */
  async listHouseChecklists(houseId: string, scheduledDate?: string) {
    const { data: checklists, error: clError } = await supabase
      .from(TABLES.HOUSE_CHECKLISTS)
      .select(CHECKLIST_VIEWS.WITH_ITEMS)
      .eq('house_id', houseId)
      .order('sort_order', { ascending: true });

    if (clError) throw clError;

    let subQuery = supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
      .select(CHECKLIST_VIEWS.SUBMISSION_LIST)
      .eq('house_id', houseId);

    if (scheduledDate) {
      subQuery = subQuery.eq('scheduled_date', scheduledDate);
    } else {
      subQuery = subQuery.eq('status', CHECKLIST_STATUS.in_progress);
    }

    const { data: submissions, error: subError } = await subQuery;
    if (subError) throw subError;

    return (checklists || []).map((cl) => ({
      ...cl,
      items: (cl.house_checklist_items || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      ),
      latest_submission: submissions?.find(
        (s: any) => s.checklist_id === cl.id,
      ),
    }));
  },

  /**
   * List checklist events for a house on a specific date, merging with shift-assigned checklists.
   */
  async listHouseChecklistEvents(
    houseId: string,
    date: string,
    shiftId?: string,
  ) {
    let shiftSpecificChecklists: any[] = [];

    if (shiftId) {
      const { data: assignedData, error: shiftError } = await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .select('checklist_id, assignment_title, shift_template_id')
        .eq('shift_id', shiftId)
        .order('sort_order', { ascending: true });

      if (!shiftError && assignedData) {
        shiftSpecificChecklists = assignedData;
      }
    }

    const { data: events, error: eventError } = await supabase
      .from(TABLES.HOUSE_CALENDAR_EVENTS)
      .select(CALENDAR_VIEWS.CHECKLIST_EVENT)
      .eq('house_id', houseId)
      .eq('event_date', date)
      .eq('is_checklist_event', true);

    if (eventError) throw eventError;

    const eventsWithFilteredSubs = (events || []).map((e) => ({
      ...e,
      submissions: ((e.submissions as any[]) || [])
        .filter((s) => s.scheduled_date === date)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
    }));

    const combinedEvents = [...eventsWithFilteredSubs];

    if (shiftId && shiftSpecificChecklists.length > 0) {
      for (const ac of shiftSpecificChecklists) {
        const existingEvent = combinedEvents.find(
          (e) => e.house_checklist_id === ac.checklist_id,
        );

        if (!existingEvent) {
          const { data: shiftSubs } = await supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
            .select('id, status, updated_at, scheduled_date')
            .eq('checklist_id', ac.checklist_id)
            .eq('shift_id', shiftId)
            .order('updated_at', { ascending: false })
            .limit(1);

          const shiftSub = shiftSubs?.[0];

          combinedEvents.push({
            id: `shift-cl-${ac.checklist_id}-${shiftId}`,
            house_id: houseId,
            title: ac.assignment_title,
            event_date: date,
            is_checklist_event: true,
            is_shift_routine: true,
            shift_id: shiftId,
            shift_template_id: ac.shift_template_id,
            house_checklist_id: ac.checklist_id,
            status: 'scheduled',
            submissions: shiftSub ? [shiftSub] : [],
          });
        } else {
          existingEvent.title = ac.assignment_title;
        }
      }
    }

    if (combinedEvents.length === 0) return [];

    const checklistIds = [
      ...new Set(combinedEvents.map((e) => e.house_checklist_id)),
    ];
    const { data: checklists, error: clError } = await supabase
      .from(TABLES.HOUSE_CHECKLISTS)
      .select(CHECKLIST_VIEWS.WITH_ITEMS)
      .in('id', checklistIds);

    if (clError) throw clError;

    return combinedEvents.map((event) => {
      const checklist = checklists?.find(
        (cl) => cl.id === event.house_checklist_id,
      );
      return {
        ...event,
        checklist: checklist
          ? {
              ...checklist,
              items: (checklist.house_checklist_items || []).sort(
                (a: any, b: any) => a.sort_order - b.sort_order,
              ),
            }
          : undefined,
        latest_submission: event.submissions?.[0] || null,
      };
    });
  },

  /**
   * Get checklist submissions with optional filters.
   */
  async getChecklistSubmissions(params: {
    houseId?: string;
    checklistId?: string;
    status?: string;
    scheduledDate?: string;
    shiftId?: string;
  }) {
    const { houseId, checklistId, status, scheduledDate, shiftId } = params;
    let query = supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
      .select(CHECKLIST_VIEWS.SUBMISSION_LIST);

    if (houseId) query = query.eq('house_id', houseId);
    if (checklistId) query = query.eq('checklist_id', checklistId);
    if (status) query = query.eq('status', status);
    if (scheduledDate) query = query.eq('scheduled_date', scheduledDate);
    if (shiftId) query = query.eq('shift_id', shiftId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches checklist history with filtering, sorting, and pagination.
   */
  async getChecklistHistory(params: {
    pageIndex?: number;
    pageSize?: number;
    sorting?: Array<{ id: string; desc: boolean }>;
    filters?: {
      houseIds?: string[];
      staffId?: string;
      searchTerm?: string;
    };
  }) {
    const { pageIndex = 0, pageSize = 10, sorting = [], filters = {} } = params;

    let query = supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
      .select(CHECKLIST_VIEWS.HISTORY, { count: 'exact' });

    // Apply House Filters
    if (filters.houseIds && filters.houseIds.length > 0) {
      query = query.in('house_id', filters.houseIds);
    }

    // Apply Staff Filter
    if (filters.staffId) {
      query = query.eq('submitted_by', filters.staffId);
    }

    // Apply Sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      query = query.order(sort.id, { ascending: !sort.desc });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    // Apply Pagination
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const submissions = (data || []).map((sub) => {
      const checklists = (sub as any).house_checklists as unknown as {
        house_checklist_name?: string;
      } | null;
      const staff = (sub as any).staff as unknown as {
        id: string;
        staff_name?: string;
        photo_url?: string;
      } | null;
      const house = (sub as any).houses as unknown as {
        id: string;
        house_name?: string;
      } | null;
      const items =
        ((sub as any).ic_house_checklist_submission_items as unknown as Array<{
          is_completed: boolean;
        }>) || [];

      return {
        ...sub,
        checklist_name: checklists?.house_checklist_name || 'Deleted Checklist',
        staff_name: staff?.staff_name || 'Unknown Staff',
        staff_info: staff,
        house_name: house?.house_name || 'Unknown House',
        house_info: house,
        item_count: items.length || 0,
        completed_item_count: items.filter((i) => i.is_completed).length || 0,
      };
    });

    return {
      data: submissions,
      count: count || 0,
    };
  },

  /**
   * Fetches a draft submission for a checklist in a house.
   */
  async getDraftSubmission(checklistId: string, houseId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
      .select(CHECKLIST_VIEWS.SUBMISSION_DETAIL)
      .eq('checklist_id', checklistId)
      .eq('house_id', houseId)
      .eq('status', CHECKLIST_STATUS.in_progress)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches items for a specific checklist submission.
   */
  async getSubmissionItems(submissionId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS)
      .select(
        `
        id, 
        submission_id, 
        item_id, 
        is_completed, 
        status,
        note, 
        completed_at,
        completed_by_staff:${TABLES.STAFF}!house_checklist_submission_items_completed_by_fkey(id, staff_name)
      `,
      )
      .eq('submission_id', submissionId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches attachments for a submission.
   */
  async getSubmissionAttachments(submissionId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEM_ATTACHMENTS)
      .select(
        'id, submission_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at',
      )
      .eq('submission_id', submissionId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Upserts a checklist submission.
   */
  async upsertSubmission(
    payload: Partial<
      Database['public']['Tables']['ic_house_checklist_submissions']['Insert']
    >,
    id?: string,
  ) {
    if (id) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .insert([payload as any])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  /**
   * Upserts submission items.
   */
  async upsertSubmissionItems(items: any[]) {
    const { error } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS)
      .upsert(items, { onConflict: 'submission_id,item_id' });
    if (error) throw error;
  },

  /**
   * Deletes an attachment.
   */
  async deleteAttachment(id: string) {
    const { data, error: fetchError } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEM_ATTACHMENTS)
      .select('file_path')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (data?.file_path) {
      await supabase.storage
        .from(STORAGE_BUCKETS.CHECKLIST_ATTACHMENTS)
        .remove([data.file_path]);
    }

    const { error: deleteError } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEM_ATTACHMENTS)
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
  },

  /**
   * Uploads an attachment.
   */
  async uploadAttachment(
    submissionId: string,
    itemId: string,
    file: File,
    staffId?: string,
  ) {
    const filePath = `${submissionId}/${itemId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.CHECKLIST_ATTACHMENTS)
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEM_ATTACHMENTS)
      .insert({
        submission_id: submissionId,
        item_id: itemId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: staffId || null,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    return data;
  },

  /**
   * Generates a signed URL for an attachment.
   */
  async getAttachmentSignedUrl(filePath: string, fileName?: string) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.CHECKLIST_ATTACHMENTS)
      .createSignedUrl(filePath, 3600, {
        download: fileName || true,
      });

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Persists the execution of a checklist (Submission, Items, and Attachments).
   */
  async persistExecution(params: {
    checklistId: string;
    houseId: string;
    calendarEventId: string;
    scheduledDate: string;
    status: string;
    staffId?: string;
    submissionId?: string;
    results: any;
  }) {
    const {
      checklistId,
      houseId,
      calendarEventId,
      scheduledDate,
      status,
      staffId,
      results,
    } = params;
    let submissionId = params.submissionId;

    if (!submissionId) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .insert({
          checklist_id: checklistId,
          house_id: houseId,
          calendar_event_id: calendarEventId,
          scheduled_date: scheduledDate,
          status: status,
          submitted_by: staffId || null,
          started_at: new Date().toISOString(),
          completed_at:
            status === CHECKLIST_STATUS.completed
              ? new Date().toISOString()
              : null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create submission');
      submissionId = data.id;
    } else {
      const { error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .update({
          status: status,
          submitted_by: staffId || null,
          completed_at:
            status === CHECKLIST_STATUS.completed
              ? new Date().toISOString()
              : null,
        })
        .eq('id', submissionId);

      if (error) throw error;
    }

    const submissionItems = results.items.map((item: any) => ({
      submission_id: submissionId,
      item_id: item.item_id,
      is_completed: !!item.is_completed,
      status: item.is_completed
        ? CHECKLIST_STATUS.COMPLETED
        : CHECKLIST_STATUS.PENDING,
      note: item.note,
      completed_by: item.completed_by,
      completed_at: item.is_completed ? new Date().toISOString() : null,
    }));

    await this.upsertSubmissionItems(submissionItems);

    if (results.queuedAttachments) {
      for (const itemId in results.queuedAttachments) {
        for (const queued of results.queuedAttachments[itemId]) {
          await this.uploadAttachment(
            submissionId!,
            itemId,
            queued.file,
            staffId,
          );
        }
      }
    }

    return submissionId;
  },

  /**
   * Upserts a checklist template.
   */
  async upsertChecklist(payload: any, id?: string) {
    const { items, ...dbPayload } = payload;

    let result;
    if (id) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLISTS)
        .update(dbPayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLISTS)
        .insert([dbPayload])
        .select()
        .maybeSingle();
      if (error) throw error;
      result = data;
    }

    if (result && items) {
      await this.syncChecklistItems(result.id, items);
    }

    return result;
  },

  /**
   * Deletes a checklist template.
   */
  async deleteChecklist(id: string) {
    const { error } = await supabase
      .from(TABLES.HOUSE_CHECKLISTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Checklist Schedules
   */
  async createSchedule(schedule: any) {
    const { data: newSchedule, error } = await supabase
      .from(TABLES.CHECKLIST_SCHEDULES)
      .insert(schedule)
      .select()
      .maybeSingle();

    if (error) throw error;
    return newSchedule;
  },

  async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from(TABLES.CHECKLIST_SCHEDULES)
      .delete()
      .eq('id', scheduleId);
    if (error) throw error;
    return true;
  },

  async deleteCalendarEvent(eventId: string) {
    const { error } = await supabase
      .from(TABLES.HOUSE_CALENDAR_EVENTS)
      .delete()
      .eq('id', eventId);
    if (error) throw error;
    return true;
  },

  async upsertCalendarEvents(events: any[]) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CALENDAR_EVENTS)
      .upsert(events)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches shift-assigned checklists and house checklist submissions for a list of shifts.
   */
  async getChecklistDetailsForShifts(params: {
    shiftIds: string[];
    houseIds: string[];
    startDate: string;
    endDate: string;
  }) {
    const { shiftIds, houseIds, startDate, endDate } = params;
    if (shiftIds.length === 0 && houseIds.length === 0)
      return { assigned: [], submissions: [], events: [] };

    // 1. Fetch shift-assigned checklists
    const fetchAssigned = async () => {
      if (shiftIds.length === 0) return [];
      const { data, error } = await supabase
        .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
        .select(
          `
          id,
          shift_id,
          checklist_id,
          assignment_title,
          sort_order
        `,
        )
        .in('shift_id', shiftIds);
      if (error) throw error;
      return data || [];
    };

    // 2. Fetch submissions (both shift-specific and house-wide scheduled)
    const fetchSubmissions = async () => {
      let shiftSubmissions: any[] = [];
      let houseSubmissions: any[] = [];

      const subPromises: Promise<any>[] = [];

      if (shiftIds.length > 0) {
        subPromises.push(
          supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
            .select(
              'id, checklist_id, house_id, shift_id, status, scheduled_date',
            )
            .in('shift_id', shiftIds)
            .then(({ data, error }) => {
              if (error) throw error;
              shiftSubmissions = data || [];
            }),
        );
      }

      if (houseIds.length > 0) {
        subPromises.push(
          supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
            .select(
              'id, checklist_id, house_id, shift_id, status, scheduled_date',
            )
            .in('house_id', houseIds)
            .gte('scheduled_date', startDate)
            .lte('scheduled_date', endDate)
            .is('shift_id', null)
            .then(({ data, error }) => {
              if (error) throw error;
              houseSubmissions = data || [];
            }),
        );
      }

      await Promise.all(subPromises);
      return [...shiftSubmissions, ...houseSubmissions];
    };

    // 3. Fetch scheduled calendar events for houses
    const fetchEvents = async () => {
      if (houseIds.length === 0) return [];
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(
          `
          id,
          house_id,
          house_checklist_id,
          event_date,
          title
        `,
        )
        .in('house_id', houseIds)
        .eq('is_checklist_event', true)
        .gte('event_date', startDate)
        .lte('event_date', endDate);
      if (error) throw error;
      return data || [];
    };

    const [assigned, submissions, events] = await Promise.all([
      fetchAssigned(),
      fetchSubmissions(),
      fetchEvents(),
    ]);

    return { assigned, submissions, events };
  },

  /**
   * Synchronizes items for a checklist template.
   */
  async syncChecklistItems(checklistId: string, items: any[]) {
    await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEMS)
      .delete()
      .eq('checklist_id', checklistId);

    if (items.length > 0) {
      const { error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_ITEMS)
        .insert(
          items.map((i) => ({
            ...i,
            checklist_id: checklistId,
            id: undefined,
            created_at: undefined,
            updated_at: undefined,
          })),
        );
      if (error) throw error;
    }
  },
};
