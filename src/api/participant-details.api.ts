import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { PARTICIPANT_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';
import { ParticipantPendingChanges } from '@/models/participant-pending-changes';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

/**
 * Data Access Layer (DAL) for Participant Child Entities.
 * 
 * Handles all sub-records linked to a participant such as Medications, 
 * Goals, Contacts, Funding, and Documents.
 */
export const participantDetailsApi = {
  /**
   * Helper to strip non-existent columns from payloads to prevent 42703 errors.
   */
  sanitizeRecord(record: any, forbidden: string[]) {
    const sanitized = { ...record };
    forbidden.forEach(key => delete sanitized[key]);
    return sanitized;
  },

  /**
   * Medications
   */
  medications: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .select(PARTICIPANT_VIEWS.MEDICATIONS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(medications: Database['public']['Tables']['ic_participant_medications']['Insert'] | Database['public']['Tables']['ic_participant_medications']['Insert'][]) {
      const records = Array.isArray(medications) ? medications : [medications];
      
      const sanitized = records.map(r => participantDetailsApi.sanitizeRecord(r, ['frequency', 'instructions']));

      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .upsert(sanitized)
        .select(PARTICIPANT_VIEWS.MEDICATIONS);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Goals
   */
  goals: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .select(PARTICIPANT_VIEWS.GOALS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(goals: Database['public']['Tables']['ic_participant_goals']['Insert'] | Database['public']['Tables']['ic_participant_goals']['Insert'][]) {
      const records = Array.isArray(goals) ? goals : [goals];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .upsert(records)
        .select(PARTICIPANT_VIEWS.GOALS);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    /**
     * Goal Progress
     */
    async listProgress(goalIds: string[]) {
      if (!goalIds || goalIds.length === 0) return [];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .select('*')
        .in('goal_id', goalIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async createProgress(progress: Database['public']['Tables']['ic_participant_goal_progress']['Insert']) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .insert(progress)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");
      return data;
    },

    async updateProgress(id: string, progress_note: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .update({ progress_note })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");
      return data;
    },

    async deleteProgress(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Providers
   */
  providers: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(providers: Database['public']['Tables']['ic_participant_providers']['Insert'] | Database['public']['Tables']['ic_participant_providers']['Insert'][]) {
      const records = Array.isArray(providers) ? providers : [providers];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .upsert(records)
        .select();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Contacts
   */
  contacts: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_CONTACTS)
        .select(PARTICIPANT_VIEWS.CONTACTS)
        .eq('participant_id', participantId)
        .order('contact_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async upsert(contacts: Database['public']['Tables']['ic_participant_contacts']['Insert'] | Database['public']['Tables']['ic_participant_contacts']['Insert'][]) {
      const records = Array.isArray(contacts) ? contacts : [contacts];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_CONTACTS)
        .upsert(records)
        .select(PARTICIPANT_VIEWS.CONTACTS);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_CONTACTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Funding
   */
  funding: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_FUNDING)
        .select(PARTICIPANT_VIEWS.FUNDING)
        .eq('participant_id', participantId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(funding: Database['public']['Tables']['ic_participant_funding']['Insert'] | Database['public']['Tables']['ic_participant_funding']['Insert'][]) {
      const records = Array.isArray(funding) ? funding : [funding];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_FUNDING)
        .upsert(records)
        .select(PARTICIPANT_VIEWS.FUNDING);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_FUNDING)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Documents
   */
  documents: {
    async list(participantId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .select(PARTICIPANT_VIEWS.DOCUMENTS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getAttachmentSignedUrl(filePath: string, downloadName?: string | boolean) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
        .createSignedUrl(filePath, 3600, {
          download: downloadName || false
        });
      
      if (error) throw error;
      return data.signedUrl;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string, filePath: string) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
        .remove([filePath]);

      if (storageError) throw new Error(`Failed to delete from storage: ${storageError.message}`);

      const { error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async bulkDelete(ids: string[], filePaths: string[]) {
      if (filePaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS).remove(filePaths);
      }
      if (ids.length > 0) {
        const { error } = await supabase.from(TABLES.PARTICIPANT_DOCUMENTS).delete().in('id', ids);
        if (error) throw error;
      }
      return true;
    },

    async upload(participantId: string, file: File) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${participantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const payload = participantDetailsApi.sanitizeRecord({
        participant_id: participantId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      }, ['category', 'uploaded_by']);

      const { data, error } = await supabase.from(TABLES.PARTICIPANT_DOCUMENTS).insert(payload).select().maybeSingle();

      if (error) throw new Error(`Database insert failed: ${error.message}`);
      return data;
    },

    /**
     * Role-based access overrides for specific documents.
     */
    async listRolePermissions(documentId: string) {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENT_ROLES)
        .select(`
          id,
          document_id,
          role_id,
          access_level,
          role:${TABLES.ROLES}(id, role_name)
        `)
        .eq('document_id', documentId);

      if (error) throw error;
      return data || [];
    },

    async listMultipleRolePermissions(documentIds: string[]) {
      if (!documentIds || documentIds.length === 0) return [];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENT_ROLES)
        .select(`
          id,
          document_id,
          role_id,
          access_level,
          role:${TABLES.ROLES}(id, role_name)
        `)
        .in('document_id', documentIds);

      if (error) throw error;
      return data || [];
    },

    async updateRolePermissions(documentId: string, roles: Array<{ role_id: string; access_level: string }>) {
      // 1. Delete existing role permissions for this document
      const { error: deleteError } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENT_ROLES)
        .delete()
        .eq('document_id', documentId);

      if (deleteError) throw deleteError;

      // 2. Insert new role permissions if any
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from(TABLES.PARTICIPANT_DOCUMENT_ROLES)
          .insert(roles.map(r => ({
            document_id: documentId,
            role_id: r.role_id,
            access_level: r.access_level as any,
          })));

        if (insertError) throw insertError;
      }
      return true;
    }
  },

  /**
   * Bulk synchronizes all pending changes for a participant.
   */
  async syncDetails(participantId: string, pending: ParticipantPendingChanges) {
    const errors: string[] = [];

    // 1. Process Goals
    if (pending?.goals?.toAdd?.length > 0) {
      const { error } = await supabase.from(TABLES.PARTICIPANT_GOALS).insert(
        pending.goals.toAdd.map(g => ({ 
          participant_id: participantId, 
          goal_type: g.goal_type,
          description: g.description
        }))
      );
      if (error) errors.push(`Goals Add: ${error.message}`);
    }
    if (pending?.goals?.toUpdate?.length > 0) {
      for (const g of pending.goals.toUpdate) {
        const { error } = await supabase.from(TABLES.PARTICIPANT_GOALS).update({
          goal_type: g.goal_type,
          description: g.description
        }).eq('id', g.id);
        if (error) errors.push(`Goal Update ${g.id}: ${error.message}`);
      }
    }
    if (pending?.goals?.toDelete?.length > 0) {
      const { error } = await supabase.from(TABLES.PARTICIPANT_GOALS).delete().in('id', pending.goals.toDelete);
      if (error) errors.push(`Goals Delete: ${error.message}`);
    }

    // 2. Process Medications
    if (pending?.medications?.toAdd?.length > 0) {
      const sanitized = pending.medications.toAdd.map(m => participantDetailsApi.sanitizeRecord({ 
        participant_id: participantId, 
        medication_id: m.medication_id,
        dosage: m.dosage,
        is_active: m.is_active
      }, ['frequency', 'instructions']));

      const { error } = await supabase.from(TABLES.PARTICIPANT_MEDICATIONS).insert(sanitized);
      if (error) errors.push(`Meds Add: ${error.message}`);
    }
    if (pending?.medications?.toUpdate?.length > 0) {
      for (const m of pending.medications.toUpdate) {
        const sanitized = participantDetailsApi.sanitizeRecord({
          medication_id: m.medication_id,
          dosage: m.dosage,
          is_active: m.is_active
        }, ['frequency', 'instructions']);

        const { error } = await supabase.from(TABLES.PARTICIPANT_MEDICATIONS).update(sanitized).eq('id', m.id);
        if (error) errors.push(`Med Update ${m.id}: ${error.message}`);
      }
    }
    if (pending?.medications?.toDelete?.length > 0) {
      const { error } = await supabase.from(TABLES.PARTICIPANT_MEDICATIONS).delete().in('id', pending.medications.toDelete);
      if (error) errors.push(`Meds Delete: ${error.message}`);
    }

    // 3. Process Contacts
    if (pending?.contacts?.toAdd?.length > 0) {
      const { error } = await supabase.from(TABLES.PARTICIPANT_CONTACTS).insert(
        pending.contacts.toAdd.map(c => ({ 
          participant_id: participantId, 
          contact_name: c.contact_name,
          contact_type_id: c.contact_type_id,
          phone: c.phone,
          email: c.email,
          address: c.address,
          notes: c.notes,
          is_active: c.is_active
        }))
      );
      if (error) errors.push(`Contacts Add: ${error.message}`);
    }
    if (pending?.contacts?.toUpdate?.length > 0) {
      for (const c of pending.contacts.toUpdate) {
        const { error } = await supabase.from(TABLES.PARTICIPANT_CONTACTS).update({
          contact_name: c.contact_name,
          contact_type_id: c.contact_type_id,
          phone: c.phone,
          email: c.email,
          address: c.address,
          notes: c.notes,
          is_active: c.is_active
        }).eq('id', c.id);
        if (error) errors.push(`Contact Update ${c.id}: ${error.message}`);
      }
    }
    if (pending?.contacts?.toDelete?.length > 0) {
      const { error } = await supabase.from(TABLES.PARTICIPANT_CONTACTS).delete().in('id', pending.contacts.toDelete);
      if (error) errors.push(`Contacts Delete: ${error.message}`);
    }

    // 4. Process Shift Notes
    if (pending?.shiftNotes?.toAdd?.length > 0) {
      const { error } = await supabase.from(TABLES.SHIFT_NOTES).insert(
        pending.shiftNotes.toAdd.map(n => ({ 
          participant_id: participantId, 
          staff_id: n.staff_id,
          start_date: n.start_date,
          shift_time: n.shift_time,
          full_note: n.full_note
        }))
      );
      if (error) errors.push(`Shift Notes Add: ${error.message}`);
    }
    if (pending?.shiftNotes?.toUpdate?.length > 0) {
      for (const n of pending.shiftNotes.toUpdate) {
        const { error } = await supabase.from(TABLES.SHIFT_NOTES).update({
          staff_id: n.staff_id,
          start_date: n.start_date,
          shift_time: n.shift_time,
          full_note: n.full_note
        }).eq('id', n.id);
        if (error) errors.push(`Shift Note Update ${n.id}: ${error.message}`);
      }
    }
    if (pending?.shiftNotes?.toDelete?.length > 0) {
      const { error } = await supabase.from(TABLES.SHIFT_NOTES).delete().in('id', pending.shiftNotes.toDelete);
      if (error) errors.push(`Shift Notes Delete: ${error.message}`);
    }

    if (errors.length > 0) {
      throw new Error(`Sync failed with errors: ${errors.join('; ')}`);
    }

    return true;
  }
};
