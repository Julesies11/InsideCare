import { onboardingApi } from './onboarding.api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Onboarding API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('master', () => {
    it('should list active onboarding items', async () => {
      const mockData = [{ id: '1', item_name: 'Task 1', is_active: true }];
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await onboardingApi.master.list();
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('ic_onboarding_items_master');
    });

    it('should upsert onboarding items', async () => {
      const mockData = { id: '1', item_name: 'Task 1' };
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      const result = await onboardingApi.master.upsert(mockData);
      expect(result).toEqual([mockData]);
    });
  });

  describe('staff', () => {
    it('should list staff onboarding records', async () => {
      const mockData = [{ id: '1', staff_id: 'staff-123', is_complete: true }];
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await onboardingApi.staff.list('staff-123');
      expect(result).toEqual(mockData);
    });

    it('should bulk delete records', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await onboardingApi.staff.bulkDelete(['id-1', 'id-2']);
      expect(result).toBe(true);
    });
  });
});
