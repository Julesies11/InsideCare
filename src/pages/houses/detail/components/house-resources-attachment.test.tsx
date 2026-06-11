import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { HouseResources } from './house-resources';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';

// Mock the hook
vi.mock('@/hooks/useHouseResources', () => ({
  useHouseResources: vi.fn((houseId) => ({
    houseResources:
      houseId === 'test-house-id'
        ? [
            {
              id: 'res-1',
              title: 'Emergency Contact',
              category: 'Emergency',
              type: 'Contact',
              file_name: 'emergency.pdf',
              file_url: 'houses/test-house-id/resources/emergency.pdf',
              is_active: true,
            },
          ]
        : [],
    loading: false,
    getFileUrl: vi.fn(),
  })),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

describe('HouseResources Attachment Removal', () => {
  it('correctly sets pending changes with oldFilePath when an attachment is removed', async () => {
    const onPendingChangesChange = vi.fn();
    
    render(
      <HouseResources 
        houseId="test-house-id" 
        canAdd={true} 
        pendingChanges={emptyHousePendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />, 
      { wrapper }
    );

    // 1. Click Title to Edit
    const editLink = screen.getByRole('button', { name: /Emergency Contact/i });
    fireEvent.click(editLink);

    // 2. Click Remove attachment (X) button in dialog
    const removeFileButton = screen.getByRole('button', { name: /remove attachment/i });
    fireEvent.click(removeFileButton);

    // 3. Click Save in dialog
    const saveButton = screen.getByRole('button', { name: /update resource/i });
    fireEvent.click(saveButton);

    // 4. Verify onPendingChangesChange was called correctly
    expect(onPendingChangesChange).toHaveBeenCalled();
    const lastCall = onPendingChangesChange.mock.calls[onPendingChangesChange.mock.calls.length - 1][0];
    
    const resourceUpdate = lastCall.resources.toUpdate[0];
    expect(resourceUpdate.file_url).toBeNull();
    expect(resourceUpdate.file_name).toBeNull();
    expect(resourceUpdate.oldFilePath).toBe('houses/test-house-id/resources/emergency.pdf');
    expect(resourceUpdate.toDeleteFile).toBe(true);
  });
});
