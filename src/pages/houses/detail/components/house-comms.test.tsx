import {
  emptyHousePendingChanges,
  HousePendingChanges,
} from '@/models/house-pending-changes';
import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HouseComms } from './house-comms';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    })),
  },
}));

describe('HouseComms', () => {
  it('renders without crashing', async () => {
    const mockPendingChanges: HousePendingChanges = emptyHousePendingChanges;

    renderWithProviders(
      <HouseComms
        houseId="house-123"
        comms={[]}
        pendingChanges={mockPendingChanges}
        onPendingChangesChange={vi.fn()}
        canEdit={true}
        refreshKey={0}
      />,
    );

    expect(screen.getByText(/Daily Comms/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/No communication entries for this date/i),
      ).toBeInTheDocument();
    });
  });
});
