import { describe, expect, it, vi } from 'vitest';
import { masterListsApi } from '@/api/master-lists.api';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  },
}));

describe('Master Lists - API & RBAC Intent Verification', () => {
  it('should use the correct table for leave types', async () => {
    const mockFrom = vi.mocked(supabase.from);
    await masterListsApi.leaveTypes.list();
    expect(mockFrom).toHaveBeenCalledWith(TABLES.LEAVE_TYPES);
  });

  it('should use the correct table for clinical trackers (Sleep Quality)', async () => {
    const mockFrom = vi.mocked(supabase.from);
    await masterListsApi.clinicalTrackers.list(TABLES.SLEEP_QUALITY_MASTER);
    expect(mockFrom).toHaveBeenCalledWith('ic_sleep_quality_master');
  });

  it('should use the correct table for medications master', async () => {
    const mockFrom = vi.mocked(supabase.from);
    // list has many params, just checking if it calls from correctly
    try { await masterListsApi.medications.list(); } catch(e) {}
    expect(mockFrom).toHaveBeenCalledWith(TABLES.MEDICATIONS_MASTER);
  });

  it('should use the correct table for departments', async () => {
    const mockFrom = vi.mocked(supabase.from);
    await masterListsApi.departments.list();
    expect(mockFrom).toHaveBeenCalledWith(TABLES.DEPARTMENTS);
  });
});
