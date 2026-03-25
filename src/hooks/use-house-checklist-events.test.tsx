import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseChecklistEvents } from './use-house-checklist-events';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useHouseChecklistEvents', () => {
  it('should combine calendar events and shift-assigned checklists', async () => {
    server.use(
      // 1. Mock junction table fetch for shift-assigned checklists
      http.get(`${SUPABASE_URL}/rest/v1/shift_assigned_checklists`, () => {
        return HttpResponse.json([
          { 
            checklist_id: 'cl-shift-1', 
            assignment_title: 'Start of Shift Report',
            sort_order: 0
          },
        ]);
      }),
      // 2. Mock calendar events fetch
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => {
        return HttpResponse.json([
          { 
            id: 'evt-cal-1', 
            house_id: 'house-1', 
            title: 'Daily Cleaning', 
            event_date: '2026-03-23', 
            is_checklist_event: true, 
            house_checklist_id: 'cl-daily-1', 
            status: 'scheduled',
            submissions: []
          },
        ]);
      }),
      // 3. Mock submission check for shift checklist
      http.get(`${SUPABASE_URL}/rest/v1/house_checklist_submissions`, () => {
        return HttpResponse.json([]);
      }),
      // 4. Mock checklist templates fetch
      http.get(`${SUPABASE_URL}/rest/v1/house_checklists`, () => {
        return HttpResponse.json([
          { 
            id: 'cl-shift-1', 
            name: 'Generic Shift Template', 
            type: 'start_of_shift',
            target_shift: 'morning',
            frequency: 'daily', 
            items: [
              {
                id: 'item-1',
                title: 'Check Meds',
                group_id: 'st-1',
                group: { id: 'st-1', name: 'Morning', color_theme: 'morning' }
              }
            ]
          },
          { 
            id: 'cl-daily-1', 
            name: 'House Cleaning Template', 
            type: 'daily_house',
            target_shift: 'all',
            frequency: 'daily', 
            items: []
          },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseChecklistEvents('house-1', '2026-03-23', 'shift-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toHaveLength(2);
    
    // Check Daily House Event
    const dailyEvent = result.current.events.find(e => e.house_checklist_id === 'cl-daily-1');
    expect(dailyEvent?.title).toBe('Daily Cleaning');

    // Check Shift-Assigned Event (Synthetic)
    const shiftEvent = result.current.events.find(e => e.house_checklist_id === 'cl-shift-1');
    expect(shiftEvent?.title).toBe('Start of Shift Report'); // Custom assignment title
    
    // Verify item group information
    const item = shiftEvent?.checklist?.items[0];
    expect(item?.title).toBe('Check Meds');
    expect(item?.group?.name).toBe('Morning');
  });
});
