import { staffDetailsApi } from '@/api/staff-details.api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to create a mock query chain
const createMockQuery = (error: any = null) => {
  const query: any = {
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'rec-1' }], error }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
    delete: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ error }),
  };
  return query;
};

describe('staffDetailsApi.syncDetails Regression Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize empty date strings to null for Training records', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      training: {
        toAdd: [
          {
            title: 'Empty Date Training',
            category: 'Safety',
            date_completed: '', // Empty string that caused the error
            expiry_date: '',
          },
        ],
        toUpdate: [],
        toDelete: [],
      },
      staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    // Verify Training Add normalization
    expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF_TRAINING);
    const insertCall = mockQuery.insert.mock.calls[0][0];
    expect(insertCall.date_completed).toBeNull();
    expect(insertCall.expiry_date).toBeNull();
  });

  it('should normalize empty date strings to null for Compliance records', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      training: { toAdd: [], toUpdate: [], toDelete: [] },
      staffCompliance: {
        toAdd: [
          {
            compliance_type_id: 'type-1',
            compliance_name: 'Empty Date Compliance',
            status: 'Current',
            expiry_date: '', // Empty string that caused the error
          },
        ],
        toUpdate: [],
        toDelete: [],
      },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    // Verify Compliance Add normalization
    expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF_COMPLIANCE);
    const upsertCall = mockQuery.upsert.mock.calls[0][0];
    expect(upsertCall.expiry_date).toBeNull();
  });

  it('should preserve valid date strings', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      training: {
        toAdd: [
          {
            title: 'Valid Date Training',
            category: 'Safety',
            date_completed: '2026-05-31',
            expiry_date: '2027-05-31',
          },
        ],
        toUpdate: [],
        toDelete: [],
      },
      staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    const insertCall = mockQuery.insert.mock.calls[0][0];
    expect(insertCall.date_completed).toBe('2026-05-31');
    expect(insertCall.expiry_date).toBe('2027-05-31');
  });

  it('should strip tempId, house_name, and house from House Assignments Add payload', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      houseAssignments: {
        toAdd: [
          {
            tempId: 'temp-123',
            house_id: 'house-123',
            house_name: 'Test House',
            house: { id: 'house-123', house_name: 'Test House' },
            is_primary: true,
            start_date: '2026-07-24',
          },
        ],
        toUpdate: [],
        toDelete: [],
      },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    expect(supabase.from).toHaveBeenCalledWith(TABLES.HOUSE_STAFF_ASSIGNMENTS);
    const insertCall = mockQuery.insert.mock.calls[0][0];
    expect(insertCall).toEqual([
      {
        house_id: 'house-123',
        is_primary: true,
        staff_id: 'staff-123',
        start_date: '2026-07-24',
        end_date: null,
      },
    ]);
  });
});
