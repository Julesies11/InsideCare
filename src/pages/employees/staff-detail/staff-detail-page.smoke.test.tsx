import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { StaffDetailPage } from './staff-detail-page';

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

// Mock Supabase with improved chaining
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        id: 'staff-1',
        staff_name: 'John Staff',
        email: 'john@example.com',
        role: { id: 'role-1', role_name: 'Staff' },
        department_info: { id: 'dept-1', department_name: 'Care' },
        photo_url: null,
        house_assignments: [],
      },
      error: null,
    }),
  ),
  maybeSingle: vi.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        id: 'staff-1',
        staff_name: 'John Staff',
        email: 'john@example.com',
        role: { id: 'role-1', role_name: 'Staff' },
        department_info: { id: 'dept-1', department_name: 'Care' },
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
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
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
    useParams: () => ({ id: 'staff-1' }),
  };
});

describe('Staff Detail Smoke Test', () => {
  it('renders the staff detail page without crashing', async () => {
    renderWithProviders(<StaffDetailPage />, {
      route: '/employees/staff-detail/staff-1',
    });

    // Check for core page elements
    await waitFor(
      () => {
        expect(screen.getByText(/Staff Details/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('John Staff')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });
});
