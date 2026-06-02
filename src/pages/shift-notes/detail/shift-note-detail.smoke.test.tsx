import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShiftNoteDetailContent } from './shift-note-detail-content';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ReactNode } from 'react';

// Mock hooks
vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({ participants: [{ id: 'p-1', participant_name: 'John Doe' }] }),
}));
vi.mock('@/hooks/use-staff', () => ({
  useStaff: () => ({ staff: [{ id: 's-1', staff_name: 'Jane Staff' }] }),
}));
vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({ houses: [{ id: 'h-1', house_name: 'Main House' }] }),
}));
vi.mock('@/hooks/use-seizure-types-master', () => ({
  useSeizureTypesMaster: () => ({ data: [], isLoading: false }),
  useAddSeizureTypeMaster: () => ({ mutateAsync: vi.fn() }),
  useUpdateSeizureTypeMaster: () => ({ mutateAsync: vi.fn() }),
  useDeleteSeizureTypeMaster: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/use-behaviour-types-master', () => ({
  useBehaviourTypesMaster: () => ({ data: [], isLoading: false }),
  useAddBehaviourTypeMaster: () => ({ mutateAsync: vi.fn() }),
  useUpdateBehaviourTypeMaster: () => ({ mutateAsync: vi.fn() }),
  useDeleteBehaviourTypeMaster: () => ({ mutateAsync: vi.fn() }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/shift-notes/detail/new']}>
        <Routes>
          <Route path="/shift-notes/detail/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ShiftNoteDetailContent Smoke Test', () => {
  it('renders initial form content correctly', () => {
    renderWithProviders(<ShiftNoteDetailContent canEdit={true} />);
    
    // Check for core fields
    expect(screen.getByText('Shift Overview')).toBeDefined();
    expect(screen.getAllByText(/Select Shift/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Participant/i).length).toBeGreaterThan(0);
  });
});
