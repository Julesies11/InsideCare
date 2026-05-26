import { renderWithProviders, screen } from '@/test/test-utils';
import { ActivityLogPage } from './activity-log-page';
import { describe, it, expect, vi } from 'vitest';

// Mock the ActivityLogTable component
vi.mock('./components/activity-log-table', () => ({
  ActivityLogTable: () => <div data-testid="activity-log-table-mock">Mocked Activity Log Table</div>,
}));

describe('ActivityLogPage Smoke Test', () => {
  it('should render the activity log page with its title and the mocked table', async () => {
    renderWithProviders(<ActivityLogPage />);

    // Check title and description
    expect(screen.getByText('System Activity Log')).toBeInTheDocument();
    expect(screen.getByText(/Audit trail of all system changes/)).toBeInTheDocument();

    // Check if the actual log component is rendered
    expect(screen.getByTestId('activity-log-table-mock')).toBeInTheDocument();
  });
});
