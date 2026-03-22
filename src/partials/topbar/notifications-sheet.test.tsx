import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { NotificationsSheet } from './notifications-sheet';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notifications: [
      {
        id: '1',
        type: 'shift_assigned',
        title: 'New Shift',
        body: 'You have a new shift',
        link: '/staff/roster',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ],
    loading: false,
    unreadCount: 1,
    markAllRead: vi.fn(),
    markRead: vi.fn(),
  })),
}));

describe('NotificationsSheet', () => {
  it('renders trigger correctly', () => {
    renderWithProviders(<NotificationsSheet trigger={<button>Open</button>} />);
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('renders notifications inside sheet', async () => {
    const { user } = renderWithProviders(<NotificationsSheet trigger={<button>Open</button>} />);
    
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => {
      expect(screen.getByText('New Shift')).toBeInTheDocument();
      expect(screen.getByText('You have a new shift')).toBeInTheDocument();
    });
  });
});
