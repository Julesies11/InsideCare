import { parseISO, areIntervalsOverlapping } from 'date-fns';

export interface ConflictCheckParams {
  shiftId?: string | null;
  staffId: string | null;
  startDate: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  availabilityBlocks: any[];
  leaveRequests: any[];
  existingShifts: any[];
}

export interface ConflictResult {
  isConflict: boolean;
  type?: 'leave_approved' | 'leave_pending' | 'unavailability' | 'not_preferred' | 'overlap';
  reason?: string;
}

/**
 * Converts a date and time string into a full Date object.
 */
function toDateTime(dateStr: string, timeStr: string): Date {
  // Ensure time has seconds
  const formattedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${formattedTime}`);
}

/**
 * Returns the time in minutes since midnight for a time string (HH:MM).
 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Checks if two time windows overlap on a single day.
 */
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/**
 * Checks for scheduling conflicts for a given staff member and shift.
 */
export function checkRosterConflict(params: ConflictCheckParams): ConflictResult {
  const {
    shiftId,
    staffId,
    startDate,
    startTime,
    endTime,
    endDate = startDate,
    availabilityBlocks,
    leaveRequests,
    existingShifts,
  } = params;

  // 1. Open shifts (no staff_id) have no conflicts
  if (!staffId || staffId === 'none') {
    return { isConflict: false };
  }

  const shiftStart = toDateTime(startDate, startTime);
  const shiftEnd = toDateTime(endDate, endTime);

  // Validate shift times
  if (shiftEnd <= shiftStart) {
    return { isConflict: false }; // Invalid interval, skip check
  }

  // 2. Check Leave Requests (Approved and Pending)
  // Leave requests are inclusive dates (e.g. from 2026-06-20 to 2026-06-22)
  for (const leave of leaveRequests) {
    if (leave.staff_id !== staffId) continue;
    if (leave.status === 'rejected') continue;

    const leaveStart = new Date(`${leave.start_date}T00:00:00`);
    const leaveEnd = new Date(`${leave.end_date}T23:59:59`);

    const hasLeaveOverlap = areIntervalsOverlapping(
      { start: shiftStart, end: shiftEnd },
      { start: leaveStart, end: leaveEnd }
    );

    if (hasLeaveOverlap) {
      const type = leave.status === 'approved' ? 'leave_approved' : 'leave_pending';
      const label = leave.status === 'approved' ? 'Approved Leave' : 'Pending Leave Request';
      return {
        isConflict: true,
        type,
        reason: `${label} (${leave.leave_type?.leave_type_name || 'General Leave'} from ${leave.start_date} to ${leave.end_date})`,
      };
    }
  }

  // 3. Check Overlapping Shifts (Double booking protection)
  for (const shift of existingShifts) {
    if (shift.staff_id !== staffId) continue;
    if (shift.id === shiftId) continue; // Skip comparing against itself

    const otherStart = toDateTime(shift.start_date, shift.start_time);
    const otherEnd = toDateTime(shift.end_date || shift.start_date, shift.end_time);

    const hasShiftOverlap = areIntervalsOverlapping(
      { start: shiftStart, end: shiftEnd },
      { start: otherStart, end: otherEnd }
    );

    if (hasShiftOverlap) {
      return {
        isConflict: true,
        type: 'overlap',
        reason: `Double-booked with another shift at ${shift.house?.house_name || 'Standalone'} (${shift.start_time} - ${shift.end_time})`,
      };
    }
  }

  // 4. Break shift into separate date segments to accurately check availability
  // (Handles overnight shifts correctly across date boundaries)
  const segments: Array<{ date: string; start: string; end: string; dayOfWeek: number }> = [];
  if (startDate === endDate) {
    segments.push({
      date: startDate,
      start: startTime,
      end: endTime,
      dayOfWeek: shiftStart.getDay(),
    });
  } else {
    // Spans overnight: Part 1 starts on startDate, goes to midnight
    segments.push({
      date: startDate,
      start: startTime,
      end: '23:59',
      dayOfWeek: shiftStart.getDay(),
    });
    // Part 2 starts on endDate, goes from midnight to endTime
    segments.push({
      date: endDate,
      start: '00:00',
      end: endTime,
      dayOfWeek: shiftEnd.getDay(),
    });
  }

  // Check availability block filters
  const staffBlocks = availabilityBlocks.filter(b => b.staff_id === staffId && b.is_active !== false);

  for (const segment of segments) {
    const dateSpecificBlocks = staffBlocks.filter(
      b =>
        b.type === 'date_specific' &&
        b.start_date &&
        b.end_date &&
        segment.date >= b.start_date &&
        segment.date <= b.end_date
    );

    if (dateSpecificBlocks.length > 0) {
      // Date-specific override takes precedence over recurring weekly slots
      for (const block of dateSpecificBlocks) {
        if (timesOverlap(segment.start, segment.end, block.start_time, block.end_time)) {
          if (!block.is_available) {
            return {
              isConflict: true,
              type: 'unavailability',
              reason: `Marked Unavailable on ${segment.date}${block.notes ? `: "${block.notes}"` : ''}`,
            };
          }
        }
      }
      // Note: If they explicitly set an available block for this date, or if they set nothing specific,
      // the date-specific rule governs. Usually, if they have an override, we only warn if it blocks them.
      continue;
    }

    // 4.2 Check Weekly Recurring Availability for this segment's day of week
    const recurringBlocks = staffBlocks.filter(
      b => b.type === 'recurring' && b.day_of_week === segment.dayOfWeek
    );

    if (recurringBlocks.length > 0) {
      // Find if they are explicitly unavailable during this segment
      for (const block of recurringBlocks) {
        if (timesOverlap(segment.start, segment.end, block.start_time, block.end_time)) {
          if (!block.is_available) {
            return {
              isConflict: true,
              type: 'unavailability',
              reason: `Marked Unavailable on weekly schedule (${block.notes || 'No Reason'})`,
            };
          }
        }
      }
    }
  }

  return { isConflict: false };
}
