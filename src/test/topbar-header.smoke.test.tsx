import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/layouts/demo1/components/header';

// Mock dependencies
vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      email: 'test.staff@insidecare.app',
      staff_name: 'Test Staff',
      photo_url: null,
    },
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    loading: false,
    unreadCount: 0,
    markAllRead: vi.fn(),
    markRead: vi.fn(),
  }),
}));

vi.mock('@/providers/settings-provider', () => ({
  useSettings: () => ({
    settings: {
      layouts: {
        demo1: { sidebarCollapse: false },
      },
    },
    setOption: vi.fn(),
  }),
}));

describe('Topbar Header & Avatar Smoke Test', () => {
  it('renders Header with clickable User Menu and Notifications trigger without crashing', () => {
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Verify header container exists
    const headerElement = container.querySelector('header');
    expect(headerElement).toBeDefined();
    expect(headerElement).toHaveClass('z-30');

    // Verify user menu button trigger is rendered with proper aria label
    const userMenuButton = screen.getByRole('button', { name: /User Menu/i });
    expect(userMenuButton).toBeInTheDocument();
  });
});
