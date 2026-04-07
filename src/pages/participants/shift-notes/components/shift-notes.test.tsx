import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { ShiftNotes } from './shift-notes';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockShiftNotes = [
  {
    id: 'note-1',
    start_date: '2026-03-05',
    shift_time: '08:00 - 16:00',
    notes: 'Test note 1',
    participant: { id: 'p-1', name: 'John Doe' },
    staff: { id: 's-1', name: 'Staff Member' },
    house: { id: 'h-1', name: 'House A' },
    house_id: 'h-1',
    shift: {
        id: 'shift-1',
        start_time: '08:00:00',
        end_time: '16:00:00',
        shift_template: 'Morning',
        status: 'Completed'
    }
  },
];

const mockHouses = [
  { id: 'h-1', name: 'House A', status: 'active' },
  { id: 'h-2', name: 'House B', status: 'active' },
];

const mockParticipants = [
    { id: 'p-1', name: 'John Doe' }
];

const mockStaff = [
    { id: 's-1', name: 'Staff Member' }
];

describe('ShiftNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/shift_notes`, () => {
        return HttpResponse.json(mockShiftNotes);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json(mockHouses);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json(mockParticipants);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
        return HttpResponse.json(mockStaff);
      })
    );
  });

  it('renders correctly and loads data', async () => {
    renderWithProviders(<ShiftNotes />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('House A')).toBeInTheDocument();
    });
  });

  it('filters by search query', async () => {
    renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search notes.../i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
    
    fireEvent.change(searchInput, { target: { value: 'John' } });
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens edit dialog when Edit is clicked', async () => {
    const { user } = renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      const editButtons = screen.getAllByText(/Edit/i);
      expect(editButtons.length).toBeGreaterThan(0);
    });

    const editButton = screen.getAllByRole('button', { name: /Edit/i })[0];
    await user.click(editButton);

    await waitFor(() => {
        expect(screen.getByText(/Edit Shift Note/i)).toBeInTheDocument();
        expect(screen.getByText(/Update the shift note details below./i)).toBeInTheDocument();
    });
  });

  it('filters by house using popover', async () => {
    const { user } = renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click House filter button — select the one with popover trigger
    const houseFilterBtn = screen.getAllByRole('button', { name: /House/i }).find(
      (btn) => btn.getAttribute('data-slot') === 'popover-trigger'
    ) || screen.getAllByRole('button', { name: /House/i })[0];
    await user.click(houseFilterBtn);

    // Find and click House B checkbox (which has no notes in mockShiftNotes)
    const houseBCheckbox = await screen.findByLabelText(/House B/i);
    await user.click(houseBCheckbox);

    await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });
});
