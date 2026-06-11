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

describe('staffDetailsApi.compliance.listRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all active master compliance requirements', async () => {
    const mockFrom = vi.mocked(supabase.from);

    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: '1', compliance_name: 'NDIS Screen Check', is_active: true },
          { id: '2', compliance_name: 'Drivers License', is_active: true },
        ],
        error: null,
      }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === TABLES.COMPLIANCE_TYPES_MASTER) return mockQuery;
      return {} as any;
    });

    const result = await staffDetailsApi.compliance.listRequired('staff-123');

    expect(mockFrom).toHaveBeenCalledWith(TABLES.COMPLIANCE_TYPES_MASTER);
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(result).toHaveLength(2);
    expect(result[0].compliance_name).toBe('NDIS Screen Check');
    expect(result[1].compliance_name).toBe('Drivers License');
  });
});
