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
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReportingHubPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>
    );
    
    expect(screen.getByText('Reporting Hub')).toBeInTheDocument();
  
  // Use flexible matcher for text split across elements
  expect(screen.getByText((content, element) =>
    element?.textContent?.includes('System-wide analytics and compliance exports') ?? false
  )).toBeInTheDocument();
  
  expect(screen.getByText((content, element) =>
    element?.textContent?.includes('Incident Management') ?? false
  )).toBeInTheDocument();
  });
});
