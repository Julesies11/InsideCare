import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { IncidentQuarterlyAuditReportPage } from './incident-quarterly-audit-report-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/hooks/use-incident-reports', () => ({
  useIncidentReports: () => ({
    data: { data: [], total: 0 },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-incident-types-master', () => ({
  useIncidentTypesMaster: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/lib/incident-pattern-detection', () => ({
  detectIncidentPatterns: () => [],
}));

describe('IncidentQuarterlyAuditReportPage Smoke Test', () => {
  it('renders the quarterly audit report page correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <IncidentQuarterlyAuditReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Verify key elements exist
    expect(screen.getByText('Incident & Risk Internal Audit')).toBeInTheDocument();
    expect(screen.getByText('Quarterly Governance & Pattern Compliance Review')).toBeInTheDocument();
    expect(screen.getByText('1. Executive Summary (Admin Oversight)')).toBeInTheDocument();
  });
});
