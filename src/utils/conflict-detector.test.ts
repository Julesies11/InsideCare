import { describe, it, expect } from 'vitest';
import { checkRosterConflict } from './conflict-detector';

describe('checkRosterConflict', () => {
  const staffId = 'staff-123';

  const defaultLeave = [
    {
      staff_id: staffId,
      status: 'approved',
      start_date: '2026-06-20',
      end_date: '2026-06-22',
      leave_type: { leave_type_name: 'Annual Leave' },
    },
  ];

  const defaultAvailability = [
    {
      staff_id: staffId,
      type: 'recurring',
      day_of_week: 3, // Wednesday
      start_time: '09:00:00',
      end_time: '12:00:00',
      is_available: false,
      notes: 'University classes',
      is_active: true,
    },
    {
      staff_id: staffId,
      type: 'date_specific',
      start_date: '2026-06-25', // Thursday
      end_date: '2026-06-25',
      start_time: '00:00:00',
      end_time: '23:59:59',
      is_available: false,
      notes: 'Doctor appointment',
      is_active: true,
    },
  ];

  const defaultShifts = [
    {
      id: 'shift-99',
      staff_id: staffId,
      start_date: '2026-06-26',
      start_time: '14:00:00',
      end_date: '2026-06-26',
      end_time: '18:00:00',
      house: { house_name: 'SIL House A' },
    },
  ];

  it('returns no conflict for unassigned (open) shifts', () => {
    const result = checkRosterConflict({
      staffId: null,
      startDate: '2026-06-20',
      startTime: '09:00',
      endTime: '17:00',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(false);
  });

  it('detects conflict with approved leave', () => {
    const result = checkRosterConflict({
      staffId,
      startDate: '2026-06-21',
      startTime: '09:00',
      endTime: '17:00',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(true);
    expect(result.type).toBe('leave_approved');
    expect(result.reason).toContain('Annual Leave');
  });

  it('detects conflict with date-specific unavailability', () => {
    const result = checkRosterConflict({
      staffId,
      startDate: '2026-06-25',
      startTime: '10:00',
      endTime: '11:00',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(true);
    expect(result.type).toBe('unavailability');
    expect(result.reason).toContain('Doctor appointment');
  });

  it('detects conflict with recurring unavailability', () => {
    const WednesdayDate = '2026-06-24'; // June 24th, 2026 is Wednesday
    const result = checkRosterConflict({
      staffId,
      startDate: WednesdayDate,
      startTime: '09:30',
      endTime: '11:30',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(true);
    expect(result.type).toBe('unavailability');
    expect(result.reason).toContain('weekly schedule');
  });

  it('detects overlap with another rostered shift', () => {
    const result = checkRosterConflict({
      staffId,
      startDate: '2026-06-26',
      startTime: '15:00',
      endTime: '17:00',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(true);
    expect(result.type).toBe('overlap');
    expect(result.reason).toContain('Double-booked');
  });

  it('returns no conflict when shift matches outside unavailability hours', () => {
    const WednesdayDate = '2026-06-24'; // Wednesday
    const result = checkRosterConflict({
      staffId,
      startDate: WednesdayDate,
      startTime: '14:00',
      endTime: '18:00',
      availabilityBlocks: defaultAvailability,
      leaveRequests: defaultLeave,
      existingShifts: defaultShifts,
    });
    expect(result.isConflict).toBe(false);
  });

  it('detects conflict with multi-day range unavailability exception', () => {
    const rangeAvailability = [
      {
        staff_id: staffId,
        type: 'date_specific',
        start_date: '2026-07-01',
        end_date: '2026-07-07', // Unavailable for a week
        start_time: '00:00:00',
        end_time: '23:59:59',
        is_available: false,
        notes: 'Family vacation exception block',
        is_active: true,
      },
    ];

    const result = checkRosterConflict({
      staffId,
      startDate: '2026-07-04', // Falls right in the middle
      startTime: '09:00',
      endTime: '17:00',
      availabilityBlocks: rangeAvailability,
      leaveRequests: [],
      existingShifts: [],
    });
    expect(result.isConflict).toBe(true);
    expect(result.type).toBe('unavailability');
    expect(result.reason).toContain('Family vacation exception block');
  });
});
