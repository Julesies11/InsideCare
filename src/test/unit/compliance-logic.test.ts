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

describe('staffDetailsApi.compliance.listRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fall back to global active defaults when there are no house assignments', async () => {
    const mockFrom = vi.mocked(supabase.from);

    // Mock first call (house assignments) returning empty list
    const mockAssignmentsQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    // Mock second call (global defaults) returning list
    const mockDefaultsQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockDefaultsQuery.eq = vi.fn().mockImplementation((key, value) => {
      if (key === 'is_default_global') {
        return mockDefaultsQuery;
      }
      if (key === 'is_active') {
        return Promise.resolve({
          data: [
            { id: '1', compliance_name: 'NDIS Screen Check', is_active: true, is_default_global: true },
            { id: '2', compliance_name: 'Drivers License', is_active: true, is_default_global: true },
          ],
          error: null,
        });
      }
      return mockDefaultsQuery;
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === TABLES.HOUSE_STAFF_ASSIGNMENTS) return mockAssignmentsQuery;
      if (table === TABLES.COMPLIANCE_TYPES_MASTER) return mockDefaultsQuery;
      return {} as any;
    });

    const result = await staffDetailsApi.compliance.listRequired('staff-123');

    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_STAFF_ASSIGNMENTS);
    expect(mockFrom).toHaveBeenCalledWith(TABLES.COMPLIANCE_TYPES_MASTER);
    expect(result).toHaveLength(2);
    expect(result[0].compliance_name).toBe('NDIS Screen Check');
    expect(result[1].compliance_name).toBe('Drivers License');
  });

  it('should query house requirements and return unique active compliance types when house assignments exist', async () => {
    const mockFrom = vi.mocked(supabase.from);

    // Mock first call: assignments
    const mockAssignmentsQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({
        data: [{ house_id: 'house-1' }, { house_id: 'house-2' }],
        error: null,
      }),
    };

    // Mock second call: house compliance requirements
    const mockRequirementsQuery: any = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            compliance_type_id: 'type-1',
            compliance_type: { id: 'type-1', compliance_name: 'First Aid', is_active: true, is_default_global: false },
          },
          {
            compliance_type_id: 'type-2',
            compliance_type: { id: 'type-2', compliance_name: 'CPR Cert', is_active: true, is_default_global: false },
          },
          // Duplicate check
          {
            compliance_type_id: 'type-1',
            compliance_type: { id: 'type-1', compliance_name: 'First Aid', is_active: true, is_default_global: false },
          },
          // Inactive check
          {
            compliance_type_id: 'type-3',
            compliance_type: { id: 'type-3', compliance_name: 'Old Certificate', is_active: false, is_default_global: false },
          },
        ],
        error: null,
      }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === TABLES.HOUSE_STAFF_ASSIGNMENTS) return mockAssignmentsQuery;
      if (table === TABLES.HOUSE_COMPLIANCE_REQUIREMENTS) return mockRequirementsQuery;
      return {} as any;
    });

    const result = await staffDetailsApi.compliance.listRequired('staff-123');

    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_STAFF_ASSIGNMENTS);
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS);
    
    // Result should contain only 'First Aid' and 'CPR Cert', exactly 2 unique active records.
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['type-1', 'type-2']);
    expect(result.map(r => r.compliance_name)).toEqual(['First Aid', 'CPR Cert']);
  });
});

describe('staffDetailsApi.compliance.getSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compile a complete, sorted list of compliance requirements and completions', async () => {
    const mockFrom = vi.mocked(supabase.from);

    // 1. Mock assignments query
    const mockAssignmentsQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({
        data: [{ house_id: 'house-1' }],
        error: null,
      }),
    };

    // 2. Mock completed staff compliance records
    const mockComplianceQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          // Completed record for NDIS check
          { id: 'rec-1', compliance_type_id: 'type-global-ndis', compliance_name: 'NDIS Check', status: 'Complete', expiry_date: '2027-01-01', completion_date: '2026-01-01' },
          // Legacy record with null compliance_type_id matched by name
          { id: 'rec-2', compliance_type_id: null, compliance_name: 'First Aid Cert', status: 'Expiring', expiry_date: '2026-07-01', completion_date: '2025-07-01' },
        ],
        error: null,
      }),
    };

    // 3. Mock global defaults query
    const mockDefaultsQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockDefaultsQuery.eq = vi.fn().mockImplementation((key, value) => {
      if (key === 'is_default_global') {
        return mockDefaultsQuery;
      }
      if (key === 'is_active') {
        return Promise.resolve({
          data: [
            { id: 'type-global-ndis', compliance_name: 'NDIS Check', description: 'NDIS Screen', is_default_global: true },
          ],
          error: null,
        });
      }
      return mockDefaultsQuery;
    });

    // 4. Mock house compliance requirements query
    const mockHouseRequirementsQuery: any = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            compliance_type_id: 'type-house-fa',
            compliance_type: { id: 'type-house-fa', compliance_name: 'First Aid Cert', description: 'First Aid Course', is_active: true, is_default_global: false },
          },
          {
            compliance_type_id: 'type-house-other',
            compliance_type: { id: 'type-house-other', compliance_name: 'Manual Handling', description: 'Manual Handling Course', is_active: true, is_default_global: false },
          },
        ],
        error: null,
      }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === TABLES.HOUSE_STAFF_ASSIGNMENTS) return mockAssignmentsQuery;
      if (table === TABLES.STAFF_COMPLIANCE) return mockComplianceQuery;
      if (table === TABLES.COMPLIANCE_TYPES_MASTER) return mockDefaultsQuery;
      if (table === TABLES.HOUSE_COMPLIANCE_REQUIREMENTS) return mockHouseRequirementsQuery;
      return {} as any;
    });

    const result = await staffDetailsApi.compliance.getSummary('staff-123');

    // Expected Output:
    // 3 requirements: NDIS Check (global), First Aid Cert (house), Manual Handling (house)
    // Sorted alphabetically: First Aid Cert -> Manual Handling -> NDIS Check
    expect(result).toHaveLength(3);
    
    // First Aid Cert (Matched by name fallback for legacy row, since compliance_type_id in record is null)
    expect(result[0]).toEqual({
      compliance_type_id: 'type-house-fa',
      compliance_name: 'First Aid Cert',
      compliance_desc: 'First Aid Course',
      is_default_global: false,
      record_id: 'rec-2',
      record_status: 'Expiring',
      expiry_date: '2026-07-01',
      completion_date: '2025-07-01',
    });

    // Manual Handling (Incomplete, no record)
    expect(result[1]).toEqual({
      compliance_type_id: 'type-house-other',
      compliance_name: 'Manual Handling',
      compliance_desc: 'Manual Handling Course',
      is_default_global: false,
      record_id: null,
      record_status: null,
      expiry_date: null,
      completion_date: null,
    });

    // NDIS Check (Matched by compliance_type_id)
    expect(result[2]).toEqual({
      compliance_type_id: 'type-global-ndis',
      compliance_name: 'NDIS Check',
      compliance_desc: 'NDIS Screen',
      is_default_global: true,
      record_id: 'rec-1',
      record_status: 'Complete',
      expiry_date: '2027-01-01',
      completion_date: '2026-01-01',
    });
  });
});
