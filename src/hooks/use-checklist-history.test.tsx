import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChecklistHistory } from './use-checklist-history';
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

describe('useChecklistHistory', () => {
  it('should fetch checklist history successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_checklist_submissions`, () => {
        return HttpResponse.json([
          { 
            id: 'sub-1', 
            checklist_id: 'cl-1', 
            house_id: 'house-1', 
            status: 'completed',
            started_at: new Date().toISOString(),
            house_checklists: { name: 'Morning Routine' },
            staff: { name: 'John Staff' },
            house_checklist_submission_items: [{ is_completed: true }, { is_completed: false }]
          },
        ]);
      })
    );

    const { result } = renderHook(() => useChecklistHistory(0, 10, [], { houseIds: ['house-1'] }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0].checklist_name).toBe('Morning Routine');
    expect(result.current.data?.data?.[0].item_count).toBe(2);
    expect(result.current.data?.data?.[0].completed_item_count).toBe(1);
  });
});
