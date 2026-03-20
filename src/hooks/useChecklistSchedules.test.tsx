import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChecklistSchedules } from './useChecklistSchedules';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'schedule-1' }, error: null })),
        })),
        select2: vi.fn(() => Promise.resolve({ data: { id: 'schedule-1' }, error: null })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'cl-1', name: 'Test Checklist' }, error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('useChecklistSchedules', () => {
  it('should create a schedule and materialize events', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));
    
    const scheduleData = {
      house_id: 'house-1',
      house_checklist_id: 'cl-1',
      rrule: 'FREQ=DAILY',
      start_date: '2026-03-17',
      end_date: '2026-03-20',
      is_active: true
    };

    let newSchedule;
    await act(async () => {
      newSchedule = await result.current.createSchedule(scheduleData);
    });

    expect(newSchedule).toBeDefined();
    expect(newSchedule.id).toBe('schedule-1');
    
    // Check if supabase.from was called for 'checklist_schedules'
    expect(supabase.from).toHaveBeenCalledWith('checklist_schedules');
    
    // Check if supabase.from was called for 'house_calendar_events' (materialization)
    expect(supabase.from).toHaveBeenCalledWith('house_calendar_events');
  });

  it('should delete a schedule', async () => {
    const { result } = renderHook(() => useChecklistSchedules('house-1'));
    
    await act(async () => {
      await result.current.deleteSchedule('schedule-1');
    });
    
    expect(supabase.from).toHaveBeenCalledWith('checklist_schedules');
  });
});
