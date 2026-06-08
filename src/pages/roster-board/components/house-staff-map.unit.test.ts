/**
 * Unit tests for the houseStaffMap memoization logic introduced in StaffRosterCalendar.
 *
 * We test the pure mapping logic in isolation — given a set of houses and staff with
 * house_assignments, the map should correctly compute which staff belong to each house
 * based on active assignment dates.
 */
import { describe, it, expect } from 'vitest';

// ─── Pure helper that mirrors the useMemo logic in StaffRosterCalendar ────────
function buildHouseStaffMap(
  houses: Array<{ id: string; house_name: string }>,
  staff: Array<{ id: string; house_assignments?: Array<{ house_id?: string; end_date?: string | null }> }>
): Map<string, typeof staff> {
  const todayStr = new Date().toISOString().split('T')[0];
  const map = new Map<string, typeof staff>();
  houses.forEach(house => {
    const assigned = staff.filter(s => {
      const assignments = s.house_assignments || [];
      return assignments.some(a => {
        const assignmentHouseId = (a.house_id || '').toLowerCase();
        const isTargetHouse = assignmentHouseId === house.id.toLowerCase();
        const isAssignmentActive = !a.end_date || a.end_date >= todayStr;
        return isTargetHouse && isAssignmentActive;
      });
    });
    map.set(house.id, assigned);
  });
  return map;
}
// ─────────────────────────────────────────────────────────────────────────────

const FUTURE_DATE = '2099-12-31';
const PAST_DATE = '2000-01-01';

const house1 = { id: 'house-1', house_name: 'Sunrise House' };
const house2 = { id: 'house-2', house_name: 'Moonlight House' };

const staffA = {
  id: 'staff-a',
  house_assignments: [{ house_id: 'house-1', end_date: null }],
};
const staffB = {
  id: 'staff-b',
  house_assignments: [{ house_id: 'house-1', end_date: FUTURE_DATE }],
};
const staffC = {
  id: 'staff-c',
  house_assignments: [{ house_id: 'house-1', end_date: PAST_DATE }],
};
const staffD = {
  id: 'staff-d',
  house_assignments: [{ house_id: 'house-2', end_date: null }],
};
const staffE = {
  id: 'staff-e',
  house_assignments: [],
};
const staffMulti = {
  id: 'staff-multi',
  house_assignments: [
    { house_id: 'house-1', end_date: null },
    { house_id: 'house-2', end_date: null },
  ],
};

describe('houseStaffMap memoization logic', () => {
  it('maps active staff with no end_date to their house', () => {
    const map = buildHouseStaffMap([house1], [staffA]);
    expect(map.get('house-1')).toHaveLength(1);
    expect(map.get('house-1')![0].id).toBe('staff-a');
  });

  it('includes staff whose end_date is in the future', () => {
    const map = buildHouseStaffMap([house1], [staffB]);
    expect(map.get('house-1')).toHaveLength(1);
  });

  it('excludes staff whose end_date is in the past', () => {
    const map = buildHouseStaffMap([house1], [staffC]);
    expect(map.get('house-1')).toHaveLength(0);
  });

  it('correctly separates staff assigned to different houses', () => {
    const map = buildHouseStaffMap([house1, house2], [staffA, staffD]);
    expect(map.get('house-1')).toHaveLength(1);
    expect(map.get('house-1')![0].id).toBe('staff-a');
    expect(map.get('house-2')).toHaveLength(1);
    expect(map.get('house-2')![0].id).toBe('staff-d');
  });

  it('assigns staff with multiple house assignments to all their houses', () => {
    const map = buildHouseStaffMap([house1, house2], [staffMulti]);
    expect(map.get('house-1')).toHaveLength(1);
    expect(map.get('house-2')).toHaveLength(1);
  });

  it('excludes staff with no house assignments from all houses', () => {
    const map = buildHouseStaffMap([house1], [staffE]);
    expect(map.get('house-1')).toHaveLength(0);
  });

  it('returns an empty array for a house with no assigned staff', () => {
    const map = buildHouseStaffMap([house2], [staffA]); // staffA is in house-1, not house-2
    expect(map.get('house-2')).toHaveLength(0);
  });

  it('handles an empty houses array', () => {
    const map = buildHouseStaffMap([], [staffA]);
    expect(map.size).toBe(0);
  });

  it('handles an empty staff array', () => {
    const map = buildHouseStaffMap([house1], []);
    expect(map.get('house-1')).toHaveLength(0);
  });

  it('is case-insensitive for house ID matching', () => {
    const staffUpperCase = {
      id: 'staff-upper',
      house_assignments: [{ house_id: 'HOUSE-1', end_date: null }],
    };
    const map = buildHouseStaffMap([house1], [staffUpperCase]);
    expect(map.get('house-1')).toHaveLength(1);
  });

  it('mixes active and expired assignments correctly', () => {
    const map = buildHouseStaffMap([house1], [staffA, staffB, staffC]);
    // staffA (no end) + staffB (future) = 2 active; staffC (past) excluded
    expect(map.get('house-1')).toHaveLength(2);
    const ids = map.get('house-1')!.map(s => s.id);
    expect(ids).toContain('staff-a');
    expect(ids).toContain('staff-b');
    expect(ids).not.toContain('staff-c');
  });
});
