import { housesApi } from '@/api/houses.api';
import { participantDetailsApi } from '@/api/participant-details.api';
import { rosterApi } from '@/api/roster.api';
import { staffDetailsApi } from '@/api/staff-details.api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: 'test' }, error: null }),
      })),
    },
  },
}));

// Helper to create a mock query chain
const createMockQuery = (data: any = [], error: any = null) => {
  const query: any = {
    insert: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    in: vi.fn().mockResolvedValue({ error }),
    delete: vi.fn().mockResolvedValue({ error }),
  };
  return query;
};

describe('CRUD Rigor - Payload Validation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Roster CRUD Rigor', () => {
    it('updateShift should NEVER send UI-only fields to Supabase', async () => {
      const mockQuery = createMockQuery({});
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const updates = {
        house_id: 'h1',
        start_date: '2026-06-01',
        entry_type: 'shift', // FORBIDDEN
        title: 'Morning Shift', // FORBIDDEN
        participants: [], // FORBIDDEN
      };

      await rosterApi.updateShift('s1', updates);

      const dbPayload = mockQuery.update.mock.calls[0][0];
      expect(dbPayload).toHaveProperty('house_id');
      expect(dbPayload).toHaveProperty('start_date');
      expect(dbPayload).not.toHaveProperty('entry_type');
      expect(dbPayload).not.toHaveProperty('title');
      expect(dbPayload).not.toHaveProperty('participants');
    });

    it('updateShift should handle undefined updates without crashing', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQuery({}));
      await expect(
        rosterApi.updateShift('s1', undefined),
      ).resolves.not.toThrow();
    });
  });

  describe('Participant CRUD Rigor', () => {
    it('Medication upsert should NOT contain non-existent columns (frequency, instructions)', async () => {
      const mockQuery = createMockQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const med = {
        participant_id: 'p1',
        medication_id: 'm1',
        dosage: '1 tablet',
        frequency: 'Daily', // FORBIDDEN
        instructions: 'Take with food', // FORBIDDEN
      };

      await participantDetailsApi.medications.upsert(med as any);

      const dbPayload = mockQuery.upsert.mock.calls[0][0];
      // Since it's an array in the API
      expect(dbPayload[0]).not.toHaveProperty('frequency');
      expect(dbPayload[0]).not.toHaveProperty('instructions');
    });
  });

  describe('Staff CRUD Rigor', () => {
    it('syncDetails should normalize dates correctly for Training', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const pending: any = {
        training: {
          toAdd: [{ title: 'T1', date_completed: '' }],
          toUpdate: [],
          toDelete: [],
        },
      };

      await staffDetailsApi.syncDetails('staff1', pending);

      const insertCall = mockQuery.insert.mock.calls[0][0];
      expect(insertCall.date_completed).toBeNull();
    });
  });
});
