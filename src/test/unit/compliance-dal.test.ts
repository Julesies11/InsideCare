import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complianceApi } from '@/api/compliance.api';
import { staffDetailsApi } from '@/api/staff-details.api';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Compliance DAL & API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('complianceApi.idDocumentTypes', () => {
    it('should list active ID document types', async () => {
      const mockData = [{ id: 'passport', name: 'Passport', is_active: true }];
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await complianceApi.idDocumentTypes.list();
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('ic_id_document_types');
    });

    it('should upsert ID document types', async () => {
      const mockData = { id: 'passport', name: 'Passport' };
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      const result = await complianceApi.idDocumentTypes.upsert(mockData);
      expect(result).toEqual([mockData]);
    });
  });

  describe('staffDetailsApi.compliance.getSummary', () => {
    it('should fetch compliance summary from master types', async () => {
      // Mocking the two parallel calls in getSummary
      // 1. Actual Records (empty)
      // 2. Master Types
      const mockMasterTypes = [
        { id: '1', compliance_name: 'Check 1', description: 'Desc 1', attachment_applicable: true, expiry_date_applicable: true }
      ];

      const fromSpy = vi.spyOn(supabase, 'from');
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'ic_staff_compliance') {
            return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
        }
        if (table === 'ic_compliance_types_master') {
            return { select: () => ({ eq: () => Promise.resolve({ data: mockMasterTypes, error: null }) }) };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const result = await staffDetailsApi.compliance.getSummary('staff-123');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        compliance_name: 'Check 1',
        attachment_applicable: true
      });
    });
  });
});
