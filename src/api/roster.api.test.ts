import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rosterApi } from './roster.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('rosterApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listStaffShiftsPaginated', () => {
    it('calls supabase with correct parameters for pagination', async () => {
      const mockShifts = [{ id: '1', start_date: '2026-06-02' }];
      const mockCount = 100;
      
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({ data: mockShifts, error: null, count: mockCount });
      const inMock = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === TABLES.STAFF_SHIFTS) {
          return {
            select: selectMock,
            eq: eqMock,
            order: orderMock,
            range: rangeMock,
          };
        }
        if (table === TABLES.TIMESHEETS || table === TABLES.SHIFT_NOTES) {
          return {
            select: vi.fn().mockReturnThis(),
            in: inMock,
          };
        }
      });

      const params = {
        staffId: 'staff-1',
        pageIndex: 1,
        pageSize: 50,
      };

      const result = await rosterApi.listStaffShiftsPaginated(params);

      expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF_SHIFTS);
      expect(eqMock).toHaveBeenCalledWith('staff_id', 'staff-1');
      expect(rangeMock).toHaveBeenCalledWith(50, 99); // Page 1, Size 50 -> range(50, 99)
      expect(result.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: '1' })
      ]));
      expect(result.count).toBe(mockCount);
    });

    it('applies search filters when provided', async () => {
      const orMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === TABLES.STAFF_SHIFTS) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: orMock,
            order: vi.fn().mockReturnThis(),
            range: rangeMock,
          };
        }
        return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [] }) };
      });

      await rosterApi.listStaffShiftsPaginated({
        staffId: 'staff-1',
        search: 'Morning',
      });

      expect(orMock).toHaveBeenCalledWith(expect.stringContaining('shift_template.ilike.%Morning%'));
    });
  });
});
