import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participantsApi } from './participants.api';
import { supabase } from '@/lib/supabase';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        order: vi.fn(() => ({})),
      })),
    })),
  },
}));

describe('participantsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has a listByHouse method', async () => {
    const mockParticipants = [{ id: '1', participant_name: 'John' }];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockParticipants, error: null });
    const mockEqStatus = vi.fn(() => ({ order: mockOrder }));
    const mockEqHouse = vi.fn(() => ({ eq: mockEqStatus, order: mockOrder }));
    const mockSelect = vi.fn(() => ({ eq: mockEqHouse }));
    
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const result = await participantsApi.listByHouse('house-1', 'active');

    expect(mockEqHouse).toHaveBeenCalledWith('house_id', 'house-1');
    expect(mockEqStatus).toHaveBeenCalledWith('status', 'active');
    expect(result[0].name).toBe('John');
  });
});
