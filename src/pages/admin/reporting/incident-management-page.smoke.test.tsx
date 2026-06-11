import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { IncidentManagementPage } from './incident-management-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user', staff_id: 's1', staff_name: 'Test Staff' },
  }),
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({
    hasAccess: () => true,
  }),
  ACCESS_LEVEL: {
    CONTEXT_READ_WRITE: 'context_read_write',
  },
}));

vi.mock('@/hooks/use-incident-reports', () => ({
  useIncidentReports: () => ({
    data: { data: [], count: 0 },
    isLoading: false,
  }),
  useCreateIncidentReport: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateIncidentReport: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIncidentReport: () => ({ data: null, isLoading: false }),
}));

// Mock ResizeObserver which is used by some UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('IncidentManagementPage Smoke Test', () => {
  it('renders the incident management console correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <IncidentManagementPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    expect(screen.getByText('Incident Management')).toBeInTheDocument();
    expect(screen.getByText('Clinical Safety')).toBeInTheDocument();
    expect(screen.getByText('Lodge New Incident')).toBeInTheDocument();
  });
});
