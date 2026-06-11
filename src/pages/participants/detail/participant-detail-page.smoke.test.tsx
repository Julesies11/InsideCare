import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ParticipantDetailPage } from './participant-detail-page';

// Mock Supabase with improved chaining
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        id: 'participant-1',
        participant_name: 'John Doe',
        status: 'active',
      },
      error: null,
    }),
  ),
  maybeSingle: vi.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        id: 'participant-1',
        participant_name: 'John Doe',
        status: 'active',
      },
      error: null,
    }),
  ),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  then: vi.fn().mockImplementation(function (this: any, onSuccess) {
    if (typeof onSuccess === 'function') {
      return Promise.resolve(onSuccess({ data: [], error: null }));
    }
    return Promise.resolve({ data: [], error: null });
  }),
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() =>
          Promise.resolve({
            data: { signedUrl: 'http://test.com' },
            error: null,
          }),
        ),
      })),
    },
  },
}));

// Mock hooks that use browser APIs
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

// Mock useParams directly instead of relying on MemoryRouter mapping for now if it's failing
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'participant-1' }),
  };
});

describe('Participant Detail Smoke Test', () => {
  it('renders the participant detail page without crashing', async () => {
    renderWithProviders(<ParticipantDetailPage />, {
      route: '/participants/detail/participant-1',
    });

    // Check for core page elements
    await waitFor(
      () => {
        expect(screen.getByText(/Participant Details/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });
});
