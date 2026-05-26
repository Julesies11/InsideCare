import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityLogTable } from './activity-log-table';
import { useSearchParams } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import React from 'react';

// Mock dependencies
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual as any,
    useSearchParams: vi.fn(),
  };
});

vi.mock('@/hooks/use-activity-log', () => ({
  useActivityLog: vi.fn().mockReturnValue({
    activities: [],
    count: 0,
    loading: false,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('ActivityLogTable URL Sync', () => {
  const setSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue([new URLSearchParams(), setSearchParams]);
  });

  it('should initialize state from URL parameters', async () => {
    const params = new URLSearchParams();
    params.set('search', 'test-query');
    params.set('page', '2');
    params.set('category', 'data_changes');
    params.set('staff', 'John Doe');
    params.set('module', 'employees');

    (useSearchParams as any).mockReturnValue([params, setSearchParams]);

    render(<ActivityLogTable />, { wrapper });

    // Verify search input value
    const searchInput = screen.getByPlaceholderText(/Search logs.../i) as HTMLInputElement;
    expect(searchInput.value).toBe('test-query');

    // Verify active tab (this might be harder to query directly, but we can check the useActivityLog call)
    const { useActivityLog } = await import('@/hooks/use-activity-log');
    expect(useActivityLog).toHaveBeenCalledWith(expect.objectContaining({
      search: 'test-query',
      pageIndex: 1, // page 2 is index 1
      category: 'data_changes',
      userName: 'John Doe',
      module: 'employees',
    }));
  });

  it('should update URL when search query changes', async () => {
    render(<ActivityLogTable />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Search logs.../i);
    fireEvent.change(searchInput, { target: { value: 'new-search' } });

    await waitFor(() => {
      expect(setSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        }),
        { replace: true }
      );
      
      const updatedParams = setSearchParams.mock.calls[setSearchParams.mock.calls.length - 1][0];
      expect(updatedParams.get('search')).toBe('new-search');
    });
  });

  it('should reset page when filters change', async () => {
    const params = new URLSearchParams();
    params.set('page', '3');
    (useSearchParams as any).mockReturnValue([params, setSearchParams]);

    render(<ActivityLogTable />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Search logs.../i);
    fireEvent.change(searchInput, { target: { value: 'trigger-reset' } });

    await waitFor(() => {
      const updatedParams = setSearchParams.mock.calls[setSearchParams.mock.calls.length - 1][0];
      expect(updatedParams.get('search')).toBe('trigger-reset');
      expect(updatedParams.get('page')).toBe('1'); // Page 1 is index 0
    });
  });
});
