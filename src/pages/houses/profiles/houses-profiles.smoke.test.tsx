import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { HousesProfilesContent } from './houses-basic-content';
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
        })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1', name: 'New House' }, error: null }))
        }))
      }))
    }))
  }
}));

describe('Houses Profiles Smoke Test', () => {
  it('renders the houses profiles page without crashing', async () => {
    renderWithProviders(<HousesProfilesContent />);
    
    // Check for core page elements
    expect(screen.getByText(/House Management/i)).toBeInTheDocument();
    
    // Check for the motivational banner text
    expect(screen.getByText(/Creating Safe and Comfortable Homes/i)).toBeInTheDocument();
    
    // Check for major action buttons
    expect(screen.getByText(/Add House/i)).toBeInTheDocument();
    
    // Check for table search placeholder
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search Houses.../i)).toBeInTheDocument();
    });
  });
});
