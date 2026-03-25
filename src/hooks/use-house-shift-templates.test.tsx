import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseShiftTemplates } from './use-house-shift-templates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useHouseShiftTemplates', () => {
  it('should fetch shift templates for a house', async () => {
    const mockTemplates = [
      { 
        id: 't1', 
        house_id: 'h1', 
        day_of_week: 'Monday', 
        shift_type_id: 'st1', 
        start_time: '07:00', 
        end_time: '15:00', 
        shift_type: { name: 'Morning', color_theme: 'morning' },
        checklists: []
      }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_shift_templates`, () => {
        return HttpResponse.json(mockTemplates);
      })
    );

    const { result } = renderHook(() => useHouseShiftTemplates('h1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].day_of_week).toBe('Monday');
  });

  it('should add a template entry', async () => {
    const newEntry = { day_of_week: 'Tuesday', shift_type_id: 'st1', start_time: '07:00', end_time: '15:00' };
    
    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/house_shift_templates`, () => {
        return HttpResponse.json({ id: 't2', ...newEntry, house_id: 'h1' });
      })
    );

    const { result } = renderHook(() => useHouseShiftTemplates('h1'), { wrapper });

    result.current.addTemplate.mutate(newEntry);
    await waitFor(() => expect(result.current.addTemplate.isSuccess).toBe(true));
  });
});
