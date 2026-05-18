import { renderWithProviders, screen } from '@/test/test-utils';
import { ActivityLogPage } from './activity-log-page';
import { describe, it, expect, vi } from 'vitest';

// Mock the ActivityLog component as it makes real network calls via useActivityLog
vi.mock('@/components/activities/ActivityLog', () => ({
  ActivityLog: () => <div data-testid="activity-log-mock">Mocked Activity Log</div>,
}));

describe('ActivityLogPage Smoke Test', () => {
  it('should render the activity log page with its title and the mocked log', async () => {
    renderWithProviders(<ActivityLogPage />);

    // Check title and description
    expect(screen.getByText('System Activity Log')).toBeInTheDocument();
    expect(screen.getByText(/Audit trail of all system changes/)).toBeInTheDocument();

    // Check if the actual log component is rendered
    expect(screen.getByTestId('activity-log-mock')).toBeInTheDocument();
  });
});
