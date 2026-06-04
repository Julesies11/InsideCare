import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { 
  useAddMedicationType, 
  useUpdateMedicationType, 
  useDeleteMedicationType 
} from './use-medications-master';
import { masterListsApi } from '@/api/master-lists.api';
import { logActivity } from '@/lib/activity-logger';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/api/master-lists.api', () => ({
  masterListsApi: {
    medications: {
      createMedicationType: vi.fn(),
      updateMedicationType: vi.fn(),
      deleteMedicationType: vi.fn(),
    }
  }
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
  detectChanges: vi.fn(),
}));

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' } }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Medication Type Mutation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useAddMedicationType', () => {
    it('should call API and log activity on success', async () => {
      const mockData = { id: '1', medication_type_name: 'New Type' };
      (masterListsApi.medications.createMedicationType as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useAddMedicationType(), { wrapper });

      await result.current.mutateAsync('New Type');

      expect(masterListsApi.medications.createMedicationType).toHaveBeenCalledWith('New Type');
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        activityType: 'create',
        entityType: 'medication_type_master',
        entityId: '1',
        entityName: 'New Type',
      }));
    });
  });

  describe('useUpdateMedicationType', () => {
    it('should call API and log activity on success', async () => {
      const mockData = { id: '1', medication_type_name: 'Updated Type' };
      (masterListsApi.medications.updateMedicationType as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUpdateMedicationType(), { wrapper });

      await result.current.mutateAsync({ id: '1', name: 'Updated Type', oldName: 'Old Type' });

      expect(masterListsApi.medications.updateMedicationType).toHaveBeenCalledWith('1', { name: 'Updated Type', is_active: undefined });
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        activityType: 'update',
        entityType: 'medication_type_master',
        changes: { medication_type_name: { old: 'Old Type', new: 'Updated Type' } },
      }));
    });
  });

  describe('useDeleteMedicationType', () => {
    it('should call API and log activity on success', async () => {
      (masterListsApi.medications.deleteMedicationType as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMedicationType(), { wrapper });

      await result.current.mutateAsync({ id: '1', name: 'Type to Delete' });

      expect(masterListsApi.medications.deleteMedicationType).toHaveBeenCalledWith('1');
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        activityType: 'delete',
        entityType: 'medication_type_master',
        entityName: 'Type to Delete',
      }));
    });
  });
});
