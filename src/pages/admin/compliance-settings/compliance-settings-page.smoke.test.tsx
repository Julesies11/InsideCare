import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplianceSettingsPage } from './compliance-settings-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SettingsProvider } from '@/providers/settings-provider';

// Mock the queries and mutations in hooks/use-staff
vi.mock('@/hooks/use-staff', () => ({
  useComplianceTypes: vi.fn().mockReturnValue({
    types: [
      { id: '1', compliance_name: 'NDIS Screen Check', description: 'NDIS Screen', is_active: true, is_default_global: true },
      { id: '2', compliance_name: 'Drivers License', description: 'Valid Drivers License', is_active: true, is_default_global: false },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAddComplianceType: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
  }),
  useUpdateComplianceType: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ComplianceSettingsPage Smoke Test', () => {
  it('renders the compliance settings page without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <ComplianceSettingsPage />
          </QueryClientProvider>
        </SettingsProvider>
      </MemoryRouter>
    );

    // Check for page title/header
    expect(screen.getByText('Compliance Configuration')).toBeInTheDocument();
    expect(screen.getByText('Manage the master list of staff compliance checks and set global defaults.')).toBeInTheDocument();
    expect(screen.getByText('NDIS Screen Check')).toBeInTheDocument();
    expect(screen.getByText('Drivers License')).toBeInTheDocument();
  });
});
