import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChecklistSchedules } from './useChecklistSchedules';
import { supabase } from '@/lib/supabase';

// Mock Supabase
const mockInsert = vi.fn().mockImplementation(() => ({
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'schedule-1', name: 'Test Checklist' }, error: null }),
}));

const mockSelect = vi.fn().mockImplementation(() => ({
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'cl-1', name: 'Test Checklist' }, error: null }),
}));

const mockDelete = vi.fn().mockImplementation(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const mockFrom = vi.fn((table) => {
  if (table === 'checklist_schedules') {
    return { insert: mockInsert, delete: mockDelete };
  }
  if (table === 'house_checklists') {
    return { select: mockSelect };
  }
  if (table === 'house_calendar_events') {
    return { insert: vi.fn().mockResolvedValue({ error: null }), delete: mockDelete };
  }
  return { select: mockSelect, insert: mockInsert, delete: mockDelete };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe('useChecklistSchedules', () => {
  it('should create a schedule and materialize events', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));
    
    const scheduleData = {
      house_id: 'house-1',
      house_checklist_id: 'cl-1',
      rrule: 'FREQ=DAILY',
      start_date: '2026-04-01',
      end_date: '2026-04-10',
      is_active: true
    };

    let newSchedule;
    await act(async () => {
      newSchedule = await result.current.createSchedule(scheduleData);
    });

    expect(newSchedule).toBeDefined();
    expect(newSchedule.id).toBe('schedule-1');
    
    // Check if mockFrom was called for 'checklist_schedules'
    expect(mockFrom).toHaveBeenCalledWith('checklist_schedules');
    
    // Check if mockFrom was called for 'house_calendar_events' (materialization)
    expect(mockFrom).toHaveBeenCalledWith('house_calendar_events');
  });

  it('should delete a schedule', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));
    
    await act(async () => {
      await result.current.deleteSchedule('schedule-1');
    });
    
    expect(mockFrom).toHaveBeenCalledWith('checklist_schedules');
  });
});
