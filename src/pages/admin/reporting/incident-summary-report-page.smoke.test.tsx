import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentSummaryReportPage } from './incident-summary-report-page';
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
    user: { id: 'test-user', email: 'test@example.com', staff_id: 'staff-1' },
  }),
}));

vi.mock('@/hooks/use-incident-reports', () => ({
  useIncidentReports: () => ({ data: { data: [], count: 0 }, isLoading: false }),
}));

vi.mock('@/hooks/use-incident-types-master', () => ({
  useIncidentTypesMaster: () => ({ data: [], isLoading: false }),
}));

// Mock recharts ResponsiveContainer to prevent width/height 0 issues in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('IncidentSummaryReportPage Smoke Test', () => {
  it('renders the incident summary report correctly', () => {
    const { container } = render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <IncidentSummaryReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>
    );
    
    // Use querySelector to find the report header text in PrintableReport
    expect(container.querySelector('h1')?.textContent).toContain('Incident Summary');
    
    expect(screen.getByText('Print Report')).toBeInTheDocument();
    expect(screen.getByText('Show Chronology Log')).toBeInTheDocument();
  });
});
