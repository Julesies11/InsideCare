import { renderWithProviders, screen, waitFor } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ChecklistMasterPage } from '@/pages/admin/checklists/checklist-master-page';
import { HouseChecklistScheduleModal } from '@/pages/houses/detail/components/HouseChecklistScheduleModal';
import { Participants } from '@/pages/participants/profiles/components/participants';
import { Houses } from '@/pages/houses/profiles/components/houses';
import { StaffProfile } from '@/pages/staff/staff-profile';
import { StaffTable } from '@/pages/employees/staff-profiles/components/staff';

// Mock Supabase with a more robust chainable mock
vi.mock('@/lib/supabase', () => {
  const mockResult = Promise.resolve({ data: [], error: null, count: 0 });
  
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue(Promise.resolve({ data: {}, error: null })),
    maybeSingle: vi.fn().mockReturnValue(Promise.resolve({ data: { id: 'staff-123' }, error: null })),
    // Make the mockQuery object itself "thenable" to handle .order(...).then(...)
    then: (onFulfilled: any) => mockResult.then(onFulfilled),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } }, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
      },
      functions: {
        invoke: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      },
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
          upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://test.com' }, error: null })),
          remove: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      }
    }
  };
});

describe('Smoke Tests - Pages and Features', () => {
  it('Checklist Master Page loads without crashing', () => {
    renderWithProviders(<ChecklistMasterPage />);
    expect(screen.getByText(/Checklist Templates/i)).toBeDefined();
  });

  it('House Checklist Schedule Modal renders', () => {
    renderWithProviders(
      <HouseChecklistScheduleModal 
        open={true} 
        onClose={() => {}} 
        houseId="test-house-id" 
        checklist={{ id: '1', name: 'Test Checklist' }}
      />
    );
    expect(screen.getByText(/Choose how this checklist should be deployed/i)).toBeDefined();
  });

  it('Participants List loads without crashing', () => {
    renderWithProviders(<Participants />);
    expect(screen.getByPlaceholderText(/Search Participants/i)).toBeDefined();
  });

  it('Houses List loads without crashing', () => {
    renderWithProviders(<Houses />);
    expect(screen.getByPlaceholderText(/Search Houses/i)).toBeDefined();
  });

  it('Staff Profile loads without crashing', async () => {
    renderWithProviders(<StaffProfile />);
    await waitFor(() => {
      // The component eventually renders "My Profile" once staffId and data are resolved
      expect(screen.getByText(/My Profile/i)).toBeDefined();
    }, { timeout: 4000 });
  });

  it('Staff Profiles Table loads without crashing', () => {
    renderWithProviders(<StaffTable />);
    expect(screen.getByPlaceholderText(/Search Staff/i)).toBeDefined();
  });
});
