import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentManagementReportPage } from './incident-management-report-page';
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

vi.mock('@/hooks/use-incident-reports', () => ({
  useIncidentReports: () => ({ data: [], isLoading: false }),
}));

describe('IncidentManagementReportPage Smoke Test', () => {
  it('renders the incident management report correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <IncidentManagementReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>
    );
    
  // Use a function matcher for text broken across elements
  expect(screen.getByText((content, element) => 
    element?.textContent?.includes('Incident Management') ?? false
  )).toBeInTheDocument();
  
  expect(screen.getByText((content, element) =>
    element?.textContent?.includes('Clinical incident documentation and tracking') ?? false
  )).toBeInTheDocument();
  
  expect(screen.getByText('Print Preview')).toBeInTheDocument();
  });
});
