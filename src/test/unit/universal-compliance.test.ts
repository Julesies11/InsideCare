import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffDetailsApi } from '@/api/staff-details.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Universal Compliance Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('staffDetailsApi.compliance.listRequired', () => {
    it('should fetch all active master types regardless of house assignment', async () => {
      const mockData = [
        { id: '1', compliance_name: 'Global Req 1', is_active: true },
        { id: '2', compliance_name: 'Global Req 2', is_active: true }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await staffDetailsApi.compliance.listRequired('any-staff-id');

      expect(result).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith(TABLES.COMPLIANCE_TYPES_MASTER);
      // Verify no house-specific queries are made
      expect(supabase.from).not.toHaveBeenCalledWith(TABLES.HOUSE_STAFF_ASSIGNMENTS);
    });
  });

  describe('staffDetailsApi.compliance.getSummary', () => {
    it('should reconcile all master types with existing records', async () => {
      const mockMasterTypes = [
        { id: 'type-1', compliance_name: 'Req 1', is_active: true },
        { id: 'type-2', compliance_name: 'Req 2', is_active: true }
      ];
      const mockExistingRecords = [
        { compliance_type_id: 'type-1', status: 'complete', expiry_date: '2099-01-01' }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === TABLES.COMPLIANCE_TYPES_MASTER) {
          return { select: () => ({ eq: () => Promise.resolve({ data: mockMasterTypes, error: null }) }) };
        }
        if (table === TABLES.STAFF_COMPLIANCE) {
          return { select: () => ({ eq: () => Promise.resolve({ data: mockExistingRecords, error: null }) }) };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const result = await staffDetailsApi.compliance.getSummary('staff-id');

      expect(result).toHaveLength(2);
      const req1 = result.find(r => r.compliance_type_id === 'type-1');
      const req2 = result.find(r => r.compliance_type_id === 'type-2');

      expect(req1?.record_status).toBe('complete');
      expect(req2?.record_status).toBeNull(); // Missing record handled by frontend mapping
    });
  });
});
