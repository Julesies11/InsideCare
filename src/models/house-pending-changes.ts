// House-specific pending changes model
// This model includes participants, staff, calendar events, documents, checklists, forms, and resources

export interface HousePendingChanges {
  participants: {
    toAdd: Array<{
      tempId: string;
      participant_id: string;
      move_in_date?: string;
      is_active: boolean;
    }>;
    toUpdate: Array<{
      id: string;
      participant_id?: string;
      move_in_date?: string;
      is_active?: boolean;
    }>;
    toDelete: string[];
  };
  staff: {
    toAdd: Array<{
      tempId: string;
      staff_id: string;
      is_primary: boolean;
      start_date?: string;
      end_date?: string;
      notes?: string;
    }>;
    toUpdate: Array<{
      id: string;
      staff_id?: string;
      is_primary?: boolean;
      start_date?: string;
      end_date?: string;
      notes?: string;
    }>;
    toDelete: string[];
  };
  calendarEvents: {
    toAdd: Array<{
      tempId: string;
      title: string;
      type: string;
      description?: string;
      event_date: string;
      start_time?: string;
      end_time?: string;
      participant_id?: string;
      assigned_staff_id?: string;
      status?: string;
      location?: string;
      notes?: string;
    }>;
    toUpdate: Array<{
      id: string;
      title?: string;
      type?: string;
      description?: string;
      event_date?: string;
      start_time?: string;
      end_time?: string;
      participant_id?: string;
      assigned_staff_id?: string;
      status?: string;
      location?: string;
      notes?: string;
    }>;
    toDelete: string[];
  };
  documents: {
    toAdd: Array<{
      tempId: string;
      file: File;
      fileName: string;
    }>;
    toDelete: Array<{
      id: string;
      filePath: string;
      fileName: string;
    }>;
  };
  checklists: {
    toAdd: Array<{
      tempId: string;
      name: string;
      frequency: string;
      description?: string;
      is_global: boolean;
      items: Array<{
        tempId: string;
        title: string;
        instructions?: string;
        priority: string;
        is_required: boolean;
        sort_order: number;
      }>;
    }>;
    toUpdate: Array<{
      id: string;
      name?: string;
      frequency?: string;
      description?: string;
      is_global?: boolean;
    }>;
    toDelete: string[];
    checklistItems: {
      toAdd: Array<{
        tempId: string;
        checklist_id: string;
        title: string;
        instructions?: string;
        priority: string;
        is_required: boolean;
        sort_order: number;
      }>;
      toUpdate: Array<{
        id: string;
        title?: string;
        instructions?: string;
        priority?: string;
        is_required?: boolean;
        sort_order?: number;
      }>;
      toDelete: string[];
    };
  };
  forms: {
    toAdd: Array<{
      tempId: string;
      name: string;
      type: string;
      description?: string;
      frequency: string;
      is_global: boolean;
      status: string;
    }>;
    toUpdate: Array<{
      id: string;
      name?: string;
      type?: string;
      description?: string;
      frequency?: string;
      is_global?: boolean;
      status?: string;
    }>;
    toDelete: string[];
  };
  formAssignments: {
    toAdd: Array<{
      tempId: string;
      form_id: string;
      participant_id?: string;
      staff_id?: string;
      due_date?: string;
      status: string;
      notes?: string;
    }>;
    toUpdate: Array<{
      id: string;
      form_id?: string;
      participant_id?: string;
      staff_id?: string;
      due_date?: string;
      status?: string;
      notes?: string;
    }>;
    toDelete: string[];
  };
  resources: {
    toAdd: Array<{
      tempId: string;
      title: string;
      category: string;
      type: string;
      description?: string;
      priority: string;
      phone?: string;
      address?: string;
      file_url?: string;
      file_name?: string;
      file_size?: number;
      notes?: string;
    }>;
    toUpdate: Array<{
      id: string;
      title?: string;
      category?: string;
      type?: string;
      description?: string;
      priority?: string;
      phone?: string;
      address?: string;
      file_url?: string;
      file_name?: string;
      file_size?: number;
      notes?: string;
    }>;
    toDelete: string[];
  };
}

export const emptyHousePendingChanges: HousePendingChanges = {
  participants: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  staff: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  calendarEvents: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  documents: {
    toAdd: [],
    toDelete: [],
  },
  checklists: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
    checklistItems: {
      toAdd: [],
      toUpdate: [],
      toDelete: [],
    },
  },
  forms: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  formAssignments: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
  resources: {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  },
};

// Helper to check if there are any pending changes for houses
export function hasHousePendingChanges(pending: HousePendingChanges): boolean {
  return (
    pending.participants.toAdd.length > 0 ||
    pending.participants.toUpdate.length > 0 ||
    pending.participants.toDelete.length > 0 ||
    pending.staff.toAdd.length > 0 ||
    pending.staff.toUpdate.length > 0 ||
    pending.staff.toDelete.length > 0 ||
    pending.calendarEvents.toAdd.length > 0 ||
    pending.calendarEvents.toUpdate.length > 0 ||
    pending.calendarEvents.toDelete.length > 0 ||
    pending.documents.toAdd.length > 0 ||
    pending.documents.toDelete.length > 0 ||
    pending.checklists.toAdd.length > 0 ||
    pending.checklists.toUpdate.length > 0 ||
    pending.checklists.toDelete.length > 0 ||
    pending.checklists.checklistItems.toAdd.length > 0 ||
    pending.checklists.checklistItems.toUpdate.length > 0 ||
    pending.checklists.checklistItems.toDelete.length > 0 ||
    pending.forms.toAdd.length > 0 ||
    pending.forms.toUpdate.length > 0 ||
    pending.forms.toDelete.length > 0 ||
    pending.formAssignments.toAdd.length > 0 ||
    pending.formAssignments.toUpdate.length > 0 ||
    pending.formAssignments.toDelete.length > 0 ||
    pending.resources.toAdd.length > 0 ||
    pending.resources.toUpdate.length > 0 ||
    pending.resources.toDelete.length > 0
  );
}

// Helper to count total pending changes for houses
export function countHousePendingChanges(pending: HousePendingChanges): number {
  return (
    pending.participants.toAdd.length +
    pending.participants.toUpdate.length +
    pending.participants.toDelete.length +
    pending.staff.toAdd.length +
    pending.staff.toUpdate.length +
    pending.staff.toDelete.length +
    pending.calendarEvents.toAdd.length +
    pending.calendarEvents.toUpdate.length +
    pending.calendarEvents.toDelete.length +
    pending.documents.toAdd.length +
    pending.documents.toDelete.length +
    pending.checklists.toAdd.length +
    pending.checklists.toUpdate.length +
    pending.checklists.toDelete.length +
    pending.checklists.checklistItems.toAdd.length +
    pending.checklists.checklistItems.toUpdate.length +
    pending.checklists.checklistItems.toDelete.length +
    pending.forms.toAdd.length +
    pending.forms.toUpdate.length +
    pending.forms.toDelete.length +
    pending.formAssignments.toAdd.length +
    pending.formAssignments.toUpdate.length +
    pending.formAssignments.toDelete.length +
    pending.resources.toAdd.length +
    pending.resources.toUpdate.length +
    pending.resources.toDelete.length
  );
}
