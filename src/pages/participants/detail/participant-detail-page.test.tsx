import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { ParticipantDetailPage } from './participant-detail-page';
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

vi.setConfig({ testTimeout: 15000 });

describe('ParticipantDetailPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/participants`, ({ request }) => {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(mockParticipant);
        }
        return HttpResponse.json([mockParticipant]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json([]);
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json([mockParticipant]);
      })
    );
  });

  it('renders the page with toolbar and content', async () => {
    renderWithProviders(<ParticipantDetailPage />);

    expect(screen.getByRole('heading', { name: /participant details/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  it('enables save button when data is changed', async () => {
    const { user } = renderWithProviders(<ParticipantDetailPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    }, { timeout: 10000 });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();

    const nameInput = await screen.findByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });

    expect(saveBtn).toBeEnabled();
  }, 20000);

  it('calls update mutation when save is clicked', async () => {
    const updateSpy = vi.fn();
    server.use(
      http.patch(`${SUPABASE_URL}/rest/v1/participants`, async ({ request }) => {
        const body = await request.json();
        console.log('PATCH body received by MSW:', body);
        updateSpy(body);
        return HttpResponse.json({ ...mockParticipant, ...body });
      })
    );

    const { user } = renderWithProviders(<ParticipantDetailPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe (Updated)' } });
    
    // Wait for the input to actually reflect the change
    await waitFor(() => {
      expect(nameInput).toHaveValue('John Doe (Updated)');
    });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeEnabled();
    await user.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe (Updated)'
      }));
    }, { timeout: 10000 });
  }, 20000);
});
