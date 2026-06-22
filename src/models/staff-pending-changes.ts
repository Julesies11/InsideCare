// Staff-specific pending changes model
// This model includes training records which are only applicable to staff members

export interface PendingStaffCompliance {
  tempId?: string;
  id?: string;
  compliance_type_id: string;
  expiry_date?: string | null;
  document_number?: string | null;
  comments?: string | null;
  status?: string | null;
  verifiedDocuments?: Array<{
    id?: string;
    document_type: string;
    document_number: string;
    expiry_date: string | null;
    file_name?: string | null;
    file_path?: string | null;
    points: number;
  }> | null;
}

export interface PendingStaffTraining {
  tempId?: string;
  id?: string;
  title: string;
  category: string;
  description?: string | null;
  provider?: string | null;
  date_completed?: string | null;
  expiry_date?: string | null;
  file?: File | null;
  fileName?: string | null;
  filePath?: string | null;
  oldFilePath?: string | null;
}

export interface PendingStaffQualification {
  tempId?: string;
  id?: string;
  title: string;
  institution?: string | null;
  date_completed?: string | null;
  expiry_date?: string | null;
  file?: File | null;
  fileName?: string | null;
  filePath?: string | null;
  oldFilePath?: string | null;
}

export interface PendingStaffOnboarding {
  id?: string;
  onboarding_item_id: string;
  is_complete: boolean;
  comments?: string | null;
}

export interface PendingDocument {
  file: File;
  fileName: string;
  tempId: string;
}

export interface PendingDocumentDelete {
  id: string;
  filePath: string;
  fileName: string;
}

export interface PendingHouseAssignment {
  tempId?: string;
  id?: string;
  house_id: string;
  is_primary?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  house_name?: string;
}

export interface StaffPendingChanges {
  documents: {
    toAdd: PendingDocument[];
    toDelete: PendingDocumentDelete[];
  };
  staffCompliance: {
    toAdd: PendingStaffCompliance[];
    toUpdate: PendingStaffCompliance[];
    toDelete: string[];
  };
  onboarding: {
    toUpsert: PendingStaffOnboarding[];
    toDelete: string[];
  };
  training: {
    toAdd: PendingStaffTraining[];
    toUpdate: PendingStaffTraining[];
    toDelete: Array<{ id: string; filePath?: string; fileName?: string }>;
  };
  qualifications: {
    toAdd: PendingStaffQualification[];
    toUpdate: PendingStaffQualification[];
    toDelete: Array<{ id: string; filePath?: string; fileName?: string }>;
  };
  houseAssignments: {
    toAdd: PendingHouseAssignment[];
    toUpdate: PendingHouseAssignment[];
    toDelete: string[];
  };
}

export const emptyStaffPendingChanges: StaffPendingChanges = {
  documents: {
    toAdd: [],
    toDelete: [],
  },
  staffCompliance: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  onboarding: {
    toUpsert: [],
    toDelete: [],
  },
  training: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  qualifications: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  houseAssignments: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
};

// Helper to check if there are any pending changes for staff
export function hasStaffPendingChanges(pending: StaffPendingChanges): boolean {
  return (
    pending.documents.toAdd.length > 0 ||
    pending.documents.toDelete.length > 0 ||
    pending.staffCompliance.toAdd.length > 0 ||
    pending.staffCompliance.toUpdate.length > 0 ||
    pending.staffCompliance.toDelete.length > 0 ||
    pending.onboarding.toUpsert.length > 0 ||
    pending.onboarding.toDelete.length > 0 ||
    pending.training.toAdd.length > 0 ||
    pending.training.toUpdate.length > 0 ||
    pending.training.toDelete.length > 0 ||
    pending.qualifications.toAdd.length > 0 ||
    pending.qualifications.toUpdate.length > 0 ||
    pending.qualifications.toDelete.length > 0 ||
    pending.houseAssignments.toAdd.length > 0 ||
    pending.houseAssignments.toUpdate.length > 0 ||
    pending.houseAssignments.toDelete.length > 0
  );
}

// Helper to count total pending changes for staff
export function countStaffPendingChanges(pending: StaffPendingChanges): number {
  return (
    pending.documents.toAdd.length +
    pending.documents.toDelete.length +
    pending.staffCompliance.toAdd.length +
    pending.staffCompliance.toUpdate.length +
    pending.staffCompliance.toDelete.length +
    pending.onboarding.toUpsert.length +
    pending.onboarding.toDelete.length +
    pending.training.toAdd.length +
    pending.training.toUpdate.length +
    pending.training.toDelete.length +
    pending.qualifications.toAdd.length +
    pending.qualifications.toUpdate.length +
    pending.qualifications.toDelete.length +
    pending.houseAssignments.toAdd.length +
    pending.houseAssignments.toUpdate.length +
    pending.houseAssignments.toDelete.length
  );
}
