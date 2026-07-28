import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClinicalTrackersMaster } from './use-clinical-trackers-master';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { masterListsApi } from '@/api/master-lists.api';

// Mock the API
vi.mock('@/api/master-lists.api', () => ({
  masterListsApi: {
    clinicalTrackers: {
      list: vi.fn(),
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useClinicalTrackersMaster (Centralized)', () => {
  it('should fetch Behaviour and Seizure types along with other trackers', async () => {
    const mockData = [{ id: '1', name: 'Test Item', is_active: true }];
    vi.mocked(masterListsApi.clinicalTrackers.list).mockResolvedValue(mockData);

    const { result } = renderHook(() => useClinicalTrackersMaster(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify Behaviour and Seizure types are present in the result
    expect(result.current.data).toHaveProperty('BEHAVIOUR_INTENSITY_MASTER');
    expect(result.current.data).toHaveProperty('SEIZURE_TYPES_MASTER');
    expect(result.current.data.BEHAVIOUR_INTENSITY_MASTER).toEqual(mockData);
    expect(result.current.data.SEIZURE_TYPES_MASTER).toEqual(mockData);
  });
});
