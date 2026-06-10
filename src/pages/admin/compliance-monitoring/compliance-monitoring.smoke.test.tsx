import { render, screen } from '@testing-library/react';
import { ComplianceMonitoringPage } from './compliance-monitoring-page';
import { useComplianceMonitoring, useComplianceTypes } from '@/hooks/use-staff';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the hooks
vi.mock('@/hooks/use-staff', () => ({
  useComplianceMonitoring: vi.fn(),
  useComplianceTypes: vi.fn(),
}));

vi.mock('@/providers/settings-provider', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      container: 'fixed'
    }
  }))
}));

describe('ComplianceMonitoringPage Smoke Test', () => {
  it('renders the compliance monitoring page correctly', () => {
    // Setup mock data
    (useComplianceMonitoring as any).mockReturnValue({
      staffCompliance: [],
      isLoading: false,
      refetch: vi.fn(),
    });
    (useComplianceTypes as any).mockReturnValue({
      types: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ComplianceMonitoringPage />
      </MemoryRouter>
    );

    // Basic checks
    expect(screen.getByText(/Compliance Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Audit Directory/i)).toBeInTheDocument();
  });
});
