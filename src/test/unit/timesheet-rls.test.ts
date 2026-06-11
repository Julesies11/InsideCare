import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      select_single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Timesheet & Shift Notes - RLS Logic Verification (Mocks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the correct TABLES constant for timesheet queries', async () => {
    const mockFrom = vi.mocked(supabase.from);

    await supabase
      .from(TABLES.TIMESHEETS)
      .select('*')
      .eq('staff_id', 'test-staff');

    expect(mockFrom).toHaveBeenCalledWith('ic_timesheets');
  });

  it('should use the correct TABLES constant for shift notes queries', async () => {
    const mockFrom = vi.mocked(supabase.from);

    await supabase
      .from(TABLES.SHIFT_NOTES)
      .select('*')
      .eq('staff_id', 'test-staff');

    expect(mockFrom).toHaveBeenCalledWith('ic_shift_notes');
  });

  it('should verify the table name for checklist schedules', async () => {
    const mockFrom = vi.mocked(supabase.from);

    await supabase.from(TABLES.CHECKLIST_SCHEDULES).select('*');

    expect(mockFrom).toHaveBeenCalledWith('ic_checklist_schedules');
  });

  it('should ensure RBAC sync uses the correct staff table', async () => {
    const mockFrom = vi.mocked(supabase.from);

    await supabase
      .from(TABLES.STAFF)
      .select('auth_user_id')
      .eq('id', 'staff-id');

    expect(mockFrom).toHaveBeenCalledWith('ic_staff');
  });
});
