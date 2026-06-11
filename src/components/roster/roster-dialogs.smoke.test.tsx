import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { StaffShiftNoteDialog } from './staff-shift-note-dialog';
import { StaffShift } from './use-roster-data';
import { ViewShiftDialog } from './view-shift-dialog';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null }),
            ),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

const mockShift: StaffShift = {
  id: 'shift-1',
  staff_id: 'staff-1',
  start_date: '2026-04-21',
  end_date: '2026-04-21',
  start_time: '08:00:00',
  end_time: '16:00:00',
  house_id: 'house-1',
  shift_template: 'Morning Shift',
  notes: 'Admin note',
  house: { id: 'house-1', house_name: 'Alpha House' },
  participants: [{ id: 'p-1', participant_name: 'John Doe' }],
  assigned_checklists: [
    {
      id: 'cl-1',
      checklist_id: 'template-1',
      assignment_title: 'Morning Routine',
      items: [{ id: 'item-1', title: 'Medication' }],
    },
  ],
};

describe('Roster Dialogs Smoke Tests', () => {
  it('renders ViewShiftDialog without crashing', async () => {
    renderWithProviders(
      <ViewShiftDialog open={true} onOpenChange={() => {}} shift={mockShift} />,
    );
    await waitFor(() => {
      expect(screen.getByText(/08:00 – 16:00/i)).toBeInTheDocument();
      // Use getAllByText because it appears in sr-only description and location section
      expect(screen.getAllByText(/Alpha House/i)[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Instructions from Scheduler/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Morning Routine/i)).toBeInTheDocument();
    });
  });

  it('renders StaffShiftNoteDialog without crashing', async () => {
    renderWithProviders(
      <StaffShiftNoteDialog
        open={true}
        onOpenChange={() => {}}
        shift={mockShift}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Write Shift Note/i)).toBeInTheDocument();
      expect(screen.getByText(/Alpha House/i)).toBeInTheDocument();
      expect(screen.getByText(/Observation \/ Note/i)).toBeInTheDocument();
    });
  });
});
