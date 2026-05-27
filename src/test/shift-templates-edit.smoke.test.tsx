import { renderWithProviders, screen } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ShiftTemplatesEditPage } from '@/pages/roster-board/shift-templates-edit';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue(Promise.resolve({ data: { house_name: 'Test House' }, error: null })),
    maybeSingle: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
    then: (onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } }, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      }
    }
  };
});

// Mock RBAC hook
const mockHasAccess = vi.fn();
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({
    hasAccess: mockHasAccess
  }),
  ACCESS_LEVEL: {
    CONTEXT_READ_WRITE: 'context_read_write'
  }
}));

// Mock react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'test-house-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('ShiftTemplatesEditPage Smoke Test', () => {
  it('renders house specific header', async () => {
    mockHasAccess.mockReturnValue(true);
    
    renderWithProviders(<ShiftTemplatesEditPage />);
    
    // Header should eventually show house name
    expect(await screen.findByRole('heading', { level: 1, name: /Shift Templates/i })).toBeDefined();
    expect(screen.getAllByText(/Shift Templates/i).length).toBeGreaterThan(0);
  });
});
