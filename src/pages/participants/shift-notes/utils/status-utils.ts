import { ShiftNoteTask } from '@/hooks/use-shift-notes';

export const STATUS_FILTERS = ['Note Submitted', 'Draft Note', 'Missing', 'Current Shift', 'Upcoming'] as const;
export type StatusFilter = typeof STATUS_FILTERS[number];

export const isPast = (startDate: string, endDate: string | null | undefined, endTime: string, now: Date = new Date()) => {
  try {
    const effectiveEndDate = endDate || startDate;
    const shiftEnd = new Date(`${effectiveEndDate}T${endTime}`);
    return shiftEnd < now;
  } catch {
    return false;
  }
};

export const isCurrent = (startDate: string, endDate: string | null | undefined, startTime: string, endTime: string, now: Date = new Date()) => {
  try {
    const shiftStart = new Date(`${startDate}T${startTime}`);
    const effectiveEndDate = endDate || startDate;
    const shiftEnd = new Date(`${effectiveEndDate}T${endTime}`);
    return now >= shiftStart && now <= shiftEnd;
  } catch {
    return false;
  }
};

export const getRowStatus = (row: ShiftNoteTask, now: Date = new Date()): StatusFilter => {
  if (row.note_id) {
    return row.note_status === 'draft' ? 'Draft Note' : 'Note Submitted';
  }
  if (isPast(row.start_date, row.end_date, row.end_time, now)) {
    return 'Missing';
  }
  if (isCurrent(row.start_date, row.end_date, row.start_time, row.end_time, now)) {
    return 'Current Shift';
  }
  return 'Upcoming';
};
