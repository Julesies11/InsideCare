import { describe, it, expect, vi } from 'vitest';
import { participantDetailsApi } from '@/api/participant-details.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Participant Details API - Unit Review', () => {
  it('should list medications for a specific participant', async () => {
    const mockData = [{ id: '1', medication_id: 'med1' }];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any);

    const result = await participantDetailsApi.medications.list('p1');
    
    expect(supabase.from).toHaveBeenCalledWith(TABLES.PARTICIPANT_MEDICATIONS);
    expect(result).toEqual(mockData);
  });

  it('should upsert goals correctly', async () => {
    const mockGoal = { participant_id: 'p1', goal_type: 'Short Term' };
    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [mockGoal], error: null }),
    } as any);

    const result = await participantDetailsApi.goals.upsert(mockGoal as any);
    
    expect(supabase.from).toHaveBeenCalledWith(TABLES.PARTICIPANT_GOALS);
    expect(result).toEqual([mockGoal]);
  });

  it('should handle errors gracefully in contacts list', async () => {
    const mockError = { message: 'DB Error' };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any);

    await expect(participantDetailsApi.contacts.list('p1')).rejects.toThrow('DB Error');
  });
});
