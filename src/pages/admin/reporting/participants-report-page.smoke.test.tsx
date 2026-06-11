import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ParticipantsReportPage } from './participants-report-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      staff_id: 'test-staff-id',
      email: 'test@example.com',
      staff_name: 'Test Staff',
    },
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

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({
    participants: [],
    count: 0,
    loading: false,
    error: null,
  }),
  useParticipant: () => ({ participant: null, loading: false, error: null }),
}));

vi.mock('@/hooks/use-participant-medications', () => ({
  useParticipantMedications: () => ({
    medications: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-participant-goals', () => ({
  useParticipantGoals: () => ({
    data: { goals: [], progress: [] },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-participant-contacts', () => ({
  useParticipantContacts: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/use-participant-documents', () => ({
  useParticipantDocuments: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/use-shift-notes', () => ({
  useShiftNotesByParticipantId: () => ({
    shiftNotes: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-activity-log', () => ({
  useActivityLog: () => ({ activities: [], loading: false, error: null }),
}));

describe('ParticipantsReportPage Smoke Test', () => {
  it('renders the participants profile report correctly', () => {
    const { container } = render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ParticipantsReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Check dropdown select component exists
    expect(screen.getByText('Select Participant')).toBeInTheDocument();

    // Checks that the default "No Participant Selected" placeholder card displays
    expect(screen.getByText('No Participant Selected')).toBeInTheDocument();
  });
});
