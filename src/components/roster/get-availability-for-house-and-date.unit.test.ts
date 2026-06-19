import { describe, expect, it } from 'vitest';

// Mirroring the exact logic of getAvailabilityForHouseAndDate from shift-calendar.tsx
function getAvailabilityForHouseAndDate({
  date,
  houseStaffList,
  houseId,
  showAvailability,
  staffId,
  availabilityBlocks,
}: {
  date: Date;
  houseStaffList: Array<{ id: string }>;
  houseId: string;
  showAvailability: boolean;
  staffId: string;
  availabilityBlocks: any[];
}) {
  if (!showAvailability) return [];
  if (houseId === 'unassigned' && (!staffId || staffId === 'all')) return [];

  // Local formatting helper (mirrors date-fns format)
  const formatLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dateStr = formatLocal(date);
  const dayOfWeek = date.getDay();

  // Determine target staff IDs to check
  const targetStaffIds =
    staffId && staffId !== 'all'
      ? [staffId]
      : houseStaffList.map((s) => s.id);

  if (targetStaffIds.length === 0) return [];

  const staffBlocks = availabilityBlocks.filter(
    (b) => targetStaffIds.includes(b.staff_id) && b.is_active !== false,
  );

  // Filter blocks active on this day
  const dateSpecific = staffBlocks.filter(
    (b) =>
      b.type === 'date_specific' &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date,
  );

  const recurring = staffBlocks.filter(
    (b) => b.type === 'recurring' && b.day_of_week === dayOfWeek,
  );

  // Group by staff_id, date_specific overrides take precedence over recurring for each staff member
  const result: any[] = [];
  targetStaffIds.forEach((sId) => {
    const sDateSpecific = dateSpecific.filter((b) => b.staff_id === sId);
    if (sDateSpecific.length > 0) {
      result.push(...sDateSpecific);
    } else {
      const sRecurring = recurring.filter((b) => b.staff_id === sId);
      result.push(...sRecurring);
    }
  });

  return result;
}

describe('getAvailabilityForHouseAndDate logic', () => {
  const staff1 = { id: 'staff-1' };
  const staff2 = { id: 'staff-2' };
  const houseStaffList = [staff1, staff2];

  const dateWednesday = new Date('2026-04-15T00:00:00'); // Wednesday (getDay = 3)

  const mockBlocks = [
    // Recurring block for staff-1 (Wednesday - 3)
    {
      id: 'block-1',
      staff_id: 'staff-1',
      type: 'recurring',
      day_of_week: 3,
      is_available: false,
      notes: 'Doctor appointment',
      is_active: true,
    },
    // Recurring block for staff-2 (Wednesday - 3)
    {
      id: 'block-2',
      staff_id: 'staff-2',
      type: 'recurring',
      day_of_week: 3,
      is_available: true,
      notes: 'Preferred Wednesday shift',
      is_active: true,
    },
    // Inactive block (Wednesday - 3)
    {
      id: 'block-3',
      staff_id: 'staff-1',
      type: 'recurring',
      day_of_week: 3,
      is_available: true,
      is_active: false,
    },
    // Date specific override for staff-1 (Wednesday April 15, 2026)
    {
      id: 'block-override',
      staff_id: 'staff-1',
      type: 'date_specific',
      start_date: '2026-04-15',
      end_date: '2026-04-15',
      is_available: true,
      notes: 'Available today only override',
      is_active: true,
    },
  ];

  it('returns empty list if showAvailability is false', () => {
    const result = getAvailabilityForHouseAndDate({
      date: dateWednesday,
      houseStaffList,
      houseId: 'house-1',
      showAvailability: false,
      staffId: 'all',
      availabilityBlocks: mockBlocks,
    });
    expect(result).toEqual([]);
  });

  it('returns empty list for unassigned house when staffId is all', () => {
    const result = getAvailabilityForHouseAndDate({
      date: dateWednesday,
      houseStaffList,
      houseId: 'unassigned',
      showAvailability: true,
      staffId: 'all',
      availabilityBlocks: mockBlocks,
    });
    expect(result).toEqual([]);
  });

  it('returns availability for all staff members assigned to the house if staffId is all', () => {
    // For staff-2: no override, should return recurring 'block-2'
    // For staff-1: override 'block-override' should take precedence over recurring 'block-1'
    const result = getAvailabilityForHouseAndDate({
      date: dateWednesday,
      houseStaffList,
      houseId: 'house-1',
      showAvailability: true,
      staffId: 'all',
      availabilityBlocks: mockBlocks,
    });

    expect(result).toHaveLength(2);
    const ids = result.map((b) => b.id);
    expect(ids).toContain('block-override');
    expect(ids).toContain('block-2');
    expect(ids).not.toContain('block-1'); // overridden
    expect(ids).not.toContain('block-3'); // inactive
  });

  it('returns availability only for filtered staffId if set to specific staff', () => {
    const result = getAvailabilityForHouseAndDate({
      date: dateWednesday,
      houseStaffList,
      houseId: 'house-1',
      showAvailability: true,
      staffId: 'staff-2',
      availabilityBlocks: mockBlocks,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('block-2');
  });

  it('correctly filters for day of week for recurring blocks if no overrides', () => {
    const dateThursday = new Date('2026-04-16T00:00:00'); // Thursday (getDay = 4)
    const result = getAvailabilityForHouseAndDate({
      date: dateThursday,
      houseStaffList,
      houseId: 'house-1',
      showAvailability: true,
      staffId: 'all',
      availabilityBlocks: mockBlocks,
    });

    expect(result).toHaveLength(0); // no Thursday recurring blocks
  });
});
