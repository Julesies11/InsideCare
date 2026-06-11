import { emptyHousePendingChanges } from '@/models/house-pending-changes';
import { HouseDetailContent } from '@/pages/houses/detail/house-detail-content';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from './test-utils';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          single: vi.fn(() => {
            if (table === 'houses') {
              return Promise.resolve({
                data: {
                  id: 'house-1',
                  house_name: 'Test House',
                  status: 'active',
                },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          maybeSingle: vi.fn(() => {
            if (table === 'houses') {
              return Promise.resolve({
                data: {
                  id: 'house-1',
                  house_name: 'Test House',
                  status: 'active',
                },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({ data: { id: 'house-1' }, error: null }),
        ),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: { id: 'new-id' }, error: null }),
          ),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'user-1',
              app_metadata: { is_admin: true, staff_id: 'staff-1' },
            },
          },
          error: null,
        }),
      ),
    },
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({ data: { success: true }, error: null }),
      ),
    },
  },
}));

describe('House Detail Smoke Tests', () => {
  it('House Detail Content loads without crashing', async () => {
    renderWithProviders(
      <HouseDetailContent
        pendingChanges={emptyHousePendingChanges}
        onPendingChangesChange={vi.fn()}
        canEdit={true}
      />,
      {
        route: '/houses/detail/house-1',
      },
    );

    // Use waitFor to allow any internal effects to run
    await waitFor(() => {
      // Check for sidebar navigation items which should be present
      expect(screen.getAllByText(/House Details/i).length).toBeGreaterThan(0);
    });
  });
});
