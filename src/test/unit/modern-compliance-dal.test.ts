import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffDetailsApi } from '@/api/staff-details.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Modern Compliance DAL Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncDetails (Defensive & No-Legacy Check)', () => {
    it('should NOT include compliance_name in the upsert payload', async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'new-id' }], error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === TABLES.STAFF_COMPLIANCE) {
          return { upsert: mockUpsert };
        }
        return { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      });

      const pending = {
        documents: { toAdd: [], toDelete: [] },
        training: { toAdd: [], toUpdate: [], toDelete: [] },
        staffCompliance: {
          toAdd: [{
            compliance_type_id: 'type-123',
            compliance_name: 'SHOULD BE REMOVED', // This was the old way
            status: 'complete',
            expiry_date: '2026-12-31',
            document_number: 'DOC123',
            comments: 'Test comment'
          }],
          toUpdate: [],
          toDelete: []
        }
      } as any;

      await staffDetailsApi.syncDetails('staff-123', pending);

      // Verify the payload sent to Supabase
      const call = mockUpsert.mock.calls[0];
      const payload = call[0];

      expect(payload).not.toHaveProperty('compliance_name');
      expect(payload.compliance_type_id).toBe('type-123');
      expect(payload.staff_id).toBe('staff-123');
    });

    it('should block upserts if compliance_name is missing', async () => {
      const pending = {
        documents: { toAdd: [], toDelete: [] },
        training: { toAdd: [], toUpdate: [], toDelete: [] },
        staffCompliance: {
          toAdd: [{
            compliance_type_id: 'type-123',
            // compliance_name is missing
            status: 'complete'
          }],
          toUpdate: [],
          toDelete: []
        }
      } as any;

      await expect(staffDetailsApi.syncDetails('staff-123', pending))
        .rejects.toThrow(/Compliance Add: Missing name/);
    });
  });

  describe('getSummary (Relational Resolution)', () => {
    it('should fetch master types and map to actual records', async () => {
      const mockMasterTypes = [
        { id: 'type-1', compliance_name: 'Requirement A', is_active: true }
      ];
      const mockActualRecords = [
        { id: 'rec-1', compliance_type_id: 'type-1', status: 'complete' }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === TABLES.COMPLIANCE_TYPES_MASTER) {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: mockMasterTypes, error: null }) };
        }
        if (table === TABLES.STAFF_COMPLIANCE) {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: mockActualRecords, error: null }) };
        }
        return {};
      });

      const summary = await staffDetailsApi.compliance.getSummary('staff-123');
      
      expect(summary).toHaveLength(1);
      expect(summary[0].compliance_name).toBe('Requirement A');
      expect(summary[0].record_id).toBe('rec-1');
    });
  });
});
