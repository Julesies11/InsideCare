import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsSheet } from './notifications-sheet';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
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
        link: '/my-roster',
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
    const { user } = renderWithProviders(
      <NotificationsSheet trigger={<button>Open</button>} />,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => {
      expect(screen.getByText('New Shift')).toBeInTheDocument();
      expect(screen.getByText('You have a new shift')).toBeInTheDocument();
    });
  });
});
