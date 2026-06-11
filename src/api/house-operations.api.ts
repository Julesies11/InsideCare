import { complianceApi } from '@/api/compliance.api';
import { Database } from '@/models/database.types';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { format, subDays } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { CALENDAR_VIEWS, HOUSE_VIEWS } from '@/config/query-views';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { supabase } from '@/lib/supabase';

/**
 * Data Access Layer (DAL) for House Operational Entities.
 *
 * Handles facility-specific operations like Calendar Events, Resources,
 * Forms, Files, and Communications.
 */
export const houseOperationsApi = {
  /**
   * Calendar Events
   */
  calendar: {
    async list(params: {
      houseId?: string;
      startDate?: string;
      endDate?: string;
      view?: string;
      signal?: AbortSignal;
    }) {
      const {
        houseId,
        startDate,
        endDate,
        view = CALENDAR_VIEWS.STANDARD,
        signal,
      } = params;
      let query = supabase.from(TABLES.HOUSE_CALENDAR_EVENTS).select(view);

      if (houseId) query = query.eq('house_id', houseId);
      if (startDate) query = query.gte('event_date', startDate);
      if (endDate) query = query.lte('event_date', endDate);

      const { data, error } = await query
        .order('event_date', { ascending: true })
        .abortSignal(signal as any);

      if (error) throw error;
      return data || [];
    },

    async get(id: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .select(CALENDAR_VIEWS.DETAIL)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async upsert(
      event:
        | Database['public']['Tables']['ic_house_calendar_events']['Insert']
        | Database['public']['Tables']['ic_house_calendar_events']['Insert'][],
    ) {
      const payload = Array.isArray(event) ? event : [event];
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .upsert(payload)
        .select(CALENDAR_VIEWS.STANDARD);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async bulkDelete(params: {
      houseId: string;
      startDate: string;
      endDate: string;
      deleteChecklists?: boolean;
    }) {
      const { houseId, startDate, endDate, deleteChecklists } = params;
      const promises = [];

      promises.push(
        supabase
          .from(TABLES.HOUSE_CALENDAR_EVENTS)
          .delete()
          .eq('house_id', houseId)
          .gte('event_date', startDate)
          .lte('event_date', endDate),
      );

      if (deleteChecklists) {
        promises.push(
          supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
            .delete()
            .eq('house_id', houseId)
            .gte('created_at', `${startDate}T00:00:00.000Z`)
            .lte('created_at', `${endDate}T23:59:59.999Z`),
        );
      }

      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
      return true;
    },

    async uploadAttachment(
      houseId: string,
      eventId: string,
      file: File,
      userId?: string,
    ) {
      const ext = file.name.split('.').pop();
      const filePath = `${houseId}/calendar-events/${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_ATTACHMENTS)
        .insert({
          event_id: eventId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async deleteAttachment(id: string, filePath: string) {
      await supabase.storage
        .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
        .remove([filePath]);
      const { error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_ATTACHMENTS)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async createWithRelations(
      event: any,
      participantIds: string[],
      staffIds: string[],
      attachments: any[],
      userId?: string,
    ) {
      const { data: newEvent, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .insert(event)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!newEvent) throw new Error('Failed to create event');

      // Add participants
      if (participantIds.length > 0) {
        await supabase
          .from(TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS)
          .insert(
            participantIds.map((pId) => ({
              event_id: newEvent.id,
              participant_id: pId,
            })),
          );
      }

      // Add staff
      if (staffIds.length > 0) {
        await supabase
          .from(TABLES.HOUSE_CALENDAR_EVENT_STAFF)
          .insert(
            staffIds.map((sId) => ({ event_id: newEvent.id, staff_id: sId })),
          );
      }

      // Add attachments
      if (attachments?.length > 0) {
        for (const attachment of attachments) {
          if (attachment.file) {
            await this.uploadAttachment(
              newEvent.house_id,
              newEvent.id,
              attachment.file,
              userId,
            );
          }
        }
      }

      return newEvent;
    },

    async updateWithRelations(
      id: string,
      eventUpdates: any,
      attachmentsToDelete: any[],
      newAttachments: any[],
      userId?: string,
    ) {
      // 1. Update main event
      const { data: updatedEvent, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .update(eventUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updatedEvent) throw new Error('Event not found');

      // 2. Delete attachments
      if (attachmentsToDelete?.length > 0) {
        for (const att of attachmentsToDelete) {
          await this.deleteAttachment(att.id, att.file_path);
        }
      }

      // 3. Upload new attachments
      if (newAttachments?.length > 0) {
        for (const att of newAttachments) {
          if (att.file) {
            await this.uploadAttachment(
              updatedEvent.house_id,
              id,
              att.file,
              userId,
            );
          }
        }
      }

      return updatedEvent;
    },
  },

  /**
   * Handover & Issues
   */
  handover: {
    /**
     * Lists handover issues (incomplete checklists) for a house from yesterday.
     */
    async listHandoverIssues(houseIds: string[]) {
      if (!houseIds || houseIds.length === 0) return [];

      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
        .select(
          `
          id, status, scheduled_date, house_id,
          houses:ic_houses(house_name),
          house_checklists:ic_house_checklists(house_checklist_name),
          ic_house_checklist_submission_items:ic_house_checklist_submission_items(id, is_completed, house_checklist_items:ic_house_checklist_items(title, is_required))
        `,
        )
        .in('house_id', houseIds)
        .eq('scheduled_date', yesterday);

      if (error) throw error;

      return (data || []).filter((sub) => {
        if (sub.status === 'in_progress') return true;
        const items = (sub.ic_house_checklist_submission_items as any[]) || [];
        return items.some(
          (item) =>
            !item.is_completed && item.house_checklist_items?.is_required,
        );
      });
    },
  },

  /**
   * Forms
   */
  forms: {
    async list(houseId: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_FORMS)
        .select(HOUSE_VIEWS.FORMS)
        .eq('house_id', houseId)
        .order('form_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async upsert(
      form:
        | Database['public']['Tables']['ic_house_forms']['Insert']
        | Database['public']['Tables']['ic_house_forms']['Insert'][],
    ) {
      const payload = Array.isArray(form) ? form : [form];
      const { data, error } = await supabase
        .from(TABLES.HOUSE_FORMS)
        .upsert(payload)
        .select(HOUSE_VIEWS.FORMS);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_FORMS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
  },

  /**
   * Resources
   */
  resources: {
    async list(houseId: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_RESOURCES)
        .select(HOUSE_VIEWS.RESOURCES)
        .eq('house_id', houseId)
        .order('title', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async upsert(
      resource:
        | Database['public']['Tables']['ic_house_resources']['Insert']
        | Database['public']['Tables']['ic_house_resources']['Insert'][],
    ) {
      const payload = Array.isArray(resource) ? resource : [resource];
      const { data, error } = await supabase
        .from(TABLES.HOUSE_RESOURCES)
        .upsert(payload)
        .select(HOUSE_VIEWS.RESOURCES);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_RESOURCES)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
  },

  /**
   * Communications / Logs
   */
  comms: {
    async list(houseId: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_COMMS)
        .select(HOUSE_VIEWS.COMMS)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async create(comm: {
      house_id: string;
      content: string;
      entry_date: string;
    }) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_COMMS)
        .insert([comm])
        .select(HOUSE_VIEWS.COMMS)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  /**
   * Files
   */
  files: {
    async list(houseId: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_FILES)
        .select(HOUSE_VIEWS.FILES)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_FILES)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async getAttachmentSignedUrl(
      filePath: string,
      downloadName?: string | boolean,
    ) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
        .createSignedUrl(filePath, 3600, {
          download: downloadName || false,
        });

      if (error) throw error;
      return data.signedUrl;
    },
  },

  /**
   * Helper to ensure empty strings are converted to null for date/time columns.
   */
  sanitizeValue(val: any) {
    if (val === '') return null;
    return val;
  },

  /**
   * Bulk synchronizes all pending operational changes for a house.
   */
  async syncOperations(houseId: string, pending: HousePendingChanges) {
    const errors: string[] = [];

    // 1. Staff Assignments
    if (pending?.staff?.toAdd?.length > 0) {
      const staffInserts = pending.staff.toAdd.map((s) => {
        const { tempId, staff_name, ...rest } = s as any;
        return {
          ...rest,
          house_id: houseId,
          start_date: this.sanitizeValue(rest.start_date),
          end_date: this.sanitizeValue(rest.end_date),
        };
      });
      const { error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .insert(staffInserts);
      if (error) errors.push(`Staff Add: ${error.message}`);
    }
    if (pending?.staff?.toUpdate?.length > 0) {
      for (const s of pending.staff.toUpdate) {
        const { error } = await supabase
          .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
          .update({
            is_primary: s.is_primary,
            start_date: this.sanitizeValue(s.start_date),
            end_date: this.sanitizeValue(s.end_date),
            notes: s.notes,
          })
          .eq('id', s.id);
        if (error) errors.push(`Staff Update ${s.id}: ${error.message}`);
      }
    }
    if (pending?.staff?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .delete()
        .in('id', pending.staff.toDelete);
      if (error) errors.push(`Staff Delete: ${error.message}`);
    }

    // 2. Participants (Management)
    if (pending?.participants?.toAdd?.length > 0) {
      for (const p of pending.participants.toAdd) {
        const updates: any = { house_id: houseId };
        if (p.move_in_date !== undefined)
          updates.move_in_date = this.sanitizeValue(p.move_in_date);
        if (p.is_active !== undefined)
          updates.status = p.is_active ? 'active' : 'inactive';
        else updates.status = 'active'; // Default to active if not specified

        const { error } = await supabase
          .from(TABLES.PARTICIPANTS)
          .update(updates)
          .eq('id', p.participant_id);
        if (error)
          errors.push(`Participants Add ${p.participant_id}: ${error.message}`);
      }
    }
    if (pending?.participants?.toUpdate?.length > 0) {
      for (const p of pending.participants.toUpdate) {
        const updates: any = {};
        if (p.move_in_date !== undefined)
          updates.move_in_date = this.sanitizeValue(p.move_in_date);
        if (p.is_active !== undefined)
          updates.status = p.is_active ? 'active' : 'inactive';
        const { error } = await supabase
          .from(TABLES.PARTICIPANTS)
          .update(updates)
          .eq('id', p.id);
        if (error) errors.push(`Participant Update ${p.id}: ${error.message}`);
      }
    }
    if (pending?.participants?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .update({ house_id: null })
        .in('id', pending.participants.toDelete);
      if (error) errors.push(`Participants Delete: ${error.message}`);
    }

    // 3. Calendar Events
    if (pending?.calendarEvents?.toAdd?.length > 0) {
      for (const event of pending.calendarEvents.toAdd) {
        const { data: newEvent, error } = await supabase
          .from(TABLES.HOUSE_CALENDAR_EVENTS)
          .insert({
            house_id: houseId,
            title: event.title,
            event_type_id: event.event_type_id,
            description: event.description,
            event_date: this.sanitizeValue(event.event_date),
            start_time: this.sanitizeValue(event.start_time),
            end_time: this.sanitizeValue(event.end_time),
            status: event.status || 'scheduled',
            location: event.location,
            is_checklist_event: event.is_checklist_event,
            house_checklist_id: event.house_checklist_id,
            checklist_schedule_id: event.checklist_schedule_id,
          })
          .select()
          .maybeSingle();

        if (error) errors.push(`Event Add ${event.title}: ${error.message}`);
        else if (newEvent) {
          if (event.participant_ids?.length) {
            await supabase
              .from(TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS)
              .insert(
                event.participant_ids.map((pId) => ({
                  event_id: newEvent.id,
                  participant_id: pId,
                })),
              );
          }
          if (event.assigned_staff_ids?.length) {
            await supabase
              .from(TABLES.HOUSE_CALENDAR_EVENT_STAFF)
              .insert(
                event.assigned_staff_ids.map((sId) => ({
                  event_id: newEvent.id,
                  staff_id: sId,
                })),
              );
          }
        }
      }
    }
    if (pending?.calendarEvents?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .delete()
        .in('id', pending.calendarEvents.toDelete);
      if (error) errors.push(`Calendar Events Delete: ${error.message}`);
    }

    // 4. Checklists
    if (pending?.checklists?.toAdd?.length > 0) {
      for (const cl of pending.checklists.toAdd) {
        const { data, error } = await supabase
          .from(TABLES.HOUSE_CHECKLISTS)
          .insert({
            house_id: houseId,
            house_checklist_name: cl.house_checklist_name,
            days_of_week: cl.days_of_week,
            description: cl.description,
            master_id: cl.master_id,
            sort_order: cl.sort_order,
          })
          .select()
          .maybeSingle();

        if (error)
          errors.push(
            `Checklist Add ${cl.house_checklist_name}: ${error.message}`,
          );
        else if (data && cl.items?.length > 0) {
          const { error: itemsError } = await supabase
            .from(TABLES.HOUSE_CHECKLIST_ITEMS)
            .insert(
              cl.items.map((i) => {
                const { tempId, ...itemData } = i;
                return { ...itemData, checklist_id: data.id };
              }),
            );
          if (itemsError)
            errors.push(
              `Checklist Items Add for ${cl.house_checklist_name}: ${itemsError.message}`,
            );
        }
      }
    }
    if (pending?.checklists?.toUpdate?.length > 0) {
      for (const cl of pending.checklists.toUpdate) {
        // 1. Update main checklist details
        const { error } = await supabase
          .from(TABLES.HOUSE_CHECKLISTS)
          .update({
            house_checklist_name: cl.house_checklist_name,
            days_of_week: cl.days_of_week,
            description: cl.description,
            master_id: cl.master_id,
            sort_order: cl.sort_order,
          })
          .eq('id', cl.id);

        if (error) {
          errors.push(`Checklist Update ${cl.id}: ${error.message}`);
          continue;
        }

        // 2. Synchronize Items (Surgical Sync)
        if (cl.items) {
          const incomingIds = cl.items.map((i) => i.id).filter(Boolean);

          // Delete items that are no longer in the list
          try {
            const deleteQuery = supabase
              .from(TABLES.HOUSE_CHECKLIST_ITEMS)
              .delete()
              .eq('checklist_id', cl.id);

            if (incomingIds.length > 0) {
              await deleteQuery.not('id', 'in', `(${incomingIds.join(',')})`);
            } else {
              await deleteQuery;
            }
          } catch (delErr) {
            // Silently ignore deletion failures for items with history (FK constraint)
            // They will simply remain in the DB and reappear on refresh
          }

          // Upsert current items (Add/Update)
          if (cl.items.length > 0) {
            const { error: itemsError } = await supabase
              .from(TABLES.HOUSE_CHECKLIST_ITEMS)
              .upsert(
                cl.items.map((i) => {
                  const { tempId, ...itemData } = i;
                  return { ...itemData, checklist_id: cl.id };
                }),
              );
            if (itemsError)
              errors.push(
                `Checklist Items Update for ${cl.house_checklist_name}: ${itemsError.message}`,
              );
          }
        }
      }
    }
    if (pending?.checklists?.toDelete?.length > 0) {
      // 1. Delete associated items first to avoid FK constraint violations
      await supabase
        .from(TABLES.HOUSE_CHECKLIST_ITEMS)
        .delete()
        .in('checklist_id', pending.checklists.toDelete);

      // 2. Delete associated schedules
      await supabase
        .from(TABLES.CHECKLIST_SCHEDULES)
        .delete()
        .in('house_checklist_id', pending.checklists.toDelete);

      // 3. Nullify calendar event references so they don't block deletion
      await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENTS)
        .update({ house_checklist_id: null, is_checklist_event: false })
        .in('house_checklist_id', pending.checklists.toDelete);

      // 4. Finally delete the checklists
      const { error } = await supabase
        .from(TABLES.HOUSE_CHECKLISTS)
        .delete()
        .in('id', pending.checklists.toDelete);
      if (error) {
        if (error.code === '23503') {
          errors.push(
            `Checklist Delete: Cannot delete checklists that have clinical submissions (history).`,
          );
        } else {
          errors.push(`Checklist Delete: ${error.message}`);
        }
      }
    }

    // 5. Resources
    if (pending?.resources?.toAdd?.length > 0) {
      for (const res of pending.resources.toAdd) {
        let file_url = res.file_url;
        let file_name = res.file_name;
        let file_size = res.file_size;

        if (res.file) {
          const ext = res.file.name.split('.').pop();
          const filePath = `${houseId}/resources/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
            .upload(filePath, res.file);

          if (uploadError) {
            errors.push(
              `Resource File Upload ${res.title}: ${uploadError.message}`,
            );
            continue;
          }
          file_url = filePath;
          file_name = res.file.name;
          file_size = res.file.size;
        }

        const { error } = await supabase.from(TABLES.HOUSE_RESOURCES).insert({
          house_id: houseId,
          title: res.title,
          category: res.category,
          type: res.type,
          description: res.description,
          priority: res.priority,
          phone: res.phone,
          address: res.address,
          notes: res.notes,
          file_url,
          file_name,
          file_size,
        });

        if (error) errors.push(`Resource Add ${res.title}: ${error.message}`);
      }
    }

    if (pending?.resources?.toUpdate?.length > 0) {
      for (const res of pending.resources.toUpdate) {
        const updates: any = {
          title: res.title,
          category: res.category,
          type: res.type,
          description: res.description,
          priority: res.priority,
          phone: res.phone,
          address: res.address,
          notes: res.notes,
        };

        if (res.is_active !== undefined) {
          updates.is_active = res.is_active;
        }

        if (res.toDeleteFile && res.file_url) {
          await supabase.storage
            .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
            .remove([res.file_url]);
          updates.file_url = null;
          updates.file_name = null;
          updates.file_size = null;
        }

        if (res.file) {
          // If updating file, delete old one first if it exists
          if (res.file_url && !res.toDeleteFile) {
            await supabase.storage
              .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
              .remove([res.file_url]);
          }

          const ext = res.file.name.split('.').pop();
          const filePath = `${houseId}/resources/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
            .upload(filePath, res.file);

          if (uploadError) {
            errors.push(
              `Resource File Update ${res.title}: ${uploadError.message}`,
            );
            continue;
          }
          updates.file_url = filePath;
          updates.file_name = res.file.name;
          updates.file_size = res.file.size;
        }

        const { error } = await supabase
          .from(TABLES.HOUSE_RESOURCES)
          .update(updates)
          .eq('id', res.id);
        if (error) errors.push(`Resource Update ${res.id}: ${error.message}`);
      }
    }

    if (pending?.resources?.toDelete?.length > 0) {
      for (const res of pending.resources.toDelete) {
        if (res.filePath) {
          await supabase.storage
            .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
            .remove([res.filePath]);
        }
        const { error } = await supabase
          .from(TABLES.HOUSE_RESOURCES)
          .delete()
          .eq('id', res.id);
        if (error) errors.push(`Resource Delete ${res.id}: ${error.message}`);
      }
    }

    // 6. Comms
    if (pending?.comms?.toAdd?.length > 0) {
      const { error } = await supabase.from(TABLES.HOUSE_COMMS).insert(
        pending.comms.toAdd.map((c) => ({
          house_id: houseId,
          content: c.content,
          entry_date: this.sanitizeValue(c.entry_date),
        })),
      );
      if (error) errors.push(`Comms Add: ${error.message}`);
    }

    if (pending?.comms?.toUpdate?.length > 0) {
      for (const c of pending.comms.toUpdate) {
        const { error } = await supabase
          .from(TABLES.HOUSE_COMMS)
          .update({ content: c.content })
          .eq('id', c.id);
        if (error) errors.push(`Comms Update ${c.id}: ${error.message}`);
      }
    }

    // 7. Compliance Requirements
    if (pending?.complianceTypeIds !== undefined) {
      try {
        await complianceApi.house.updateRequirements(
          houseId,
          pending.complianceTypeIds,
        );
      } catch (err: any) {
        errors.push(`Compliance Requirements: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`House sync failed with errors: ${errors.join('; ')}`);
    }

    return true;
  },
};
