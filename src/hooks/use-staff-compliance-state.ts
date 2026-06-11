import { useMemo } from 'react';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { ResolvedComplianceItem, ComplianceStatus, VerifiedDocument } from '@/models/compliance.types';
import { differenceInDays, parseISO } from 'date-fns';
import { staffDetailsApi } from '@/api/staff-details.api';
import { toast } from 'sonner';

function calculateComplianceStatus(expiryDate?: string | null): ComplianceStatus {
  if (!expiryDate) return 'complete';

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);

  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiring Soon';
  return 'complete';
}

interface UseStaffComplianceStateProps {
  summary: any[];
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  userName?: string;
}

export function useStaffComplianceState({
  summary,
  pendingChanges,
  onPendingChangesChange,
  userName = 'System'
}: UseStaffComplianceStateProps) {

  const resolvedItems = useMemo<ResolvedComplianceItem[]>(() => {
    // Optimization: Create Maps for O(1) lookups during the loop
    const toAddMap = new Map(pendingChanges?.staffCompliance?.toAdd.map(c => [c.compliance_type_id, c]));
    const toUpdateMap = new Map(pendingChanges?.staffCompliance?.toUpdate.map(c => [c.compliance_type_id, c]));
    const toDeleteSet = new Set(pendingChanges?.staffCompliance?.toDelete || []);

    return summary.map((row) => {
      const reqId = row.compliance_type_id;

      const pendingAdd = toAddMap.get(reqId);
      const pendingUpdate = toUpdateMap.get(reqId);
      const isPendingDelete = row.record_id ? toDeleteSet.has(row.record_id) : false;

      let isCompleted = !!row.record_id;
      let expiryDate = row.expiry_date || '';
      let docNumber = row.document_number || '';
      let comments = row.comments || '';
      let status: string | null = row.record_status || null;
      let isTemp = false;
      let verifiedDocuments: VerifiedDocument[] | null = row.verified_documents || null;
      let updatedAt = row.updated_at || null;
      let updatedAtBy = row.updated_by_name || null;

      if (pendingAdd) {
        isCompleted = true;
        expiryDate = pendingAdd.expiry_date || '';
        docNumber = pendingAdd.document_number || '';
        comments = pendingAdd.comments || '';
        status = pendingAdd.status || 'complete';
        isTemp = true;
        verifiedDocuments = (pendingAdd.verifiedDocuments as VerifiedDocument[]) || null;
        updatedAt = new Date().toISOString(); // Mock updatedAt for drafts
        updatedAtBy = userName;
      } else if (pendingUpdate) {
        isCompleted = true;
        expiryDate = pendingUpdate.expiry_date || '';
        docNumber = pendingUpdate.document_number || '';
        comments = pendingUpdate.comments || '';
        status = pendingUpdate.status || 'complete';
        verifiedDocuments = (pendingUpdate.verifiedDocuments as VerifiedDocument[]) || null;
        updatedAt = new Date().toISOString();
        updatedAtBy = userName;
      }

      // Reconciliation logic for display status
      let displayStatus: ComplianceStatus | null = null;
      if (isCompleted) {
        const dbStatus = status;
        if (dbStatus === 'not_applicable') {
          displayStatus = 'not_applicable';
        } else if (dbStatus === 'in_progress') {
          displayStatus = 'in_progress';
        } else if (dbStatus === 'complete') {
          displayStatus = calculateComplianceStatus(expiryDate);
        } else {
          displayStatus = 'in_progress';
        }
      }

      return {
        requirementId: reqId,
        recordId: row.record_id,
        complianceName: row.compliance_name,
        description: row.compliance_desc,
        attachmentApplicable: row.attachment_applicable,
        expiryDateApplicable: row.expiry_date_applicable,
        documentNumberApplicable: row.document_number_applicable,
        commentsApplicable: row.comments_applicable,
        systemCategory: row.system_category || null,
        isCompleted,
        expiryDate,
        docNumber,
        comments,
        status: displayStatus,
        updatedAt,
        updatedAtBy,
        isTemp,
        isPendingDelete,
        isPendingUpdate: !!pendingUpdate,
        verifiedDocuments
      };
    });
  }, [summary, pendingChanges?.staffCompliance?.toAdd, pendingChanges?.staffCompliance?.toUpdate, pendingChanges?.staffCompliance?.toDelete, userName]);

  // Actions

  const updateStatus = async (reqId: string, recordId: string | null, complianceName: string, newStatus: 'complete' | 'in_progress' | 'not_applicable') => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find((c) => c.compliance_type_id === reqId);

    // Helper to clear sensitive data when moving away from complete
    const clearSensitiveFields = (obj: any) => ({
      ...obj,
      expiry_date: null,
      document_number: '',
      comments: '',
      verifiedDocuments: null
    });

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId ? { ...c, status: newStatus } : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find((c) => c.id === recordId);
      
      let toUpdate = [];
      if (existingUpdate) {
        toUpdate = pendingChanges.staffCompliance.toUpdate.map((c) =>
          c.id === recordId ? { ...c, status: newStatus } : c
        );
      } else {
        const summaryItem = summary.find(r => r.compliance_type_id === reqId);
        toUpdate = [
          ...pendingChanges.staffCompliance.toUpdate,
          {
            id: recordId,
            compliance_type_id: reqId,
            compliance_name: complianceName,
            status: newStatus,
            expiry_date: summaryItem?.expiry_date || null,
            document_number: summaryItem?.document_number || null,
            comments: summaryItem?.comments || null,
            verifiedDocuments: summaryItem?.verified_documents || null
          }
        ];
      }

      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toUpdate
        }
      });
    } else {
      // Create new draft requirement
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: [
            ...pendingChanges.staffCompliance.toAdd,
            {
              compliance_type_id: reqId,
              compliance_name: complianceName,
              status: newStatus,
              expiry_date: null,
              document_number: '',
              comments: '',
              verifiedDocuments: null
            }
          ]
        }
      });
    }
  };

  const updateField = (reqId: string, recordId: string | null, complianceName: string, field: 'document_number' | 'expiry_date' | 'comments', value: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find((c) => c.compliance_type_id === reqId);

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId ? { ...c, [field]: value || null } : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find((c) => c.id === recordId);
      let toUpdate = [];

      if (existingUpdate) {
        toUpdate = pendingChanges.staffCompliance.toUpdate.map((c) =>
          c.id === recordId ? { ...c, [field]: value || null } : c
        );
      } else {
        const summaryItem = summary.find(r => r.compliance_type_id === reqId);
        toUpdate = [
          ...pendingChanges.staffCompliance.toUpdate,
          {
            id: recordId,
            compliance_type_id: reqId,
            compliance_name: complianceName,
            status: summaryItem?.record_status || 'complete',
            expiry_date: field === 'expiry_date' ? (value || null) : (summaryItem?.expiry_date || null),
            document_number: field === 'document_number' ? (value || null) : (summaryItem?.document_number || null),
            comments: field === 'comments' ? (value || null) : (summaryItem?.comments || null),
            verifiedDocuments: summaryItem?.verified_documents || null
          }
        ];
      }

      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toUpdate
        }
      });
    }
  };

  const addAttachment = (reqId: string, recordId: string | null, fileData: { file_name: string; file_path: string }) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find((c) => c.compliance_type_id === reqId);
    
    const appendDoc = (docs: VerifiedDocument[] | null | undefined): VerifiedDocument[] => {
      const current = docs || [];
      return [...current, { 
        document_type: 'attachment',
        document_number: null,
        expiry_date: null,
        points: 0,
        file_name: fileData.file_name, 
        file_path: fileData.file_path,
        comments: null
      }];
    };

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId ? { ...c, verifiedDocuments: appendDoc(c.verifiedDocuments as VerifiedDocument[]) } : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find((c) => c.id === recordId);
      let toUpdate = [];

      if (existingUpdate) {
        toUpdate = pendingChanges.staffCompliance.toUpdate.map((c) =>
          c.id === recordId ? { ...c, verifiedDocuments: appendDoc(c.verifiedDocuments as VerifiedDocument[]) } : c
        );
      } else {
        const summaryItem = summary.find(r => r.compliance_type_id === reqId);
        toUpdate = [
          ...pendingChanges.staffCompliance.toUpdate,
          {
            id: recordId,
            compliance_type_id: reqId,
            compliance_name: summaryItem?.compliance_name || '',
            status: summaryItem?.record_status || 'complete',
            expiry_date: summaryItem?.expiry_date || null,
            document_number: summaryItem?.document_number || null,
            comments: summaryItem?.comments || null,
            verifiedDocuments: appendDoc(summaryItem?.verified_documents)
          }
        ];
      }

      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toUpdate
        }
      });
    }
  };

  const removeAttachment = async (reqId: string, recordId: string | null, filePath: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // Security Fix: Immediately delete from storage to prevent orphans
    try {
      await staffDetailsApi.compliance.deleteAttachmentFile([filePath]);
      toast.success('Attachment removed securely.');
    } catch (err) {
      console.error('Failed to remove attachment from storage', err);
      toast.error('Failed to remove attachment from server.');
      return; // Do not update state if deletion failed
    }

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find((c) => c.compliance_type_id === reqId);

    const filterDocs = (docs: VerifiedDocument[] | null | undefined): VerifiedDocument[] | null => {
      if (!docs || docs.length === 0) return null;
      const filtered = docs.filter(d => d.file_path !== filePath);
      return filtered.length > 0 ? filtered : null;
    };

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId ? { ...c, verifiedDocuments: filterDocs(c.verifiedDocuments as VerifiedDocument[]) } : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find((c) => c.id === recordId);
      if (existingUpdate) {
        onPendingChangesChange({
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toUpdate: pendingChanges.staffCompliance.toUpdate.map((c) =>
              c.id === recordId ? { ...c, verifiedDocuments: filterDocs(c.verifiedDocuments as VerifiedDocument[]) } : c
            )
          }
        });
      } else {
        const summaryItem = summary.find(r => r.compliance_type_id === reqId);
        onPendingChangesChange({
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toUpdate: [
              ...pendingChanges.staffCompliance.toUpdate,
              {
                id: recordId,
                compliance_type_id: reqId,
                compliance_name: summaryItem?.compliance_name || '',
                status: summaryItem?.record_status || 'complete',
                expiry_date: summaryItem?.expiry_date || null,
                document_number: summaryItem?.document_number || null,
                comments: summaryItem?.comments || null,
                verifiedDocuments: filterDocs(summaryItem?.verified_documents)
              }
            ]
          }
        });
      }
    }
  };

  const updateIDVerification = (reqId: string, recordId: string | null, complianceName: string, verifiedDocuments: VerifiedDocument[], calculatedExpiry: string | null, status: ComplianceStatus) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find((c) => c.compliance_type_id === reqId);

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId
              ? { ...c, expiry_date: calculatedExpiry, verifiedDocuments, status }
              : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find((c) => c.id === recordId);
      let toUpdate = [];

      if (existingUpdate) {
        toUpdate = pendingChanges.staffCompliance.toUpdate.map((c) =>
          c.id === recordId
            ? { ...c, expiry_date: calculatedExpiry, verifiedDocuments, status }
            : c
        );
      } else {
        toUpdate = [
          ...pendingChanges.staffCompliance.toUpdate,
          {
            id: recordId,
            compliance_type_id: reqId,
            compliance_name: complianceName,
            status,
            expiry_date: calculatedExpiry,
            verifiedDocuments
          }
        ];
      }

      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toUpdate
        }
      });
    } else {
      // Create new requirement record
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: [
            ...pendingChanges.staffCompliance.toAdd,
            {
              compliance_type_id: reqId,
              compliance_name: complianceName,
              status,
              expiry_date: calculatedExpiry,
              verifiedDocuments
            }
          ]
        }
      });
    }
  };

  return {
    resolvedItems,
    updateStatus,
    updateField,
    addAttachment,
    removeAttachment,
    updateIDVerification
  };
}
