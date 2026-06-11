import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ComplianceReportPage } from './compliance-report-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { staff_id: 'test-staff-id', email: 'test@example.com' },
  }),
}));

// Mock hooks to avoid API calls
vi.mock('@/hooks/use-staff', () => ({
  useComplianceMonitoring: () => ({
    data: [],
    loading: false,
    error: null,
  }),
  useStaffLightweight: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-houses', () => ({
  useHousesLightweight: () => ({
    data: [],
    loading: false,
  }),
}));

vi.mock('@/hooks/use-report-preferences', () => ({
  useReportPreferences: () => ({
    preferences: null,
    isLoading: false,
    isSuccess: true,
  }),
  useSaveReportPreferences: () => ({
    mutate: vi.fn(),
  }),
}));

describe('ComplianceReportPage Smoke Test', () => {
  it('renders the compliance report page correctly', () => {
    const { container } = render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ComplianceReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    expect(
      screen.getByText(/Compliance Monitoring Report/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Report Criteria/i)).toBeInTheDocument();

    // Verify filters exist
    expect(screen.getByText(/Filter by House/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter by Staff Member/i)).toBeInTheDocument();
    expect(screen.getByText(/Group Results By/i)).toBeInTheDocument();

    // Verify actions exist
    expect(screen.getByText(/Print Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset Criteria/i)).toBeInTheDocument();
  });
});
