import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';
import { houseOperationsApi } from './house-operations.api';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('houseOperationsApi.syncOperations', () => {
  const houseId = 'house-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should surgical sync checklist items (upsert and delete) when updating a checklist', async () => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { id: 'cl-1' }, error: null }),
    };

    const mockFrom = vi.mocked(supabase.from).mockReturnValue(mockQuery);

    const pendingChanges = {
      staff: { toAdd: [], toUpdate: [], toDelete: [] },
      participants: { toAdd: [], toUpdate: [], toDelete: [] },
      calendarEvents: { toAdd: [], toDelete: [] },
      checklists: {
        toAdd: [],
        toUpdate: [
          {
            id: 'cl-1',
            house_checklist_name: 'Updated Checklist',
            items: [
              { id: 'item-1', title: 'Existing Task' },
              { tempId: 'temp-2', title: 'New Task' },
            ],
          },
        ],
        toDelete: [],
      },
      resources: { toAdd: [], toUpdate: [], toDelete: [] },
      comms: { toAdd: [] },
      documents: { toAdd: [], toDelete: [] },
    };

    await houseOperationsApi.syncOperations(houseId, pendingChanges as any);

    // Verify Checklist Update
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CHECKLISTS);

    // Verify Items Surgical Deletion
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CHECKLIST_ITEMS);
    expect(mockQuery.delete).toHaveBeenCalled();
    expect(mockQuery.not).toHaveBeenCalledWith('id', 'in', '(item-1)');

    // Verify Items Upsert
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Existing Task',
          checklist_id: 'cl-1',
        }),
        expect.objectContaining({ title: 'New Task', checklist_id: 'cl-1' }),
      ]),
    );
  });

  it('should handle checklist deletion with cascade logic', async () => {
    const mockFrom = vi.mocked(supabase.from);

    const pendingChanges = {
      checklists: {
        toDelete: ['cl-delete-1'],
        toAdd: [],
        toUpdate: [],
      },
    };

    mockFrom.mockImplementation(() => ({
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    await houseOperationsApi.syncOperations(houseId, pendingChanges as any);

    // 1. Delete Items
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CHECKLIST_ITEMS);
    // 2. Delete Schedules
    expect(mockFrom).toHaveBeenCalledWith(TABLES.CHECKLIST_SCHEDULES);
    // 3. Nullify Calendar Events
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CALENDAR_EVENTS);
    // 4. Delete Checklists
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CHECKLISTS);
  });
});

describe('houseOperationsApi.calendar complex saves', () => {
  it('should implement createWithRelations correctly', async () => {
    const mockFrom = vi.mocked(supabase.from);
    const event = { title: 'Test Event', house_id: 'h1' };
    const pIds = ['p1'];
    const sIds = ['s1'];

    mockFrom.mockImplementation((table) => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: 'new-e1', house_id: 'h1' },
          error: null,
        }),
    }));

    const result = await houseOperationsApi.calendar.createWithRelations(
      event,
      pIds,
      sIds,
      [],
    );

    expect(result.id).toBe('new-e1');
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CALENDAR_EVENTS);
    expect(mockFrom).toHaveBeenCalledWith(
      TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS,
    );
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CALENDAR_EVENT_STAFF);
  });
});
