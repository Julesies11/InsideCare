import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';
import { shiftNotesApi } from './shift-notes.api';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          order: vi.fn(() => ({
            order: vi.fn(() => ({})),
          })),
        })),
        order: vi.fn(() => ({})),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('shiftNotesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has a get method that fetches a single note by ID', async () => {
    const mockNote = { id: 'note-1', notes: 'Test note' };
    const mockMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: mockNote, error: null });
    const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));

    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const result = await shiftNotesApi.get('note-1');

    expect(supabase.from).toHaveBeenCalledWith(TABLES.SHIFT_NOTES);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'note-1');
    expect(result).toEqual(mockNote);
  });

  it('upsert calls supabase with correct parameters and defaults to active status', async () => {
    const noteData = { shift_id: 'shift-1', notes: 'Test' };
    const mockNote = { id: 'new-id', ...noteData, status: 'active' };

    const mockMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: mockNote, error: null });
    const mockSelect = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockUpsert = vi.fn(() => ({ select: mockSelect }));

    (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

    const result = await shiftNotesApi.upsert(noteData);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ ...noteData, status: 'active' }),
      expect.objectContaining({
        onConflict: 'shift_id,staff_id,participant_id',
      }),
    );
    expect(result).toEqual(mockNote);
  });

  it('create is an alias for upsert', async () => {
    const upsertSpy = vi
      .spyOn(shiftNotesApi, 'upsert')
      .mockResolvedValue({ id: 'alias-id' } as any);
    const noteData = { notes: 'alias test' };

    await shiftNotesApi.create(noteData);

    expect(upsertSpy).toHaveBeenCalledWith(noteData);
    upsertSpy.mockRestore();
  });

  it('list filters for active status by default', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));

    (supabase.from as any).mockReturnValue({ select: mockSelect });

    await shiftNotesApi.list();

    expect(mockEq).toHaveBeenCalledWith('status', 'active');
  });

  it('list includes inactive notes when requested', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = vi.fn(() => ({ order: mockOrder }));

    (supabase.from as any).mockReturnValue({ select: mockSelect });

    await shiftNotesApi.list(true);

    // Should NOT call .eq('status', 'active')
    const fromCall = (supabase.from as any).mock.results[0].value;
    expect(fromCall.select().eq).toBeUndefined();
  });

  it('archive performs a soft-delete by updating status to inactive', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));

    (supabase.from as any).mockReturnValue({ update: mockUpdate });

    await shiftNotesApi.archive('note-123');

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'inactive' });
    expect(mockEq).toHaveBeenCalledWith('id', 'note-123');
  });
});
