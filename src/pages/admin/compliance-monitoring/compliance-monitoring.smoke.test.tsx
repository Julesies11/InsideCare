import { renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useComplianceMonitoring, useComplianceTypes } from '@/hooks/use-staff';
import { ComplianceMonitoringPage } from './compliance-monitoring-page';

// Fix for React Router v7 context issues
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const reactRouter = await import('react-router');
  return {
    ...actual,
    Link: reactRouter.Link,
    useNavigate: reactRouter.useNavigate,
    useLocation: reactRouter.useLocation,
    useParams: reactRouter.useParams,
    useSearchParams: reactRouter.useSearchParams,
  };
});

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
