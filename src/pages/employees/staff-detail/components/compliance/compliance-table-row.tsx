import React, { useState } from 'react';
import { staffDetailsApi } from '@/api/staff-details.api';
import { ResolvedComplianceItem } from '@/models/compliance.types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TableCell, TableRow } from '@/components/ui/table';
import { ComplianceAttachmentsList } from './compliance-attachments-list';
import { ComplianceDetailsForm } from './compliance-details-form';
import { toAbsoluteUrl } from '@/lib/helpers';

const getFileIcon = (fileName?: string) => {
  if (!fileName) return 'doc.svg';
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf.svg';
    case 'doc':
    case 'docx':
      return 'word.svg';
    case 'xls':
    case 'xlsx':
      return 'excel.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'svg':
    case 'webp':
      return 'image.svg';
    case 'txt':
      return 'text.svg';
    case 'zip':
    case 'rar':
    case '7z':
      return 'zip.svg';
    default:
      return 'doc.svg';
  }
};

interface ComplianceTableRowProps {
  staffId: string;
  userName: string;
  item: ResolvedComplianceItem;
  canEdit: boolean;
  onStatusChange: (
    reqId: string,
    recordId: string | null,
    name: string,
    status: 'complete' | 'in_progress' | 'not_applicable',
  ) => void;
  onFieldChange: (
    reqId: string,
    recordId: string | null,
    name: string,
    field: 'document_number' | 'expiry_date' | 'comments',
    value: string,
  ) => void;
  onAddAttachment: (
    reqId: string,
    recordId: string | null,
    fileData: { file_name: string; file_path: string },
  ) => void;
  onRemoveAttachment: (
    reqId: string,
    recordId: string | null,
    filePath: string,
  ) => void;
  onOpenIDModal: (
    reqId: string,
    recordId: string | null,
    name: string,
    docs: any[] | null,
  ) => void;
  idDocumentTypes: any[];
}

function getStatusBadgeVariant(
  status: string | null,
): 'success' | 'warning' | 'destructive' | 'secondary' | 'primary' {
  if (!status) return 'secondary';
  switch (status) {
    case 'complete':
      return 'success';
    case 'Expiring Soon':
      return 'warning';
    case 'Expired':
      return 'destructive';
    case 'in_progress':
      return 'primary';
    case 'not_applicable':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export const ComplianceTableRow = React.memo(function ComplianceTableRow({
  staffId,
  userName,
  item,
  canEdit,
  onStatusChange,
  onFieldChange,
  onAddAttachment,
  onRemoveAttachment,
  onOpenIDModal,
  idDocumentTypes,
}: ComplianceTableRowProps) {
  const isPendingAdd = item.isTemp;
  const isPendingUpdate = item.isPendingUpdate;
  const isPendingDelete = item.isPendingDelete;
  const isIDVerification = item.systemCategory === 'id_verification';

  // Map database enum to UI logic
  const isComplete =
    item.status === 'complete' ||
    item.status === 'Expired' ||
    item.status === 'Expiring Soon';
  const isInProgress = item.status === 'in_progress';
  const isMissing = item.status === 'Missing';
  const isNotApplicable = item.status === 'not_applicable';

  // Show the edit form if we have an actual record (Complete, Expired, In Progress)
  const shouldShowDetails = (isComplete || isInProgress) && !isNotApplicable;

  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = isComplete || isInProgress || isNotApplicable;

  const getSummaryString = () => {
    if (isNotApplicable) {
      return item.comments ? `Reason: "${item.comments}"` : 'No reason provided';
    }

    if (isIDVerification) {
      const points = (item.verifiedDocuments || []).reduce(
        (sum, doc) => sum + (doc.points || 0),
        0,
      );
      const docNames = (item.verifiedDocuments || [])
        .map((doc) => {
          const docTypeDef = idDocumentTypes.find((d) => d.id === doc.document_type);
          return docTypeDef?.name || doc.document_type;
        })
        .filter(Boolean)
        .join(', ');
      return `${points} pts verified${docNames ? ` (${docNames})` : ''}`;
    }

    const parts: string[] = [];
    if (item.docNumber) {
      parts.push(`Doc #: ${item.docNumber}`);
    }

    const attachmentCount = (item.verifiedDocuments || []).filter(
      (d) => d.document_type === 'attachment' || !d.document_type,
    ).length;
    if (attachmentCount > 0) {
      parts.push(`${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`);
    }

    if (item.comments) {
      parts.push(`Comments: "${item.comments}"`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No details provided';
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const url =
        await staffDetailsApi.documents.getAttachmentSignedUrl(filePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to open document');
    }
  };

  return (
    <TableRow
      id={`req-${item.requirementId}`}
      className={`
        transition-colors
        ${isPendingAdd ? 'bg-primary/5 hover:bg-primary/10' : ''}
        ${isPendingDelete ? 'opacity-60 bg-destructive/5 hover:bg-destructive/10' : ''}
        ${isPendingUpdate ? 'bg-warning/5 hover:bg-warning/10' : ''}
      `}
    >
      <TableCell className="py-3! px-2 align-top">
        <div className="flex flex-col">
          {/* Main Title Area */}
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-slate-800 ${isPendingDelete ? 'line-through text-slate-500' : ''}`}
            >
              {item.complianceName}
            </span>
            {isPendingAdd && (
              <Badge variant="primary" className="text-[9px] px-1.5 py-0 h-4">
                Draft: New
              </Badge>
            )}
            {isPendingUpdate && (
              <Badge variant="warning" className="text-[9px] px-1.5 py-0 h-4">
                Draft: Edited
              </Badge>
            )}
            {isPendingDelete && (
              <Badge
                variant="destructive"
                className="text-[9px] px-1.5 py-0 h-4"
              >
                Pending Removal
              </Badge>
            )}
          </div>

          {item.description && (
            <span className="text-xs text-muted-foreground font-normal mt-0.5 mb-1.5">
              {item.description}
            </span>
          )}

          {/* High-density summary header / toggle */}
          {hasDetails && (
            <div className="flex items-center gap-2 mt-1.5 mb-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer select-none"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3.5 shrink-0" />
                    <span>Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5 shrink-0" />
                    <span>{isPendingAdd || isPendingUpdate ? 'Edit Details' : 'View / Edit Details'}</span>
                  </>
                )}
              </button>

              {!isExpanded && (
                <span className="text-[11px] text-slate-500 font-normal italic truncate max-w-[280px] sm:max-w-[400px]">
                  — {getSummaryString()}
                </span>
              )}
            </div>
          )}

          {/* 100 Points of ID Specific Rendering */}
          {isIDVerification && (isExpanded || !hasDetails) && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() =>
                  onOpenIDModal(
                    item.requirementId,
                    item.recordId,
                    item.complianceName,
                    item.verifiedDocuments,
                  )
                }
                disabled={!canEdit}
                className="text-xs text-primary font-semibold hover:underline text-start flex items-center gap-1 cursor-pointer transition-colors"
              >
                {item.verifiedDocuments && item.verifiedDocuments.length > 0 ? (
                  <>
                    <span className="flex items-center gap-1">
                      {isComplete ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="animate-pulse text-amber-500">
                          ...
                        </span>
                      )}
                      {item.verifiedDocuments.reduce(
                        (sum, doc) => sum + (doc.points || 0),
                        0,
                      )}{' '}
                      pts verified
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal hover:text-primary ml-1">
                      ({isComplete ? 'Edit' : 'Continue'} Verification)
                    </span>
                  </>
                ) : (
                  <span>Verify ID Documents</span>
                )}
              </button>
            </div>
          )}

          {/* 100 Points of ID - Sighted Documents List */}
          {isIDVerification &&
            isExpanded &&
            item.verifiedDocuments &&
            item.verifiedDocuments.length > 0 && (
              <div className="mt-3.5 space-y-2 border-t border-dashed border-gray-200 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Sighted ID Documents:
                </span>
                <div className="flex flex-col gap-1.5 w-full">
                  {item.verifiedDocuments.map((doc, index) => {
                    const docTypeDef = idDocumentTypes.find(
                      (d) => d.id === doc.document_type,
                    );
                    const label = docTypeDef?.name || doc.document_type;

                    // Visibility logic based on current config (strict)
                    const showNumber = !!docTypeDef?.document_number_applicable;
                    const showExpiry = !!docTypeDef?.expiry_date_applicable;
                    const showComments = !!docTypeDef?.comments_applicable;
                    const showAttachment = !!docTypeDef?.attachment_applicable;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md shadow-xs transition-all hover:bg-slate-100/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {doc.points > 0 ? (
                              <span className="text-[9px] font-black text-success bg-white border border-success/20 px-1.5 py-0.5 rounded shadow-xs">
                                +{doc.points}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                +0
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 leading-tight py-0.5">
                            <span className="text-[11px] font-bold text-slate-700 whitespace-normal break-words">
                              {label}
                            </span>
                            {showNumber && doc.document_number && (
                              <span className="text-[9px] text-slate-400 font-mono truncate">
                                Ref: {doc.document_number}
                              </span>
                            )}
                            {showComments && doc.comments && (
                              <span className="text-[9px] text-slate-500 italic break-words mt-1 border-l-2 border-slate-200 ps-1.5 ml-0.5 leading-relaxed bg-slate-100/50 rounded-r py-0.5">
                                {doc.comments}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {showExpiry && doc.expiry_date && (
                            <div className="flex flex-col items-end leading-tight">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                Expiry
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 font-mono">
                                {doc.expiry_date}
                              </span>
                            </div>
                          )}

                          {showAttachment &&
                            (doc.file_path ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleViewDocument(doc.file_path!)
                                }
                                className="flex items-center gap-2 max-w-[130px] group cursor-pointer text-start truncate min-w-0"
                              >
                                <img
                                  src={toAbsoluteUrl(
                                    `/media/file-types/${getFileIcon(doc.file_name || '')}`,
                                  )}
                                  className="size-5 shrink-0 transition-opacity group-hover:opacity-80"
                                  alt="file icon"
                                />
                                <span
                                  className="text-[10px] text-muted-foreground truncate group-hover:text-primary group-hover:underline transition-colors"
                                  title={doc.file_name || 'File'}
                                >
                                  {doc.file_name || 'View File'}
                                </span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">
                                No file
                              </span>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Standard Compliance Collapsible Form Area */}
          {!isIDVerification && shouldShowDetails && isExpanded && (
            <div className="mt-4 border-t border-dashed border-gray-200 pt-4 w-full transition-all duration-300 ease-in-out origin-top animate-in fade-in slide-in-from-top-2">
              <ComplianceDetailsForm
                item={item}
                canEdit={canEdit}
                onFieldChange={(field, value) =>
                  onFieldChange(
                    item.requirementId,
                    item.recordId,
                    item.complianceName,
                    field,
                    value,
                  )
                }
              />
              {item.attachmentApplicable && (
                <ComplianceAttachmentsList
                  staffId={staffId}
                  userName={userName}
                  item={item}
                  canEdit={canEdit}
                  onAddAttachment={(fileData) =>
                    onAddAttachment(item.requirementId, item.recordId, fileData)
                  }
                  onRemoveAttachment={(filePath) =>
                    onRemoveAttachment(
                      item.requirementId,
                      item.recordId,
                      filePath,
                    )
                  }
                />
              )}
            </div>
          )}

          {/* Not Applicable State Message */}
          {isNotApplicable && isExpanded && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-lg w-full space-y-3">
              <p className="text-xs text-slate-500 italic">
                This requirement has been marked as{' '}
                <strong>Not Applicable</strong> for this staff member.
              </p>
              <div className="space-y-1">
                <Label
                  htmlFor={`reason-${item.requirementId}`}
                  className="text-[10px] uppercase font-bold text-slate-500 tracking-wider"
                >
                  Reason
                </Label>
                <Textarea
                  id={`reason-${item.requirementId}`}
                  value={item.comments || ''}
                  onChange={(e) =>
                    onFieldChange(
                      item.requirementId,
                      item.recordId,
                      item.complianceName,
                      'comments',
                      e.target.value,
                    )
                  }
                  placeholder="Provide a reason why this is not applicable..."
                  maxLength={1000}
                  className="text-xs min-h-[60px] resize-none bg-white focus:bg-white"
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="py-3! px-2 text-center align-top min-w-[150px]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => {
                if (isIDVerification) {
                  const currentPoints = (item.verifiedDocuments || []).reduce(
                    (sum, doc) => sum + (doc.points || 0),
                    0,
                  );
                  if (currentPoints < 100) {
                    onOpenIDModal(
                      item.requirementId,
                      item.recordId,
                      item.complianceName,
                      item.verifiedDocuments,
                    );
                  } else {
                    onStatusChange(
                      item.requirementId,
                      item.recordId,
                      item.complianceName,
                      'complete',
                    );
                    setIsExpanded(true);
                  }
                } else {
                  onStatusChange(
                    item.requirementId,
                    item.recordId,
                    item.complianceName,
                    'complete',
                  );
                  setIsExpanded(true);
                }
              }}
              disabled={!canEdit}
              title="Mark as Complete"
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${isComplete ? 'bg-white text-success shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Complete
            </button>
            <button
              type="button"
              onClick={() => {
                onStatusChange(
                  item.requirementId,
                  item.recordId,
                  item.complianceName,
                  'in_progress',
                );
                setIsExpanded(true);
              }}
              disabled={!canEdit}
              title="Mark as In Progress"
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${isInProgress ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => {
                onStatusChange(
                  item.requirementId,
                  item.recordId,
                  item.complianceName,
                  'not_applicable',
                );
                setIsExpanded(true);
              }}
              disabled={!canEdit}
              title="Mark as Not Applicable"
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${isNotApplicable ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              N/A
            </button>
          </div>

          <div className="flex flex-col items-center gap-0.5 mt-1">
            {(item.updatedAt || item.updatedAtBy) && (
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                {item.updatedAt && (
                  <>
                    {isComplete
                      ? 'Completed'
                      : isInProgress
                        ? 'Started'
                        : 'Marked N/A'}
                    : {new Date(item.updatedAt).toLocaleDateString()}
                  </>
                )}
                {item.updatedAtBy && ` by ${item.updatedAtBy}`}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3! px-2 text-center align-top">
        {item.expiryDateApplicable && !isNotApplicable ? (
          <>
            <Input
              type="date"
              value={item.expiryDate || ''}
              onChange={(e) =>
                onFieldChange(
                  item.requirementId,
                  item.recordId,
                  item.complianceName,
                  'expiry_date',
                  e.target.value,
                )
              }
              disabled={
                !canEdit ||
                (!shouldShowDetails && !item.expiryDate) ||
                isIDVerification
              }
              className="max-w-[135px] mx-auto text-center h-8 text-xs bg-white focus:bg-white"
            />
            {isIDVerification && isComplete && (
              <span className="text-[9px] text-muted-foreground block mt-1.5 font-medium">
                Auto-calculated
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )}
      </TableCell>

      <TableCell className="py-3! px-2 text-center align-top">
        <Badge
          variant={getStatusBadgeVariant(item.status)}
          size="sm"
          className="px-3 py-1 capitalize min-w-[90px] justify-center text-[10px] font-bold"
        >
          {item.status?.replace('_', ' ') || 'Missing'}
        </Badge>
      </TableCell>
    </TableRow>
  );
});
