import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffDetailsApi } from '@/api/staff-details.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to create a mock query chain
const createMockQuery = (error: any = null) => {
  const query: any = {
    insert: vi.fn().mockResolvedValue({ error }),
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
        toAdd: [{
          title: 'Empty Date Training',
          category: 'Safety',
          date_completed: '', // Empty string that caused the error
          expiry_date: '',
        }],
        toUpdate: [],
        toDelete: [],
      },
      staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    // Verify Training Add normalization
    expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF_TRAINING);
    const insertCall = mockQuery.insert.mock.calls[0][0];
    // It's now a single object in a loop, not an array
    expect(insertCall.date_completed).toBeNull();
    expect(insertCall.expiry_date).toBeNull();
  });

  it('should normalize empty date strings to null for Compliance records', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      training: { toAdd: [], toUpdate: [], toDelete: [] },
      staffCompliance: {
        toAdd: [{
          compliance_name: 'Empty Date Compliance',
          status: 'Current',
          expiry_date: '', // Empty string that caused the error
        }],
        toUpdate: [],
        toDelete: [],
      },
    };

    await staffDetailsApi.syncDetails('staff-123', pendingChanges);

    // Verify Compliance Add normalization
    expect(supabase.from).toHaveBeenCalledWith(TABLES.STAFF_COMPLIANCE);
    const insertCall = mockQuery.insert.mock.calls[0][0];
    // Compliance is still bulk-inserted as an array
    expect(insertCall[0].expiry_date).toBeNull();
  });

  it('should preserve valid date strings', async () => {
    const mockQuery = createMockQuery();
    vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges: any = {
      training: {
        toAdd: [{
          title: 'Valid Date Training',
          category: 'Safety',
          date_completed: '2026-05-31',
          expiry_date: '2027-05-31',
        }],
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
});
