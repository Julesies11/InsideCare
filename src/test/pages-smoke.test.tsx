import { renderWithProviders, screen } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ChecklistMasterPage } from '@/pages/admin/checklists/checklist-master-page';
import { HouseChecklistScheduleModal } from '@/pages/houses/detail/components/HouseChecklistScheduleModal';
import { Participants } from '@/pages/participants/profiles/components/participants';
import { Houses } from '@/pages/houses/profiles/components/houses';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
            })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
        }))
      })),
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null }))
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    }
  }
}));

describe('Smoke Tests - New Features', () => {
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
});
