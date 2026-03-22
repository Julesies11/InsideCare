import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { NotificationCenter } from './notification-center';
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
        type: 'timesheet_approved',
        title: 'Timesheet Approved',
        body: 'Your timesheet was approved',
        link: '/staff/timesheets',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'system_alert',
        title: 'System Alert',
        body: 'System going down for maintenance',
        link: null,
        is_read: true,
        created_at: new Date().toISOString(),
      },
    ],
    loading: false,
    totalCount: 2,
    unreadCount: 1,
    markAllRead: vi.fn(),
    markRead: vi.fn(),
    markUnread: vi.fn(),
    clearAll: vi.fn(),
    clearNotification: vi.fn(),
    refetch: vi.fn(),
  })),
}));

describe('NotificationCenter', () => {
  it('renders the page and loads notifications', () => {
    renderWithProviders(<NotificationCenter />);

    expect(screen.getByRole('heading', { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByText('Timesheet Approved')).toBeInTheDocument();
    expect(screen.getByText('System Alert')).toBeInTheDocument();
  });

  it('displays the unread count correctly', () => {
    renderWithProviders(<NotificationCenter />);
    
    expect(screen.getByText(/you have 1 unread notifications/i)).toBeInTheDocument();
  });

  it('filters buttons are present', () => {
    renderWithProviders(<NotificationCenter />);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unread' })).toBeInTheDocument();
  });
});
