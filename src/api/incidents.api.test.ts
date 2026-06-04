import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentsApi } from './incidents.api';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Incidents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists incidents with correct filters', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0 });
    
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      order: vi.fn().mockReturnThis(),
      range: mockRange,
    });

    await incidentsApi.list({ participantId: 'p1' });

    expect(supabase.from).toHaveBeenCalledWith('ic_incident_reports');
    expect(mockEq).toHaveBeenCalledWith('involved_participant_id', 'p1');
  });

  it('creates an incident report', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const reportData = {
      involved_participant_id: 'p1',
      summary: 'Test summary',
      details: 'Test details',
      reported_by: 's1',
      incident_date: new Date().toISOString(),
    };

    const result = await incidentsApi.create(reportData as any);

    expect(mockInsert).toHaveBeenCalledWith(reportData);
    expect(result.id).toBe('new-id');
  });
});
