import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STAFF_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { format, subDays } from 'date-fns';

export interface StaffComplianceSummaryRow {
  compliance_type_id: string;
  compliance_name: string;
  compliance_desc: string | null;
  is_default_global: boolean;
  record_id: string | null;
  record_status: string | null;
  expiry_date: string | null;
  completion_date: string | null;
}

/**
 * Data Access Layer (DAL) for Staff Child Entities.
 * 
 * Handles all sub-records linked to a staff member such as Compliance, 
 * Training, and Documents.
 */
export const staffDetailsApi = {
  /**
   * Compliance
   */
  compliance: {
    async getSummary(staffId: string): Promise<StaffComplianceSummaryRow[]> {
      const today = new Date().toISOString().split('T')[0];

      const [assignmentsResult, actualRecordsResult, globalDefaultsResult] = await Promise.all([
        supabase
          .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
          .select('house_id')
          .eq('staff_id', staffId)
          .or(`end_date.is.null,end_date.gte.${today}`),
        
        supabase
          .from(TABLES.STAFF_COMPLIANCE)
          .select('id, compliance_type_id, compliance_name, status, expiry_date, completion_date')
          .eq('staff_id', staffId),
          
        supabase
          .from(TABLES.COMPLIANCE_TYPES_MASTER)
          .select('id, compliance_name, description, is_default_global')
          .eq('is_default_global', true)
          .eq('is_active', true)
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;
      if (actualRecordsResult.error) throw actualRecordsResult.error;
      if (globalDefaultsResult.error) throw globalDefaultsResult.error;

      const houseIds = (assignmentsResult.data || []).map(a => a.house_id);
      const requiredTypes = [...(globalDefaultsResult.data || [])];

      if (houseIds.length > 0) {
        const { data: houseReqs, error: houseReqsError } = await supabase
          .from(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS)
          .select(`
            compliance_type_id,
            compliance_type:${TABLES.COMPLIANCE_TYPES_MASTER}!compliance_type_id(id, compliance_name, description, is_default_global)
          `)
          .in('house_id', houseIds);

        if (houseReqsError) throw houseReqsError;

        const seenIds = new Set(requiredTypes.map(t => t.id));
        for (const req of houseReqs || []) {
          const type = req.compliance_type as any;
          if (type && type.is_active && !seenIds.has(type.id)) {
            seenIds.add(type.id);
            requiredTypes.push(type);
          }
        }
      }

      // Left join in memory
      const actualRecords = actualRecordsResult.data || [];
      return requiredTypes.map(type => {
        // Find matching record: prefer matching by compliance_type_id; fallback to compliance_name for legacy rows
        const record = actualRecords.find(r => 
          r.compliance_type_id
            ? r.compliance_type_id === type.id
            : r.compliance_name === type.compliance_name
        );

        return {
          compliance_type_id: type.id,
          compliance_name: type.compliance_name,
          compliance_desc: type.description || null,
          is_default_global: type.is_default_global || false,
          record_id: record?.id || null,
          record_status: record?.status || null,
          expiry_date: record?.expiry_date || null,
          completion_date: record?.completion_date || null,
        };
      }).sort((a, b) => a.compliance_name.localeCompare(b.compliance_name));
    },

    async list(staffId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .select(STAFF_VIEWS.COMPLIANCE)
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async listRequired(staffId: string) {
      const today = new Date().toISOString().split('T')[0];
      const { data: assignments, error: assignmentsError } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .select('house_id')
        .eq('staff_id', staffId)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (assignmentsError) throw assignmentsError;

      const houseIds = (assignments || []).map(a => a.house_id);

      if (houseIds.length === 0) {
        // Fall back to active global defaults
        const { data: defaults, error: defaultsError } = await supabase
          .from(TABLES.COMPLIANCE_TYPES_MASTER)
          .select('id, compliance_name, description, is_active, is_default_global')
          .eq('is_default_global', true)
          .eq('is_active', true);
        
        if (defaultsError) throw defaultsError;
        return defaults || [];
      }

      const { data, error } = await supabase
        .from(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS)
        .select(`
          compliance_type_id,
          compliance_type:${TABLES.COMPLIANCE_TYPES_MASTER}!compliance_type_id(id, compliance_name, description, is_active, is_default_global)
        `)
        .in('house_id', houseIds);

      if (error) throw error;

      // Extract compliance types
      const requirements = (data || [])
        .map((r: any) => r.compliance_type)
        .filter((r: any) => r && r.is_active);

      // Unique by id
      const seen = new Set();
      const unique = [];
      for (const r of requirements) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          unique.push(r);
        }
      }
      return unique;
    },

    async upsert(records: Database['public']['Tables']['ic_staff_compliance']['Insert'] | Database['public']['Tables']['ic_staff_compliance']['Insert'][]) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .upsert(payload)
        .select(STAFF_VIEWS.COMPLIANCE);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  /**
   * Training
   */
  training: {
    async list(staffId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_TRAINING)
        .select(STAFF_VIEWS.TRAINING)
        .eq('staff_id', staffId)
        .order('date_completed', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(records: Database['public']['Tables']['ic_staff_training']['Insert'] | Database['public']['Tables']['ic_staff_training']['Insert'][]) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.STAFF_TRAINING)
        .upsert(payload)
        .select(STAFF_VIEWS.TRAINING);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.STAFF_TRAINING)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async uploadDocument(staffId: string, file: File) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/training/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
      return { fileName: file.name, filePath };
    }
  },

  /**
   * Documents
   */
  documents: {
    async list(staffId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .select(STAFF_VIEWS.DOCUMENTS)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async downloadFile(filePath: string) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .download(filePath);

      if (error) throw error;
      return data;
    },

    async getAttachmentSignedUrl(filePath: string, downloadName?: string | boolean) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .createSignedUrl(filePath, 3600, {
          download: downloadName || false
        });

      if (error) throw error;
      return data.signedUrl;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string, filePath: string) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .remove([filePath]);

      if (storageError) throw new Error(`Failed to delete from storage: ${storageError.message}`);

      const { error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async bulkDelete(ids: string[], filePaths: string[]) {
      if (filePaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove(filePaths);
      }
      if (ids.length > 0) {
        const { error } = await supabase.from(TABLES.STAFF_DOCUMENTS).delete().in('id', ids);
        if (error) throw error;
      }
      return true;
    },

    async upload(staffId: string, file: File, uploadedBy?: string) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { data, error } = await supabase.from(TABLES.STAFF_DOCUMENTS).insert({
        staff_id: staffId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        uploaded_by: uploadedBy || null
      }).select().maybeSingle();

      if (error) throw new Error(`Database insert failed: ${error.message}`);
      return data;
    }
  },

  /**
   * Bulk synchronizes all pending changes for a staff member.
   */
  async syncDetails(staffId: string, pending: StaffPendingChanges) {
    const errors: string[] = [];

    const normalizeDate = (val: any) => (val === '' || val === undefined) ? null : val;

    // 1. Process Compliance
    if (pending?.staffCompliance?.toAdd?.length > 0) {
      const { error } = await supabase.from(TABLES.STAFF_COMPLIANCE).insert(
        pending.staffCompliance.toAdd.map(c => ({
          staff_id: staffId,
          compliance_type_id: c.compliance_type_id ?? null,
          compliance_name: c.compliance_name,
          status: c.status,
          expiry_date: normalizeDate(c.expiry_date)
        }))
      );
      if (error) errors.push(`Compliance Add: ${error.message}`);
    }
    if (pending?.staffCompliance?.toUpdate?.length > 0) {
      for (const c of pending.staffCompliance.toUpdate) {
        const { error } = await supabase.from(TABLES.STAFF_COMPLIANCE).update({
          compliance_type_id: c.compliance_type_id ?? null,
          compliance_name: c.compliance_name,
          status: c.status,
          expiry_date: normalizeDate(c.expiry_date)
        }).eq('id', c.id);
        if (error) errors.push(`Compliance Update ${c.id}: ${error.message}`);
      }
    }
    if (pending?.staffCompliance?.toDelete?.length > 0) {
      const { error } = await supabase.from(TABLES.STAFF_COMPLIANCE).delete().in('id', pending.staffCompliance.toDelete);
      if (error) errors.push(`Compliance Delete: ${error.message}`);
    }

    // 2. Process Training
    if (pending?.training?.toAdd?.length > 0) {
      for (const t of pending.training.toAdd) {
        let fileName = t.fileName || null;
        let filePath = t.filePath || null;

        if (t.file) {
          try {
            const upload = await this.training.uploadDocument(staffId, t.file);
            fileName = upload.fileName;
            filePath = upload.filePath;
          } catch (e: any) {
            errors.push(`Training File Upload (${t.title}): ${e.message}`);
            continue;
          }
        }

        const { error } = await supabase.from(TABLES.STAFF_TRAINING).insert({ 
          staff_id: staffId, 
          title: t.title,
          category: t.category,
          provider: t.provider,
          date_completed: normalizeDate(t.date_completed),
          expiry_date: normalizeDate(t.expiry_date),
          description: t.description,
          file_name: fileName,
          file_path: filePath
        });
        if (error) errors.push(`Training Add: ${error.message}`);
      }
    }

    if (pending?.training?.toUpdate?.length > 0) {
      for (const t of pending.training.toUpdate) {
        let fileName = t.fileName || t.file_name || null;
        let filePath = t.filePath || t.file_path || null;

        if (t.file) {
          try {
            // Delete old file if exists
            if (t.filePath || t.file_path) {
              await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove([t.filePath || t.file_path]);
            }
            const upload = await this.training.uploadDocument(staffId, t.file);
            fileName = upload.fileName;
            filePath = upload.filePath;
          } catch (e: any) {
            errors.push(`Training File Update (${t.title}): ${e.message}`);
          }
        } else if (t.file === null) {
          // Explicit removal
          if (t.filePath || t.file_path) {
            await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove([t.filePath || t.file_path]);
          }
          fileName = null;
          filePath = null;
        }

        const { error } = await supabase.from(TABLES.STAFF_TRAINING).update({
          title: t.title,
          category: t.category,
          provider: t.provider,
          date_completed: normalizeDate(t.date_completed),
          expiry_date: normalizeDate(t.expiry_date),
          description: t.description,
          file_name: fileName,
          file_path: filePath
        }).eq('id', t.id);
        if (error) errors.push(`Training Update ${t.id}: ${error.message}`);
      }
    }

    if (pending?.training?.toDelete?.length > 0) {
      for (const d of pending.training.toDelete) {
        if (d.filePath) {
          await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove([d.filePath]);
        }
        const { error } = await supabase.from(TABLES.STAFF_TRAINING).delete().eq('id', d.id);
        if (error) errors.push(`Training Delete ${d.id}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Sync failed with errors: ${errors.join('; ')}`);
    }

    return true;
  }
};
