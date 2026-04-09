import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { HouseDetailContent } from './house-detail-content';

// Mock hooks
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'house-1' }))
  };
});

vi.mock('@/hooks/use-houses', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useHouse: vi.fn(() => ({
      house: { 
        id: 'house-1', 
        name: 'Test House', 
        setup_step: 'complete',
        status: 'active'
      },
      loading: false,
      refresh: vi.fn()
    })),
    useHouses: vi.fn(() => ({
      houses: [{ id: 'house-1', name: 'Test House' }],
      loading: false
    }))
  };
});

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: vi.fn(() => ({
    participants: [],
    loading: false
  })),
  useHouseParticipants: vi.fn(() => ({
    participants: [],
    loading: false
  }))
}));

// Mock Supabase to avoid network calls with support for chaining
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve({ data: { id: 'house-1', name: 'Test House' }, error: null })),
  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then: vi.fn((onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled))
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    }
  }
}));

describe('House Detail Smoke Tests', () => {
  const mockPendingChanges = {
    participants: { toAdd: [], toUpdate: [], toDelete: [] },
    staff: { toAdd: [], toUpdate: [], toDelete: [] },
    calendarEvents: { toAdd: [], toUpdate: [], toDelete: [] },
    documents: { toAdd: [], toUpdate: [], toDelete: [] },
    checklists: { toAdd: [], toUpdate: [], toDelete: [], checklistItems: { toAdd: [], toUpdate: [], toDelete: [] } },
    forms: { toAdd: [], toUpdate: [], toDelete: [] },
    resources: { toAdd: [], toUpdate: [], toDelete: [] },
    comms: { toAdd: [], toUpdate: [], toDelete: [] },
    shiftTemplates: { toAdd: [], toUpdate: [], toDelete: [] },
  };

  it('House Detail Content loads without crashing', async () => {
    renderWithProviders(
      <HouseDetailContent 
        houseId="house-1" 
        houseName="Test House" 
        pendingChanges={mockPendingChanges as any}
        onPendingChangesChange={() => {}}
        canEdit={true}
      />
    );
    
    // Use waitFor to allow any internal effects to run
    await waitFor(() => {
      // Check for sidebar navigation items which should be present
      expect(screen.getAllByText(/House Details/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Shift Setup/i)).toBeDefined();
      expect(screen.getAllByText(/Checklist Setup/i).length).toBeGreaterThan(0);
    });
  });
});
