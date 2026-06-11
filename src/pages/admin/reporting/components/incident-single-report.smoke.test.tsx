import { IncidentReport } from '@/models/incident-report';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { IncidentSingleReport } from './incident-single-report';

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

const mockIncident: IncidentReport & {
  participant?: { participant_name: string };
  staff?: { staff_name: string };
  reporter?: { staff_name: string };
  house?: { house_name: string };
  incident_type_info?: { name: string };
} = {
  id: 'test-incident-uuid',
  reference_id: 'INC-20260608-1422-JD',
  incident_date: '2026-06-08T14:22:00.000Z',
  incident_type_id: 't1',
  involved_participant_id: 'p1',
  description: 'Test incident description',
  priority: 'High',
  severity: 'Moderate',
  summary: 'Test incident summary',
  details: 'Test incident detailed description',
  outcome: 'Immediate actions taken outcome',
  witnesses: 'John Witness',
  notified_parties: 'NDIS, Guardian',
  is_restrictive_practice: false,
  is_ndis_reportable: false,
  admin_status: 'New',
  reported_by: 's1',
  created_at: '2026-06-08T14:25:00.000Z',
  updated_at: '2026-06-08T14:25:00.000Z',
  participant: { participant_name: 'John Doe' },
  staff: { staff_name: 'Staff Member' },
  reporter: { staff_name: 'Reporter Staff' },
  house: { house_name: 'Comfort House' },
  incident_type_info: { name: 'Behavioural' },
};

describe('IncidentSingleReport Smoke Test', () => {
  it('renders printable single incident report details correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <IncidentSingleReport incident={mockIncident as any} />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    expect(
      screen.getByText('Incident Investigation Report'),
    ).toBeInTheDocument();
    expect(screen.getByText('INC-20260608-1422-JD')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Test incident summary/)).toBeInTheDocument();
    expect(
      screen.getByText(/Test incident detailed description/),
    ).toBeInTheDocument();
  });
});
