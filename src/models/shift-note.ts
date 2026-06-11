import { Database } from './database.types';

export type ShiftNoteRow =
  Database['public']['Tables']['ic_shift_notes']['Row'];
export type ShiftNoteInsert =
  Database['public']['Tables']['ic_shift_notes']['Insert'];
export type ShiftNoteUpdate =
  Database['public']['Tables']['ic_shift_notes']['Update'];

export interface ShiftNote extends ShiftNoteRow {
  participant?: {
    id: string;
    participant_name: string;
  };
  staff?: {
    id: string;
    staff_name: string;
  };
  house?: {
    id: string;
    house_name: string;
  };
  shift?: {
    id: string;
    start_time: string;
    end_time: string;
    shift_template: string;
  };
}

export const SHIFT_TYPES = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'sleepover', label: 'Sleepover' },
] as const;

export const MEDICATION_STATUSES = [
  { id: 'Yes', label: 'Yes' },
  { id: 'No IR submitted', label: 'No IR submitted' },
  { id: 'Not applicable to shift', label: 'Not applicable to shift' },
] as const;

export const RESTRICTIVE_PRACTICE_STATUSES = [
  {
    id: 'Yes Incident Report Submitted',
    label: 'Yes Incident Report Submitted',
  },
  { id: 'No', label: 'No' },
  { id: 'Not applicable to client', label: 'Not applicable to client' },
] as const;
