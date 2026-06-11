import { checklistsApi } from '@/api/checklists.api';
import { housesApi } from '@/api/houses.api';
import { rosterApi } from '@/api/roster.api';
import { staffApi } from '@/api/staff.api';
import { systemApi } from '@/api/system.api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      updateUser: vi.fn(),
    },
  },
}));

// Helper to create a mock query chain
const createMockQuery = (data: any = [], error: any = null) => {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    single: vi
      .fn()
      .mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    insert: vi.fn().mockResolvedValue({ data: null, error }),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue({ error }),
    then: vi.fn().mockImplementation((callback) => {
      return Promise.resolve({
        data,
        error,
        count: Array.isArray(data) ? data.length : 1,
      }).then(callback);
    }),
  };
  return query;
};

describe('API Layer Cleanup - New Features Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('staffApi', () => {
    it('listNames should return unique ordered staff names', async () => {
      const mockData = [
        { staff_name: 'Zoe' },
        { staff_name: 'Alice' },
        { staff_name: 'Alice' },
      ];
      vi.mocked(supabase.from).mockReturnValue(createMockQuery(mockData));

      const result = await staffApi.listNames();
      expect(result).toEqual(['Zoe', 'Alice']);
    });

    it('listAdmins should fetch staff with auth_user_id', async () => {
      const mockAdmins = [{ auth_user_id: 'auth1' }, { auth_user_id: 'auth2' }];
      vi.mocked(supabase.from).mockReturnValue(createMockQuery(mockAdmins));

      const result = await staffApi.listAdmins();
      expect(result).toEqual(mockAdmins);
      expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF);
    });
  });

  describe('systemApi', () => {
    it('auth.getAdminStatus should invoke edge function', async () => {
      const mockStatus = { user1: { email: 'test@example.com' } };
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await systemApi.auth.getAdminStatus();
      expect(result).toEqual(mockStatus);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'ic-admin-auth-status',
      );
    });

    it('notifications.subscribe should setup a channel', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn(() => mockChannel);
      (supabase.removeChannel as any) = vi.fn();

      const unsubscribe = systemApi.notifications.subscribe('user1', vi.fn());
      expect(supabase.channel).toHaveBeenCalled();

      unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('housesApi', () => {
    it('listStaffAssignmentsByStaff should return normalized house data', async () => {
      const mockAssignments = [
        {
          id: 'a1',
          house_id: 'h1',
          house: { id: 'h1', house_name: 'House 1', status: 'active' },
        },
      ];
      vi.mocked(supabase.from).mockReturnValue(
        createMockQuery(mockAssignments),
      );

      const result = await housesApi.listStaffAssignmentsByStaff('staff1');
      expect(result).toEqual([
        { id: 'h1', house_name: 'House 1', status: 'active', name: 'House 1' },
      ]);
    });

    it('finalizeSetup should update setup_step and status', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQuery({}));

      await housesApi.finalizeSetup('h1');
      expect(supabase.from).toHaveBeenCalledWith(TABLES.HOUSES);
    });
  });

  describe('rosterApi', () => {
    it('listApprovedLeaveForRollout should use correct date filters', async () => {
      const mockLeave = [
        { staff_id: 's1', start_date: '2026-06-01', end_date: '2026-06-07' },
      ];
      const mockQuery = createMockQuery(mockLeave);
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await rosterApi.listApprovedLeaveForRollout(
        '2026-06-01',
        '2026-06-30',
      );

      expect(mockQuery.gte).toHaveBeenCalledWith('end_date', '2026-06-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('start_date', '2026-06-30');
      expect(result).toEqual(mockLeave);
    });

    it('appendShiftAssignments should perform a simple insert', async () => {
      const mockAssignments = [{ shift_id: 's1', checklist_id: 'c1' }];
      vi.mocked(supabase.from).mockReturnValue(createMockQuery());

      await rosterApi.appendShiftAssignments(mockAssignments);
      expect(supabase.from).toHaveBeenCalledWith(
        TABLES.SHIFT_ASSIGNED_CHECKLISTS,
      );
    });

    it('updateShift should handle undefined updates gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQuery({}));

      // Should not throw ReferenceError or TypeError
      await expect(
        rosterApi.updateShift('shift-1', undefined),
      ).resolves.not.toThrow();
    });
  });
});
