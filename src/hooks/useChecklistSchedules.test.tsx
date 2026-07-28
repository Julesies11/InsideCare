import { act, renderHook } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';
import { useChecklistSchedules } from './useChecklistSchedules';

// Mock Supabase
const mockInsert = vi.fn().mockImplementation(() => ({
  select: vi.fn().mockReturnThis(),
  single: vi
    .fn()
    .mockResolvedValue({
      data: { id: 'schedule-1', name: 'Test Checklist' },
      error: null,
    }),
  maybeSingle: vi
    .fn()
    .mockResolvedValue({
      data: { id: 'schedule-1', name: 'Test Checklist' },
      error: null,
    }),
}));

const mockSelect = vi.fn().mockImplementation(() => ({
  eq: vi.fn().mockReturnThis(),
  single: vi
    .fn()
    .mockResolvedValue({
      data: { id: 'cl-1', name: 'Test Checklist' },
      error: null,
    }),
  maybeSingle: vi
    .fn()
    .mockResolvedValue({
      data: { id: 'cl-1', name: 'Test Checklist' },
      error: null,
    }),
}));

const mockDelete = vi.fn().mockImplementation(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const mockFrom = vi.fn((table) => {
  if (table === 'ic_checklist_schedules') {
    return { insert: mockInsert, delete: mockDelete };
  }
  if (table === TABLES.HOUSE_CHECKLISTS) {
    return { select: mockSelect };
  }
  if (table === TABLES.HOUSE_CALENDAR_EVENTS) {
    return {
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: mockDelete,
    };
  }
  return { select: mockSelect, insert: mockInsert, delete: mockDelete };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe('useChecklistSchedules', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create a schedule and materialize events', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));

    const scheduleData = {
      house_id: 'house-1',
      house_checklist_id: 'cl-1',
      rrule: 'FREQ=DAILY',
      start_date: '2026-07-01',
      end_date: '2026-07-10',
      is_active: true,
    };

    let newSchedule;
    await act(async () => {
      newSchedule = await result.current.createSchedule(scheduleData);
    });

    expect(newSchedule).toBeDefined();
    expect(newSchedule.id).toBe('schedule-1');

    // Check if mockFrom was called for 'ic_checklist_schedules'
    expect(mockFrom).toHaveBeenCalledWith('ic_checklist_schedules');

    // Check if mockFrom was called for TABLES.HOUSE_CALENDAR_EVENTS (materialization)
    expect(mockFrom).toHaveBeenCalledWith(TABLES.HOUSE_CALENDAR_EVENTS);
  });

  it('should delete a schedule', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));

    await act(async () => {
      await result.current.deleteSchedule('schedule-1');
    });

    expect(mockFrom).toHaveBeenCalledWith('ic_checklist_schedules');
  });
});
