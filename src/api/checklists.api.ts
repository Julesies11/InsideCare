import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { CHECKLIST_VIEWS, CALENDAR_VIEWS } from '@/config/query-views';
import { CHECKLIST_STATUS } from '@/config/enums';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { Database } from '@/models/database.types';

export const checklistsApi = {
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

    return (checklists || []).map(cl => ({
      ...cl,
      items: (cl.house_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      latest_submission: submissions?.find((s: any) => s.checklist_id === cl.id)
    }));
  },

  /**
   * List checklist events for a house on a specific date, merging with shift-assigned checklists.
   */
  async listHouseChecklistEvents(houseId: string, date: string, shiftId?: string) {
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

    const eventsWithFilteredSubs = (events || []).map(e => ({
      ...e,
      submissions: (e.submissions as any[] || [])
        .filter(s => s.scheduled_date === date)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }));

    const combinedEvents = [...eventsWithFilteredSubs];

    if (shiftId && shiftSpecificChecklists.length > 0) {
      for (const ac of shiftSpecificChecklists) {
        const existingEvent = combinedEvents.find(e => e.house_checklist_id === ac.checklist_id);
        
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
            submissions: shiftSub ? [shiftSub] : []
          });
        } else {
          existingEvent.title = ac.assignment_title;
        }
      }
    }

    if (combinedEvents.length === 0) return [];

    const checklistIds = [...new Set(combinedEvents.map(e => e.house_checklist_id))];
    const { data: checklists, error: clError } = await supabase
      .from(TABLES.HOUSE_CHECKLISTS)
      .select(CHECKLIST_VIEWS.WITH_ITEMS)
      .in('id', checklistIds);

    if (clError) throw clError;

    return combinedEvents.map(event => {
      const checklist = checklists?.find(cl => cl.id === event.house_checklist_id);
      return {
        ...event,
        checklist: checklist ? {
          ...checklist,
          items: (checklist.house_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
        } : undefined,
        latest_submission: event.submissions?.[0] || null
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
   * Fetches attachments for a submission.
   */
  async getSubmissionAttachments(submissionId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_CHECKLIST_ITEM_ATTACHMENTS)
      .select('id, submission_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at')
      .eq('submission_id', submissionId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Upserts a checklist submission.
   */
  async upsertSubmission(payload: Partial<Database['public']['Tables']['ic_house_checklist_submissions']['Insert']>, id?: string) {
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
      await supabase.storage.from(STORAGE_BUCKETS.CHECKLIST_ATTACHMENTS).remove([data.file_path]);
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
  async uploadAttachment(submissionId: string, itemId: string, file: File, staffId?: string) {
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
        uploaded_by: staffId || null
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
        download: fileName || true
      });

    if (error) throw error;
    return data.signedUrl;
  }
};
