// Staff-specific pending changes model
// This model includes training records which are only applicable to staff members

export interface PendingStaffCompliance {
  tempId?: string;
  id?: string;
  compliance_name: string;
  completion_date?: string | null;
  expiry_date?: string | null;
  status?: string | null;
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
  file?: File;
  fileName?: string;
  filePath?: string;
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
  training: {
    toAdd: PendingStaffTraining[];
    toUpdate: PendingStaffTraining[];
    toDelete: Array<{ id: string; filePath?: string; fileName?: string }>;
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
  training: {
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
    pending.training.toAdd.length > 0 ||
    pending.training.toUpdate.length > 0 ||
    pending.training.toDelete.length > 0
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
    pending.training.toAdd.length +
    pending.training.toUpdate.length +
    pending.training.toDelete.length
  );
}
