// Participant-specific pending changes model
// This model includes goals, medications, contacts, funding, and shift notes

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
  tempId: string;
}

export interface PendingDocumentDelete {
  id: string;
  filePath: string;
  fileName: string;
}

export interface PendingMedication {
  tempId?: string;
  id?: string;
  medication_id: string;
  dosage?: string;
  frequency?: string;
  is_active: boolean;
}

export interface PendingContact {
  tempId?: string;
  id?: string;
  contact_name: string;
  contact_type_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
}

export interface PendingFunding {
  tempId?: string;
  id?: string;
  funding_source_id: string;
  funding_type_id: string;
  code?: string;
  invoice_recipient?: string;
  allocated_amount: number;
  used_amount: number;
  remaining_amount?: number;
  status: 'Active' | 'Near Depletion' | 'Expired' | 'Inactive';
  end_date?: string;
  notes?: string;
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

export interface ParticipantPendingChanges {
  goals: {
    toAdd: PendingGoal[];
    toUpdate: PendingGoal[];
    toDelete: string[];
  };
  documents: {
    toAdd: PendingDocument[];
    toDelete: PendingDocumentDelete[];
  };
  medications: {
    toAdd: PendingMedication[];
    toUpdate: PendingMedication[];
    toDelete: string[];
  };
  contacts: {
    toAdd: PendingContact[];
    toUpdate: PendingContact[];
    toDelete: string[];
  };
  funding: {
    toAdd: PendingFunding[];
    toUpdate: PendingFunding[];
    toDelete: string[];
  };
  shiftNotes: {
    toAdd: PendingShiftNote[];
    toUpdate: PendingShiftNote[];
    toDelete: string[];
  };
}

export const emptyParticipantPendingChanges: ParticipantPendingChanges = {
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
  contacts: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  funding: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  shiftNotes: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
};

// Helper to check if there are any pending changes for participants
export function hasParticipantPendingChanges(pending: ParticipantPendingChanges): boolean {
  return (
    pending.goals.toAdd.length > 0 ||
    pending.goals.toUpdate.length > 0 ||
    pending.goals.toDelete.length > 0 ||
    pending.documents.toAdd.length > 0 ||
    pending.documents.toDelete.length > 0 ||
    pending.medications.toAdd.length > 0 ||
    pending.medications.toUpdate.length > 0 ||
    pending.medications.toDelete.length > 0 ||
    pending.contacts.toAdd.length > 0 ||
    pending.contacts.toUpdate.length > 0 ||
    pending.contacts.toDelete.length > 0 ||
    pending.funding.toAdd.length > 0 ||
    pending.funding.toUpdate.length > 0 ||
    pending.funding.toDelete.length > 0 ||
    pending.shiftNotes.toAdd.length > 0 ||
    pending.shiftNotes.toUpdate.length > 0 ||
    pending.shiftNotes.toDelete.length > 0
  );
}

// Helper to count total pending changes for participants
export function countParticipantPendingChanges(pending: ParticipantPendingChanges): number {
  return (
    pending.goals.toAdd.length +
    pending.goals.toUpdate.length +
    pending.goals.toDelete.length +
    pending.documents.toAdd.length +
    pending.documents.toDelete.length +
    pending.medications.toAdd.length +
    pending.medications.toUpdate.length +
    pending.medications.toDelete.length +
    pending.contacts.toAdd.length +
    pending.contacts.toUpdate.length +
    pending.contacts.toDelete.length +
    pending.funding.toAdd.length +
    pending.funding.toUpdate.length +
    pending.funding.toDelete.length +
    pending.shiftNotes.toAdd.length +
    pending.shiftNotes.toUpdate.length +
    pending.shiftNotes.toDelete.length
  );
}
