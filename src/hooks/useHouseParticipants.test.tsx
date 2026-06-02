import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHouseParticipants } from './useHouseParticipants';
import { participantsApi } from '@/api/participants.api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/api/participants.api', () => ({
  participantsApi: {
    listByHouse: vi.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useHouseParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls participantsApi.listByHouse and returns data', async () => {
    const mockParticipants = [
      { id: '1', name: 'John Doe', status: 'active', house_id: 'house-1' }
    ];
    (participantsApi.listByHouse as any).mockResolvedValue(mockParticipants);

    const { result } = renderHook(() => useHouseParticipants('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(participantsApi.listByHouse).toHaveBeenCalledWith('house-1', 'active');
    expect(result.current.houseParticipants).toEqual(mockParticipants);
  });

  it('returns empty array if no houseId provided', async () => {
    const { result } = renderHook(() => useHouseParticipants(undefined), { wrapper });

    expect(result.current.houseParticipants).toEqual([]);
    expect(participantsApi.listByHouse).not.toHaveBeenCalled();
  });
});
