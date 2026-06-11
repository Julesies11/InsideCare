import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { ComplianceStatus, VerifiedDocument } from '@/models/compliance.types';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { useLocation } from 'react-router-dom';
import {
  useIDDocumentTypes,
  useStaffComplianceSummary,
} from '@/hooks/use-staff';
import { useStaffComplianceState } from '@/hooks/use-staff-compliance-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ComplianceTableRow } from './compliance/compliance-table-row';
import { IDVerificationModal } from './compliance/id-verification-modal';

interface StaffComplianceSectionProps {
  staffId?: string;
  canEdit: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  staffName?: string;
}

export function StaffComplianceSection({
  staffId,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  staffName = 'Staff Member',
}: StaffComplianceSectionProps) {
  const { user } = useAuth();
  const userName = user?.fullname || user?.email || 'System';

  const {
    data: summary = [],
    loading: loadingSummary,
    error: summaryError,
  } = useStaffComplianceSummary(staffId);
  const {
    idDocumentTypes = [],
    isLoading: loadingDocs,
    error: docsError,
  } = useIDDocumentTypes();
  const loading = loadingSummary || loadingDocs;
  const error = summaryError || docsError;

  const { hash } = useLocation();

  // Scroll to targeted requirement if hash exists
  useEffect(() => {
    if (!loading && hash) {
      const id = hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the row temporarily for better UX
          element.classList.add('bg-primary/10');
          setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
        }
      }, 100);
    }
  }, [loading, hash]);

  // Utilize the new Gold Standard State Hook
  const {
    resolvedItems,
    updateStatus,
    updateField,
    addAttachment,
    removeAttachment,
    updateIDVerification,
  } = useStaffComplianceState({
    summary,
    pendingChanges,
    onPendingChangesChange,
    userName,
  });

  // ID Verification Modal States
  const [isIDModalOpen, setIsIDModalOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedComplianceName, setSelectedComplianceName] = useState<
    string | null
  >(null);
  const [selectedInitialVerifiedDocs, setSelectedInitialVerifiedDocs] =
    useState<VerifiedDocument[] | null>(null);

  // Memoize handlers to prevent ComplianceTableRow re-renders
  const handleStatusChange = useCallback(
    (
      reqId: string,
      recordId: string | null,
      name: string,
      status: 'complete' | 'in_progress' | 'not_applicable',
    ) => {
      updateStatus(reqId, recordId, name, status);
    },
    [updateStatus],
  );

  const handleFieldChange = useCallback(
    (
      reqId: string,
      recordId: string | null,
      name: string,
      field: 'document_number' | 'expiry_date' | 'comments',
      value: string,
    ) => {
      updateField(reqId, recordId, name, field, value);
    },
    [updateField],
  );

  const handleAddAttachment = useCallback(
    (
      reqId: string,
      recordId: string | null,
      fileData: { file_name: string; file_path: string },
    ) => {
      addAttachment(reqId, recordId, fileData);
    },
    [addAttachment],
  );

  const handleRemoveAttachment = useCallback(
    (reqId: string, recordId: string | null, filePath: string) => {
      removeAttachment(reqId, recordId, filePath);
    },
    [removeAttachment],
  );

  const handleIDVerificationSave = useCallback(
    (
      verifiedDocuments: VerifiedDocument[],
      calculatedExpiry: string | null,
      status: ComplianceStatus,
    ) => {
      if (!selectedRequirementId || !selectedComplianceName) return;
      updateIDVerification(
        selectedRequirementId,
        selectedRecordId,
        selectedComplianceName,
        verifiedDocuments,
        calculatedExpiry,
        status,
      );
    },
    [
      selectedRequirementId,
      selectedRecordId,
      selectedComplianceName,
      updateIDVerification,
    ],
  );

  // Memoize modal open handler
  const handleOpenIDModal = useCallback(
    (
      reqId: string,
      recordId: string | null,
      name: string,
      docs: VerifiedDocument[] | null,
    ) => {
      setSelectedRequirementId(reqId);
      setSelectedRecordId(recordId);
      setSelectedComplianceName(name);
      setSelectedInitialVerifiedDocs(docs);
      setIsIDModalOpen(true);
    },
    [],
  );

  return (
    <Card className="pb-2.5 shadow-xs border-slate-200" id="staff_compliance">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
        <CardTitle className="text-lg">Compliance Tracking</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
            Loading compliance requirements...
          </div>
        ) : error ? (
          <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-sm text-red-700 font-medium">
              Failed to load compliance data
            </p>
            <p className="text-xs text-red-500 mt-1">
              {(error as any).message || 'Unknown database error'}
            </p>
          </div>
        ) : resolvedItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm bg-slate-50/50 m-6 rounded-xl border border-dashed border-slate-200">
            No compliance requirements configured.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-start text-slate-500 font-bold uppercase tracking-wider text-[11px] min-w-[350px] px-2 h-11 border-b border-slate-200">
                    Requirement
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center h-11 border-b border-slate-200">
                    Workflow Status
                  </TableHead>
                  <TableHead className="min-w-[155px] px-2 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center h-11 border-b border-slate-200">
                    Expiry Date
                  </TableHead>
                  <TableHead className="min-w-[110px] px-2 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center h-11 border-b border-slate-200">
                    Compliance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm font-medium">
                {resolvedItems.map((item) => (
                  <ComplianceTableRow
                    key={item.requirementId}
                    staffId={staffId || ''}
                    userName={userName}
                    item={item}
                    canEdit={canEdit}
                    onStatusChange={handleStatusChange}
                    onFieldChange={handleFieldChange}
                    onAddAttachment={handleAddAttachment}
                    onRemoveAttachment={handleRemoveAttachment}
                    onOpenIDModal={handleOpenIDModal}
                    idDocumentTypes={idDocumentTypes}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {staffId && (
        <IDVerificationModal
          open={isIDModalOpen}
          onOpenChange={setIsIDModalOpen}
          staffId={staffId}
          staffName={staffName}
          initialVerifiedDocuments={selectedInitialVerifiedDocs}
          onSave={handleIDVerificationSave}
        />
      )}
    </Card>
  );
}
