import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ParticipantDetailContent } from './participant-detail-content';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockParticipant = {
  id: 'participant-1',
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active',
  ndis_number: 'NDIS123',
};

// Mock useParams
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'participant-1' }),
  };
});

// Mock hooks that use browser APIs
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

describe('ParticipantDetailContent', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json(mockParticipant);
      })
    );
  });

  it('renders loading state initially', () => {
    renderWithProviders(<ParticipantDetailContent />);
    expect(screen.getByText(/loading participant details/i)).toBeInTheDocument();
  });

  it('renders participant data after loading', async () => {
    renderWithProviders(<ParticipantDetailContent />);

    await waitFor(() => {
      expect(screen.queryByText(/loading participant details/i)).not.toBeInTheDocument();
    });

    // Check if name is rendered in the form (PersonalDetails component)
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NDIS123')).toBeInTheDocument();
  });

  it('handles field changes', async () => {
    const { user } = renderWithProviders(<ParticipantDetailContent />);

    await waitFor(() => {
      expect(screen.queryByText(/loading participant details/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'John Smith');

    expect(nameInput).toHaveValue('John Smith');
  }, 20000);
});
