import { Database } from '@/models/database.types';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { format, subDays } from 'date-fns';
import { TABLES } from '@/config/db-tables';
import { STAFF_VIEWS } from '@/config/query-views';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { supabase } from '@/lib/supabase';

type ComplianceMasterRow =
  Database['public']['Tables']['ic_compliance_types_master']['Row'];

export interface StaffComplianceSummaryRow {
  compliance_type_id: string;
  compliance_name: string;
  compliance_desc: string | null;
  system_category: string | null;
  attachment_applicable: boolean;
  expiry_date_applicable: boolean;
  document_number_applicable: boolean;
  comments_applicable: boolean;
  record_id: string | null;
  record_status: string | null;
  expiry_date: string | null;
  completion_date: string | null;
  document_number: string | null;
  comments: string | null;
  verified_documents: any[] | null;
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
      const [actualRecordsResult, masterTypesResult] = await Promise.all([
        supabase
          .from(TABLES.STAFF_COMPLIANCE)
          .select(
            `
            id, compliance_type_id, status, expiry_date, completion_date, document_number, comments, updated_at, updated_by,
            verified_documents:${TABLES.STAFF_COMPLIANCE_DOCUMENTS}!staff_compliance_id(
              id, document_type, document_number, expiry_date, file_name, file_path, points, comments
            )
          `,
          )
          .eq('staff_id', staffId),

        supabase
          .from(TABLES.COMPLIANCE_TYPES_MASTER)
          .select(
            'id, compliance_name, description, system_category, attachment_applicable, expiry_date_applicable, document_number_applicable, comments_applicable',
          )
          .eq('is_active', true),
      ]);

      if (actualRecordsResult.error) throw actualRecordsResult.error;
      if (masterTypesResult.error) throw masterTypesResult.error;

      const requiredTypes = (masterTypesResult.data ||
        []) as ComplianceMasterRow[];
      const actualRecords = actualRecordsResult.data || [];

      const updaterIds = Array.from(
        new Set(actualRecords.map((r: any) => r.updated_by).filter(Boolean)),
      ) as string[];

      const updaterMap = new Map<string, string>();
      if (updaterIds.length > 0) {
        const { data: updaters } = await supabase
          .from(TABLES.STAFF)
          .select('id, staff_name')
          .in('id', updaterIds);

        if (updaters) {
          updaters.forEach((u) => {
            if (u.staff_name) updaterMap.set(u.id, u.staff_name);
          });
        }
      }

      return requiredTypes
        .map((type) => {
          // Find matching record: strictly match by compliance_type_id
          const record = actualRecords.find(
            (r) => r.compliance_type_id === type.id,
          );

          let status = record?.status || null;
          if (status === 'complete' && record?.expiry_date) {
            const expiry = new Date(record.expiry_date);
            const days = Math.ceil(
              (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            );
            if (days < 0) status = 'Expired';
            else if (days <= 30) status = 'Expiring Soon';
          }

          return {
            compliance_type_id: type.id,
            compliance_name: type.compliance_name,
            compliance_desc: type.description || null,
            system_category: type.system_category || null,
            attachment_applicable: type.attachment_applicable || false,
            expiry_date_applicable: type.expiry_date_applicable ?? true,
            document_number_applicable:
              type.document_number_applicable || false,
            comments_applicable: type.comments_applicable || false,
            record_id: record?.id || null,
            record_status: status,
            expiry_date: record?.expiry_date || null,
            completion_date: record?.completion_date || null,
            document_number: record?.document_number || null,
            comments: record?.comments || null,
            verified_documents:
              (record?.verified_documents || null)?.map((d: any) => ({
                ...d,
                document_type:
                  d.document_type === null ? 'attachment' : d.document_type,
              })) || null,
            updated_at: record?.updated_at || null,
            updated_by_name: record?.updated_by
              ? updaterMap.get(record.updated_by) || null
              : null,
          };
        })
        .sort((a, b) => a.compliance_name.localeCompare(b.compliance_name));
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
      const { data: defaults, error: defaultsError } = await supabase
        .from(TABLES.COMPLIANCE_TYPES_MASTER)
        .select(
          'id, compliance_name, description, is_active, system_category, attachment_applicable, expiry_date_applicable, document_number_applicable, comments_applicable',
        )
        .eq('is_active', true);

      if (defaultsError) throw defaultsError;
      return defaults || [];
    },

    async upsert(
      records:
        | Database['public']['Tables']['ic_staff_compliance']['Insert']
        | Database['public']['Tables']['ic_staff_compliance']['Insert'][],
    ) {
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
    },

    async deleteAttachmentFile(filePaths: string[]) {
      if (!filePaths || filePaths.length === 0) return true;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .remove(filePaths);

      if (error) throw error;
      return true;
    },
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

    async upsert(
      records:
        | Database['public']['Tables']['ic_staff_training']['Insert']
        | Database['public']['Tables']['ic_staff_training']['Insert'][],
    ) {
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

      if (uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      return { fileName: file.name, filePath };
    },
  },

  /**
   * Qualifications
   */
  qualifications: {
    async list(staffId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_QUALIFICATIONS)
        .select(STAFF_VIEWS.QUALIFICATIONS)
        .eq('staff_id', staffId)
        .order('date_completed', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async upsert(
      records:
        | Database['public']['Tables']['ic_staff_qualifications']['Insert']
        | Database['public']['Tables']['ic_staff_qualifications']['Insert'][],
    ) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.STAFF_QUALIFICATIONS)
        .upsert(payload)
        .select(STAFF_VIEWS.QUALIFICATIONS);

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.STAFF_QUALIFICATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async uploadDocument(staffId: string, file: File) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/qualifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      return { fileName: file.name, filePath };
    },
  },

  /**
   * Onboarding
   */
  onboarding: {
    async getSummary(staffId: string) {
      const [actualRecordsResult, masterItemsResult] = await Promise.all([
        supabase
          .from(TABLES.STAFF_ONBOARDING)
          .select('*')
          .eq('staff_id', staffId),
        supabase
          .from(TABLES.ONBOARDING_ITEMS_MASTER)
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (actualRecordsResult.error) throw actualRecordsResult.error;
      if (masterItemsResult.error) throw masterItemsResult.error;

      const masterItems = masterItemsResult.data || [];
      const actualRecords = actualRecordsResult.error ? [] : actualRecordsResult.data || [];

      // Contextual Filtering:
      // Include all active master items + any inactive master items that already have a staff record
      return masterItems
        .filter(m => m.is_active || actualRecords.some(r => r.onboarding_item_id === m.id))
        .map(item => {
          const record = actualRecords.find(r => r.onboarding_item_id === item.id);
          return {
            item_id: item.id,
            item_name: item.item_name,
            description: item.description,
            record_id: record?.id || null,
            is_complete: record?.is_complete || false,
            comments: record?.comments || '',
            updated_at: record?.updated_at || null,
          };
        });
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

    async getAttachmentSignedUrl(
      filePath: string,
      downloadName?: string | boolean,
    ) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .createSignedUrl(filePath, 3600, {
          download: downloadName || false,
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

      if (storageError)
        throw new Error(
          `Failed to delete from storage: ${storageError.message}`,
        );

      const { error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async bulkDelete(ids: string[], filePaths: string[]) {
      if (filePaths.length > 0) {
        await supabase.storage
          .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
          .remove(filePaths);
      }
      if (ids.length > 0) {
        const { error } = await supabase
          .from(TABLES.STAFF_DOCUMENTS)
          .delete()
          .in('id', ids);
        if (error) throw error;
      }
      return true;
    },

    async upload(staffId: string, file: File, uploadedBy?: string) {
      // Security Validation: Validate MIME type and File Size
      const ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB

      if (!ALLOWED_MIMES.includes(file.type)) {
        throw new Error(
          `Security Violation: File type '${file.type}' is not permitted.`,
        );
      }

      if (file.size > MAX_SIZE) {
        throw new Error(
          'Security Violation: File size exceeds the 10MB limit.',
        );
      }

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .insert({
          staff_id: staffId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: uploadedBy || null,
        })
        .select()
        .maybeSingle();

      if (error) throw new Error(`Database insert failed: ${error.message}`);
      return data;
    },
  },

  houses: {
    async listAssignments(staffId: string) {
      if (!staffId || staffId === 'undefined' || staffId === 'null') return [];
      const { data, error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .select(`
          id,
          house_id,
          staff_id,
          is_primary,
          start_date,
          end_date,
          notes,
          created_at,
          updated_at,
          house:${TABLES.HOUSES}(id, house_name, status)
        `)
        .eq('staff_id', staffId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return (data || []).map((assignment: any) => {
        if (assignment.house) {
          return {
            ...assignment,
            house: Array.isArray(assignment.house)
              ? assignment.house[0]
              : assignment.house,
          };
        }
        return assignment;
      });
    },
  },

  /**
   * Bulk synchronizes all pending changes for a staff member.
   */
  async syncDetails(staffId: string, pending: StaffPendingChanges) {
    const errors: string[] = [];

    const normalizeDate = (val: any) =>
      val === '' || val === undefined ? null : val;

    // Helper to map UI display statuses back to DB enum values
    const mapStatusForDb = (
      status?: string,
    ): 'complete' | 'in_progress' | 'not_applicable' => {
      if (!status) return 'in_progress';
      const s = status.toLowerCase();
      if (
        s === 'complete' ||
        s === 'compliant' ||
        s === 'expired' ||
        s === 'expiring soon'
      )
        return 'complete';
      if (s === 'not_applicable' || s === 'n/a') return 'not_applicable';
      return 'in_progress';
    };

    // 1. Process Compliance
    const complianceToAdd = pending?.staffCompliance?.toAdd || [];
    for (const c of complianceToAdd) {
      // Defensive: compliance_type_id is now the mandatory FK (NOT NULL)
      if (!c.compliance_type_id) {
        errors.push(
          `Compliance Add: Missing requirement ID for item`,
        );
        continue;
      }

      const { data, error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .upsert(
          {
            staff_id: staffId,
            compliance_type_id: c.compliance_type_id,
            status: mapStatusForDb(c.status),
            expiry_date: normalizeDate(c.expiry_date),
            document_number: c.document_number || null,
            comments: c.comments || null,
          },
          { onConflict: 'staff_id,compliance_type_id' },
        )
        .select('id');

      const recordId = data?.[0]?.id;

      if (error) {
        errors.push(`Compliance Add: ${error.message}`);
        continue;
      }

      // Insert verified documents if any
      if (recordId && c.verifiedDocuments && c.verifiedDocuments.length > 0) {
        // Robustness: Clear existing docs just in case this was an upsert conflict
        await supabase
          .from(TABLES.STAFF_COMPLIANCE_DOCUMENTS)
          .delete()
          .eq('staff_compliance_id', recordId);

        const docsPayload = c.verifiedDocuments.map((doc) => ({
          staff_compliance_id: recordId,
          document_type:
            doc.document_type === 'attachment' ? null : doc.document_type,
          document_number: doc.document_number || null,
          expiry_date: normalizeDate(doc.expiry_date),
          file_name: doc.file_name ?? null,
          file_path: doc.file_path ?? null,
          points: doc.points,
          comments: doc.comments ?? null,
        }));
        const { error: docsError } = await supabase
          .from(TABLES.STAFF_COMPLIANCE_DOCUMENTS)
          .insert(docsPayload);
        if (docsError)
          errors.push(
            `Compliance Docs Add for ${recordId}: ${docsError.message}`,
          );
      }
    }

    const complianceToUpdate = pending?.staffCompliance?.toUpdate || [];
    for (const c of complianceToUpdate) {
      if (!c.id) continue;

      const { error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .update({
          compliance_type_id: c.compliance_type_id ?? null,
          status: mapStatusForDb(c.status),
          expiry_date: normalizeDate(c.expiry_date),
          document_number: c.document_number ?? null,
          comments: c.comments ?? null,
        })
        .eq('id', c.id);

      if (error) {
        errors.push(`Compliance Update ${c.id}: ${error.message}`);
        continue;
      }

      // Clear existing compliance docs and insert current list
      const { error: deleteDocsError } = await supabase
        .from(TABLES.STAFF_COMPLIANCE_DOCUMENTS)
        .delete()
        .eq('staff_compliance_id', c.id);

      if (deleteDocsError) {
        errors.push(
          `Compliance Docs Clear for ${c.id}: ${deleteDocsError.message}`,
        );
        continue;
      }

      if (c.verifiedDocuments && c.verifiedDocuments.length > 0) {
        const docsPayload = c.verifiedDocuments.map((doc) => ({
          staff_compliance_id: c.id!,
          document_type:
            doc.document_type === 'attachment' ? null : doc.document_type,
          document_number: doc.document_number || null,
          expiry_date: normalizeDate(doc.expiry_date),
          file_name: doc.file_name ?? null,
          file_path: doc.file_path ?? null,
          points: doc.points,
          comments: doc.comments ?? null,
        }));
        const { error: docsError } = await supabase
          .from(TABLES.STAFF_COMPLIANCE_DOCUMENTS)
          .insert(docsPayload);
        if (docsError)
          errors.push(
            `Compliance Docs Insert for ${c.id}: ${docsError.message}`,
          );
      }
    }
    if (pending?.staffCompliance?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .delete()
        .in('id', pending.staffCompliance.toDelete);
      if (error) errors.push(`Compliance Delete: ${error.message}`);
    }

    // 2. Process Onboarding
    const onboardingToUpsert = pending?.onboarding?.toUpsert || [];
    if (onboardingToUpsert.length > 0) {
      const payload = onboardingToUpsert.map((item) => ({
        staff_id: staffId,
        onboarding_item_id: item.onboarding_item_id,
        is_complete: item.is_complete,
        comments: item.comments || null,
      }));

      const { error } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .upsert(payload, { onConflict: 'staff_id,onboarding_item_id' });

      if (error) errors.push(`Onboarding Upsert: ${error.message}`);
    }

    if (pending?.onboarding?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .delete()
        .in('id', pending.onboarding.toDelete);
      if (error) errors.push(`Onboarding Delete: ${error.message}`);
    }

    // 3. Process Training
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
          file_path: filePath,
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
              await supabase.storage
                .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
                .remove([t.filePath || t.file_path]);
            }
            const upload = await this.training.uploadDocument(staffId, t.file);
            fileName = upload.fileName;
            filePath = upload.filePath;
          } catch (e: any) {
            errors.push(`Training File Update (${t.title}): ${e.message}`);
          }
        } else if (t.file === null) {
          // Explicit removal
          const pathToDelete = t.oldFilePath || t.filePath || (t as any).file_path;
          if (pathToDelete) {
            await supabase.storage
              .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
              .remove([pathToDelete]);
          }
          fileName = null;
          filePath = null;
        }

        const { error } = await supabase
          .from(TABLES.STAFF_TRAINING)
          .update({
            title: t.title,
            category: t.category,
            provider: t.provider,
            date_completed: normalizeDate(t.date_completed),
            expiry_date: normalizeDate(t.expiry_date),
            description: t.description,
            file_name: fileName,
            file_path: filePath,
          })
          .eq('id', t.id);
        if (error) errors.push(`Training Update ${t.id}: ${error.message}`);
      }
    }

    if (pending?.training?.toDelete?.length > 0) {
      for (const d of pending.training.toDelete) {
        if (d.filePath) {
          await supabase.storage
            .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
            .remove([d.filePath]);
        }
        const { error } = await supabase
          .from(TABLES.STAFF_TRAINING)
          .delete()
          .eq('id', d.id);
        if (error) errors.push(`Training Delete ${d.id}: ${error.message}`);
      }
    }

    // 4. Process Qualifications
    if (pending?.qualifications?.toAdd?.length > 0) {
      for (const q of pending.qualifications.toAdd) {
        let fileName = q.fileName || null;
        let filePath = q.filePath || null;

        if (q.file) {
          try {
            const upload = await this.qualifications.uploadDocument(
              staffId,
              q.file,
            );
            fileName = upload.fileName;
            filePath = upload.filePath;
          } catch (e: any) {
            errors.push(`Qualification File Upload (${q.title}): ${e.message}`);
            continue;
          }
        }

        const { error } = await supabase
          .from(TABLES.STAFF_QUALIFICATIONS)
          .insert({
            staff_id: staffId,
            title: q.title,
            institution: q.institution,
            date_completed: normalizeDate(q.date_completed),
            expiry_date: normalizeDate(q.expiry_date),
            file_name: fileName,
            file_path: filePath,
          });
        if (error) errors.push(`Qualification Add: ${error.message}`);
      }
    }

    if (pending?.qualifications?.toUpdate?.length > 0) {
      for (const q of pending.qualifications.toUpdate) {
        let fileName = q.fileName || (q as any).file_name || null;
        let filePath = q.filePath || (q as any).file_path || null;

        if (q.file) {
          try {
            if (q.filePath || (q as any).file_path) {
              await supabase.storage
                .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
                .remove([q.filePath || (q as any).file_path]);
            }
            const upload = await this.qualifications.uploadDocument(
              staffId,
              q.file,
            );
            fileName = upload.fileName;
            filePath = upload.filePath;
          } catch (e: any) {
            errors.push(`Qualification File Update (${q.title}): ${e.message}`);
          }
        } else if (q.file === null) {
          const pathToDelete = q.oldFilePath || q.filePath || (q as any).file_path;
          if (pathToDelete) {
            await supabase.storage
              .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
              .remove([pathToDelete]);
          }
          fileName = null;
          filePath = null;
        }

        const { error } = await supabase
          .from(TABLES.STAFF_QUALIFICATIONS)
          .update({
            title: q.title,
            institution: q.institution,
            date_completed: normalizeDate(q.date_completed),
            expiry_date: normalizeDate(q.expiry_date),
            file_name: fileName,
            file_path: filePath,
          })
          .eq('id', q.id);
        if (error)
          errors.push(`Qualification Update ${q.id}: ${error.message}`);
      }
    }

    if (pending?.qualifications?.toDelete?.length > 0) {
      for (const d of pending.qualifications.toDelete) {
        if (d.filePath) {
          await supabase.storage
            .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
            .remove([d.filePath]);
        }
        const { error } = await supabase
          .from(TABLES.STAFF_QUALIFICATIONS)
          .delete()
          .eq('id', d.id);
        if (error)
          errors.push(`Qualification Delete ${d.id}: ${error.message}`);
      }
    }

    // 5. Process House Assignments
    if (pending?.houseAssignments?.toAdd?.length > 0) {
      const inserts = pending.houseAssignments.toAdd.map((a) => {
        const { tempId, house_name, ...rest } = a as any;
        return {
          ...rest,
          staff_id: staffId,
          start_date: normalizeDate(rest.start_date),
          end_date: normalizeDate(rest.end_date),
        };
      });
      const { error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .insert(inserts);
      if (error) errors.push(`House Assignments Add: ${error.message}`);
    }

    if (pending?.houseAssignments?.toUpdate?.length > 0) {
      for (const a of pending.houseAssignments.toUpdate) {
        const { error } = await supabase
          .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
          .update({
            is_primary: a.is_primary,
            start_date: normalizeDate(a.start_date),
            end_date: normalizeDate(a.end_date),
            notes: a.notes,
          })
          .eq('id', a.id);
        if (error) errors.push(`House Assignments Update ${a.id}: ${error.message}`);
      }
    }

    if (pending?.houseAssignments?.toDelete?.length > 0) {
      const { error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .delete()
        .in('id', pending.houseAssignments.toDelete);
      if (error) errors.push(`House Assignments Delete: ${error.message}`);
    }

    if (errors.length > 0) {
      throw new Error(`Sync failed with errors: ${errors.join('; ')}`);
    }

    return true;
  },
};
