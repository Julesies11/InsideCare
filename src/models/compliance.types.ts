export type ComplianceStatus =
  | 'complete'
  | 'in_progress'
  | 'not_applicable'
  | 'Expired'
  | 'Expiring Soon'
  | 'Missing';

export interface VerifiedDocument {
  document_type: string;
  document_number: string;
  expiry_date: string | null;
  file_name: string | null;
  file_path: string | null;
  points: number;
  comments: string | null;
}

export interface ResolvedComplianceItem {
  requirementId: string;
  recordId: string | null;
  complianceName: string;
  description: string | null;
  attachmentApplicable: boolean;
  expiryDateApplicable: boolean;
  documentNumberApplicable: boolean;
  commentsApplicable: boolean;
  systemCategory: string | null;
  isCompleted: boolean;
  expiryDate: string;
  docNumber: string;
  comments: string;
  status: ComplianceStatus | null;
  updatedAt: string | null;
  updatedAtBy: string | null;
  isTemp: boolean; // Pending Add
  isPendingDelete: boolean; // Pending Delete
  isPendingUpdate: boolean; // Pending Update
  verifiedDocuments: VerifiedDocument[] | null;
}
