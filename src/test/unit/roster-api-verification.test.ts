import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rosterApi } from '@/api/roster.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { ROSTER_VIEWS, CALENDAR_VIEWS } from '@/config/query-views';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Roster API - Unit Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listShifts', () => {
    it('should declare and use eventQuery safely to avoid ReferenceError', async () => {
      const mockShifts = [{ id: 'shift1', staff_id: 'staff1' }];
      
      // Setup mock chain for shifts
      const shiftQueryMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === TABLES.STAFF_SHIFTS) return shiftQueryMock as any;
        return { select: vi.fn().mockReturnThis() } as any;
      });

      // Call with includeEvents: false (this would have triggered ReferenceError if not declared)
      const result = await rosterApi.listShifts({
        staffId: 'staff1',
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        includeEvents: false
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shift1');
      expect(result[0].entry_type).toBe('shift');
    });

    it('should include events when includeEvents is true', async () => {
      const mockShifts = [{ id: 'shift1', staff_id: 'staff1' }];
      const mockEvents = [{ id: 'event1', title: 'Meeting', event_date: '2026-06-02', type: { event_type_name: 'Training', color: 'red' } }];

      const createMockQuery = (data: any) => {
        const query: any = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((onFullfilled) => {
             return Promise.resolve({ data, error: null }).then(onFullfilled);
          }),
        };
        // Also mock as a promise for Promise.all
        query.then = (onFullfilled: any) => Promise.resolve({ data, error: null }).then(onFullfilled);
        return query;
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === TABLES.STAFF_SHIFTS) return createMockQuery(mockShifts);
        if (table === TABLES.HOUSE_CALENDAR_EVENTS) return createMockQuery(mockEvents);
        return createMockQuery([]);
      });

      const result = await rosterApi.listShifts({
        staffId: 'staff1',
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        includeEvents: true
      });

      expect(result).toHaveLength(2);
      expect(result.find(r => r.entry_type === 'shift')).toBeDefined();
      expect(result.find(r => r.entry_type === 'event')).toBeDefined();
    });
  });

  describe('getStaffRoster', () => {
    it('should use standardized views and handle nested data correctly', async () => {
      const mockShifts = [{ id: 's1', house_info: { house_name: 'House A' }, participants: [] }];
      const mockEvents = [{ id: 'e1', title: 'Event A', event_date: '2026-06-01', type: { event_type_name: 'Training', color: 'red' } }];
      const mockLeave = [{ id: 'l1', start_date: '2026-06-02', leave_type: { leave_type_name: 'Sick' } }];
      const mockTimesheets = [{ shift_id: 's1' }];
      const mockNotes = [];

      const createMockQuery = (data: any) => {
        const query: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((onFullfilled) => {
             return Promise.resolve({ data, error: null }).then(onFullfilled);
          }),
        };
        query.then = (onFullfilled: any) => Promise.resolve({ data, error: null }).then(onFullfilled);
        return query;
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === TABLES.STAFF_SHIFTS) return createMockQuery(mockShifts);
        if (table === TABLES.HOUSE_CALENDAR_EVENTS) return createMockQuery(mockEvents);
        if (table === TABLES.LEAVE_REQUESTS) return createMockQuery(mockLeave);
        if (table === TABLES.TIMESHEETS) return createMockQuery(mockTimesheets);
        if (table === TABLES.SHIFT_NOTES) return createMockQuery(mockNotes);
        return createMockQuery([]);
      });

      const result = await rosterApi.getStaffRoster('staff1');

      expect(result).toHaveLength(3); 
      const shift = result.find(r => r.entry_type === 'shift');
      expect(shift.house.house_name).toBe('House A');
      expect(shift.has_timesheet).toBe(true);
    });
  });
});
