import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ActivityLog } from './ActivityLog';
import { renderWithProviders } from '@/test/test-utils';

// Mock the hook
vi.mock('@/hooks/use-activity-log', () => ({
  useActivityLog: vi.fn(),
}));

import { useActivityLog } from '@/hooks/use-activity-log';

const mockActivities = [
  {
    id: '1',
    activity_type: 'update',
    entity_type: 'house',
    entity_id: 'house-1',
    entity_name: 'Test House',
    description: 'Updated house name from "Old Name" to "Test House"',
    user_name: 'Admin User',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    activity_type: 'create',
    entity_type: 'house',
    entity_id: 'house-1',
    entity_name: 'Test House',
    description: 'Created new house',
    user_name: 'System',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe('ActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useActivityLog as any).mockReturnValue({
      activities: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<ActivityLog entityId="house-1" entityType="house" />);
    expect(screen.getByText(/loading activity log/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useActivityLog as any).mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<ActivityLog entityId="house-1" entityType="house" />);
    expect(screen.getByText(/no activity recorded yet/i)).toBeInTheDocument();
  });

  it('renders activities', async () => {
    (useActivityLog as any).mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<ActivityLog entityId="house-1" entityType="house" />);

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText(/updated house name/i)).toBeInTheDocument();
    expect(screen.getByText(/created new house/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
  });

  it('handles error state', () => {
    (useActivityLog as any).mockReturnValue({
      activities: [],
      loading: false,
      error: 'Failed to fetch',
      refetch: vi.fn(),
    });

    renderWithProviders(<ActivityLog entityId="house-1" entityType="house" />);
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it('toggles show all', async () => {
    const refetch = vi.fn();
    (useActivityLog as any).mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      refetch,
    });

    const { user } = renderWithProviders(<ActivityLog entityId="house-1" entityType="house" />);
    
    const showAllButton = screen.getByText(/all-time activities/i);
    await user.click(showAllButton);
    
    expect(screen.getByText(/show recent activities/i)).toBeInTheDocument();
  });
});
