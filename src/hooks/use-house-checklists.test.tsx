import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseChecklists } from './use-house-checklists';
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

describe('useHouseChecklists', () => {
  it('should fetch house checklists sorted by sort_order', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_checklists`, () => {
        return HttpResponse.json([
          { 
            id: 'cl-1', 
            house_id: 'house-1', 
            name: 'Morning Routine', 
            sort_order: 0, 
            house_checklist_items: [] 
          },
          { 
            id: 'cl-2', 
            house_id: 'house-1', 
            name: 'Afternoon Routine', 
            sort_order: 1, 
            house_checklist_items: [
              { id: 'item-1', title: 'Task 1', sort_order: 0 },
              { id: 'item-2', title: 'Task 2', sort_order: 1 }
            ] 
          },
        ]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/house_checklist_submissions`, () => {
        return HttpResponse.json([]);
      })
    );

    const { result } = renderHook(() => useHouseChecklists('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.houseChecklists).toHaveLength(2);
    // Verify checklist sorting (cl-1 should be first because sort_order 0 < 1)
    expect(result.current.houseChecklists[0].id).toBe('cl-1');
    expect(result.current.houseChecklists[1].id).toBe('cl-2');
    
    // Verify item sorting within checklist cl-2
    const cl2Items = result.current.houseChecklists[1].items;
    expect(cl2Items?.[0].id).toBe('item-1');
    expect(cl2Items?.[1].id).toBe('item-2');
  });
});
