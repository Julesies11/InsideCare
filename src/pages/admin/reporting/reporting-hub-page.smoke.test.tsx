import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportingHubPage } from './reporting-hub-page';
import { SettingsProvider } from '@/providers/settings-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

describe('ReportingHubPage Smoke Test', () => {
  it('renders the reporting hub correctly', () => {
    const { container } = render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReportingHubPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>
    );
    
    expect(container.querySelector('h1')?.textContent).toContain('Reporting Hub');
    
    // Verify descriptive text
    expect(screen.getByText(/Generate and export/i)).toBeInTheDocument();
  });
});
