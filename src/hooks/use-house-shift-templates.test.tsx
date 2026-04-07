import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseShiftTemplates } from './use-house-shift-templates';
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

describe('useHouseShiftTemplates', () => {
  it('should fetch shift templates and defaults for a house', async () => {
    const mockShiftTemplates = [
      { id: 'st-1', house_id: 'house-1', name: 'Morning', short_name: 'M', sort_order: 10, is_active: true }
    ];
    const mockDefaults = [
      { shift_template_id: 'st-1', checklist_id: 'cl-1', checklist: { id: 'cl-1', name: 'Checklist 1' } }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_shift_templates`, () => {
        return HttpResponse.json(mockShiftTemplates);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/shift_template_default_checklists`, () => {
        return HttpResponse.json(mockDefaults);
      })
    );

    const { result } = renderHook(() => useHouseShiftTemplates('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.shiftTemplates).toHaveLength(1);
    expect(result.current.defaults).toHaveLength(1);
    expect(result.current.shiftTemplates[0].name).toBe('Morning');
    expect(result.current.defaults[0].checklist_id).toBe('cl-1');
  });

  it('should create a new shift template', async () => {
    const newType = { name: 'Night', short_name: 'N' };
    
    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/house_shift_templates`, () => {
        return HttpResponse.json({ id: 'st-3', ...newType, house_id: 'house-1' });
      })
    );

    const { result } = renderHook(() => useHouseShiftTemplates('house-1'), { wrapper });

    result.current.createShiftTemplate.mutate(newType);
    
    await waitFor(() => expect(result.current.createShiftTemplate.isSuccess).toBe(true));
  });
});
