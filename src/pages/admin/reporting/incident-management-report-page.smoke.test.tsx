import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentManagementReportPage } from './incident-management-report-page';
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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IncidentManagementReportPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Incident Management')).toBeDefined();
    expect(screen.getByText('Clinical incident documentation and tracking')).toBeDefined();
    expect(screen.getByText('Print Preview')).toBeDefined();
  });
});
