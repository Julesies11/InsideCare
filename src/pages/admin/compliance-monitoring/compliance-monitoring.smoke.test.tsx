import { renderWithProviders, screen } from '@/test/test-utils';
import { ComplianceMonitoringPage } from './compliance-monitoring-page';
import { useComplianceMonitoring, useComplianceTypes } from '@/hooks/use-staff';
import { vi, describe, it, expect } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/use-staff', () => ({
  useComplianceMonitoring: vi.fn(),
  useComplianceTypes: vi.fn(),
}));

describe('ComplianceMonitoringPage Smoke Test', () => {
  it('renders the compliance monitoring page correctly', () => {
    // Setup mock data
    (useComplianceMonitoring as any).mockReturnValue({
      data: [],
      totalCount: 0,
      isLoading: false,
      refetch: vi.fn(),
    });
    (useComplianceTypes as any).mockReturnValue({
      types: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ComplianceMonitoringPage />);

    // Basic checks
    expect(screen.getByText(/Compliance Monitoring/i)).toBeInTheDocument();
  });
});
