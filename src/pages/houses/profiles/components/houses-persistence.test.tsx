import { render, screen } from '@testing-library/react';
import { Houses } from './houses';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import * as useHousesHook from '@/hooks/use-houses';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/auth/context/auth-context';

// Mock hooks
vi.mock('@/hooks/use-houses', () => ({
  useHouses: vi.fn(() => ({
    data: { data: [], count: 0 },
    isLoading: false,
    error: null
  })),
  useUpdateHouse: () => ({
    mutateAsync: vi.fn()
  })
}));

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({
    data: { data: [] },
    isLoading: false
  })
}));

vi.mock('@/hooks/use-house-staff-assignments', () => ({
  useHouseStaffAssignments: () => ({
    data: [],
    isLoading: false
  })
}));

describe('Houses List Persistence', () => {
  it('initializes pagination and search from URL parameters', () => {
    const useHousesMock = vi.mocked(useHousesHook.useHouses);
    const queryClient = new QueryClient();
    
    render(
      <AuthContext.Provider value={{ user: { email: 'test@example.com' }, isAdmin: true } as any}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/houses/profiles?page=3&search=test-house&pageSize=25']}>
            <Routes>
              <Route path="/houses/profiles" element={<Houses />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    // Verify that useHouses was called with the correct parameters from the URL
    // pageIndex should be 2 (3-1), pageSize should be 25, search should be 'test-house'
    expect(useHousesMock).toHaveBeenCalledWith(
      2, 
      25, 
      expect.anything(), 
      expect.objectContaining({ search: 'test-house' })
    );
  });
});
