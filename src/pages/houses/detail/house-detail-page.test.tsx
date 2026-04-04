import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HouseDetailPage } from './house-detail-page';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockHouse = {
  id: 'house-1',
  name: 'Test House 1',
  status: 'active',
  capacity: 5,
  address: '123 Test St',
};

// Mock useParams from react-router-dom as used in the component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'house-1' }),
  };
});

// Mock hooks that use browser APIs
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

describe('HouseDetailPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/houses`, ({ request }) => {
        const url = new URL(request.url);
        const idParam = url.searchParams.get('id');
        if (idParam || request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(mockHouse);
        }
        return HttpResponse.json([mockHouse]);
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json(mockHouse);
      })
    );
  });

  it('renders the page with toolbar and content', async () => {
    renderWithProviders(<HouseDetailPage />);

    expect(screen.getByRole('heading', { name: /house details/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test House 1')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 20000);

  it('enables save button when data is changed', async () => {
    const { user } = renderWithProviders(<HouseDetailPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test House 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();

    const nameInput = screen.getByDisplayValue('Test House 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'House Updated');

    await waitFor(() => {
      expect(nameInput).toHaveValue('House Updated');
    }, { timeout: 10000 });

    expect(saveBtn).toBeEnabled();
  }, 20000);
});
