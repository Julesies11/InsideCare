export interface PendingGoal {
  tempId?: string;
  id?: string;
  goal_type: string;
  description?: string;
  is_active: boolean;
}

export interface PendingDocument {
  file: File;
  fileName: string;
  tempId: string; // Temporary ID for tracking before save
}

export interface PendingDocumentDelete {
  id: string;
  filePath: string;
  fileName: string;
}

export interface PendingMedication {
  tempId?: string;
  id?: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  is_active: boolean;
}

export interface PendingServiceProvider {
  tempId?: string;
  id?: string;
  provider_name: string;
  provider_type?: string;
  provider_description?: string;
  is_active: boolean;
}

export interface PendingShiftNote {
  tempId?: string;
  id?: string;
  shift_date: string;
  shift_time?: string | null;
  staff_id?: string | null;
  full_note: string;
  tags: string[];
}

export interface PendingStaffCompliance {
  tempId?: string;
  id?: string;
  compliance_name: string;
  completion_date?: string | null;
  expiry_date?: string | null;
  status?: string | null;
}

export interface PendingStaffResource {
  tempId?: string;
  id?: string;
  category: string;
  title: string;
  description?: string | null;
  type: string;
  external_url?: string | null;
  duration?: string | null;
  is_popular?: boolean | null;
}

export interface PendingChanges {
    goals: {
    toAdd: PendingGoal[];
    toUpdate: PendingGoal[];
    toDelete: string[]; // IDs
  };
  documents: {
    toAdd: PendingDocument[];
    toDelete: PendingDocumentDelete[];
  };
  medications: {
    toAdd: PendingMedication[];
    toUpdate: PendingMedication[];
    toDelete: string[]; // IDs
  };
  serviceProviders: {
    toAdd: PendingServiceProvider[];
    toUpdate: PendingServiceProvider[];
    toDelete: string[]; // IDs
  };
  shiftNotes: {
    toAdd: PendingShiftNote[];
    toUpdate: PendingShiftNote[];
    toDelete: string[]; // IDs
  };
  staffCompliance: {
    toAdd: PendingStaffCompliance[];
    toUpdate: PendingStaffCompliance[];
    toDelete: string[]; // IDs
  };
  staffResources: {
    toAdd: PendingStaffResource[];
    toUpdate: PendingStaffResource[];
    toDelete: string[]; // IDs
  };
}

export const emptyPendingChanges: PendingChanges = {
  goals: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  documents: {
    toAdd: [],
    toDelete: [],
  },
  medications: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  serviceProviders: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  shiftNotes: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  staffCompliance: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  staffResources: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
};

// Helper to check if there are any pending changes
export function hasPendingChanges(pending: PendingChanges): boolean {
  return (
    pending.goals.toAdd.length > 0 ||
    pending.goals.toUpdate.length > 0 ||
    pending.goals.toDelete.length > 0 ||
    pending.documents.toAdd.length > 0 ||
    pending.documents.toDelete.length > 0 ||
    pending.medications.toAdd.length > 0 ||
    pending.medications.toUpdate.length > 0 ||
    pending.medications.toDelete.length > 0 ||
    pending.serviceProviders.toAdd.length > 0 ||
    pending.serviceProviders.toUpdate.length > 0 ||
    pending.serviceProviders.toDelete.length > 0 ||
    pending.shiftNotes.toAdd.length > 0 ||
    pending.shiftNotes.toUpdate.length > 0 ||
    pending.shiftNotes.toDelete.length > 0 ||
    pending.staffCompliance.toAdd.length > 0 ||
    pending.staffCompliance.toUpdate.length > 0 ||
    pending.staffCompliance.toDelete.length > 0 ||
    pending.staffResources.toAdd.length > 0 ||
    pending.staffResources.toUpdate.length > 0 ||
    pending.staffResources.toDelete.length > 0
  );
}

// Helper to count total pending changes
export function countPendingChanges(pending: PendingChanges): number {
  return (
    pending.goals.toAdd.length +
    pending.goals.toUpdate.length +
    pending.goals.toDelete.length +
    pending.documents.toAdd.length +
    pending.documents.toDelete.length +
    pending.medications.toAdd.length +
    pending.medications.toUpdate.length +
    pending.medications.toDelete.length +
    pending.serviceProviders.toAdd.length +
    pending.serviceProviders.toUpdate.length +
    pending.serviceProviders.toDelete.length +
    pending.shiftNotes.toAdd.length +
    pending.shiftNotes.toUpdate.length +
    pending.shiftNotes.toDelete.length +
    pending.staffCompliance.toAdd.length +
    pending.staffCompliance.toUpdate.length +
    pending.staffCompliance.toDelete.length +
    pending.staffResources.toAdd.length +
    pending.staffResources.toUpdate.length +
    pending.staffResources.toDelete.length
  );
}
