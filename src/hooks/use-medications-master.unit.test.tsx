import { ReactNode } from 'react';
import { masterListsApi } from '@/api/master-lists.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMedicationsMaster } from './use-medications-master';

// Mock dependencies
vi.mock('@/api/master-lists.api', () => ({
  masterListsApi: {
    medications: {
      list: vi.fn(),
    },
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useMedicationsMaster hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should call API with default parameters when no arguments are provided', async () => {
    (masterListsApi.medications.list as any).mockResolvedValue({
      data: [],
      count: 0,
    });

    renderHook(() => useMedicationsMaster(), { wrapper });

    // useMedicationsMaster default in hook definition is 0, 50
    // But my change in components was to call useMedicationsMaster(0, 1000)
    // The hook itself still has defaults of 0 and 50 in its signature.
    expect(masterListsApi.medications.list).toHaveBeenCalledWith(0, 50, [], {});
  });

  it('should call API with 1000 pageSize when requested', async () => {
    (masterListsApi.medications.list as any).mockResolvedValue({
      data: [],
      count: 0,
    });

    renderHook(() => useMedicationsMaster(0, 1000), { wrapper });

    expect(masterListsApi.medications.list).toHaveBeenCalledWith(
      0,
      1000,
      [],
      {},
    );
  });
});
