import { ShiftNoteTask } from '@/hooks/use-shift-notes';

export const STATUS_FILTERS = ['Completed', 'Draft', 'Overdue'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const ALL_ROW_STATUSES = ['Completed', 'Draft', 'Overdue'] as const;
export type RowStatus = (typeof ALL_ROW_STATUSES)[number];

export const hasStarted = (
  startDate: string,
  startTime: string,
  now: Date = new Date(),
) => {
  try {
    const shiftStart = new Date(`${startDate}T${startTime}`);
    return shiftStart <= now;
  } catch {
    return false;
  }
};

export const isPast = (
  startDate: string,
  endDate: string | null | undefined,
  endTime: string,
  now: Date = new Date(),
) => {
  try {
    const effectiveEndDate = endDate || startDate;
    const shiftEnd = new Date(`${effectiveEndDate}T${endTime}`);
    return shiftEnd < now;
  } catch {
    return false;
  }
};

export const isCurrent = (
  startDate: string,
  endDate: string | null | undefined,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
) => {
  try {
    const shiftStart = new Date(`${startDate}T${startTime}`);
    const effectiveEndDate = endDate || startDate;
    const shiftEnd = new Date(`${effectiveEndDate}T${endTime}`);
    return now >= shiftStart && now <= shiftEnd;
  } catch {
    return false;
  }
};

export const getRowStatus = (
  row: ShiftNoteTask,
  now: Date = new Date(),
): RowStatus | null => {
  if (row.note_id) {
    return row.note_status === 'draft' ? 'Draft' : 'Completed';
  }
  if (hasStarted(row.start_date, row.start_time, now)) {
    return 'Overdue';
  }
  return null;
};
