import { AuthContext } from '@/auth/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as useHousesHook from '@/hooks/use-houses';
import { Houses } from './houses';

// Mock hooks
vi.mock('@/hooks/use-houses', () => ({
  useHouses: vi.fn(() => ({
    houses: [],
    count: 0,
    isLoading: false,
    error: null,
  })),
  useUpdateHouse: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useActiveParticipants: () => ({
    participants: [],
    loading: false,
  }),
}));

vi.mock('@/hooks/use-house-staff-assignments', () => ({
  useHouseStaffAssignments: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('Houses List Persistence', () => {
  it('initializes pagination and search from URL parameters', async () => {
    const useHousesMock = vi.mocked(useHousesHook.useHouses);
    const queryClient = new QueryClient();

    render(
      <AuthContext.Provider
        value={{ user: { email: 'test@example.com' }, isAdmin: true } as any}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={[
              '/houses/profiles?page=3&search=test-house&pageSize=25',
            ]}
          >
            <Routes>
              <Route path="/houses/profiles" element={<Houses />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>,
    );

    // Verify that useHouses was called with the correct parameters from the URL
    // pageIndex should be 2 (3-1), pageSize should be 25, search should be 'test-house'
    await waitFor(() => {
      expect(useHousesMock).toHaveBeenCalledWith(
        2,
        25,
        expect.anything(),
        expect.objectContaining({ search: 'test-house' }),
      );
    });
  });
});
