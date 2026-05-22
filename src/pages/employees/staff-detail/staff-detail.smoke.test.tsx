import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { StaffDetailPage } from './staff-detail-page';
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() => Promise.resolve({ 
    data: { id: 'staff-1', staff_name: 'John Staff', status: 'active', email: 'john@example.com' }, 
    error: null 
  })),
  maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ 
    data: { id: 'staff-1', staff_name: 'John Staff', status: 'active', email: 'john@example.com' }, 
    error: null 
  })),
  then: vi.fn().mockImplementation(function(this: any, onSuccess) {
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
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'http://test.com' }, error: null }))
      }))
    }
  }
}));

// Mock hooks that use browser APIs
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

// Mock useParams directly
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
      route: '/employees/staff-detail/staff-1'
    });
    
    // Check for core page elements
    await waitFor(() => {
      expect(screen.getAllByText(/Employment/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      // The name should appear in the header or form
      expect(screen.getAllByText(/John Staff/i).length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });
});
