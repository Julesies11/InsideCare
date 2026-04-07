import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { PopulateRosterModal } from './PopulateRosterModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the materializePattern function
const materializePatternMock = vi.fn().mockResolvedValue({ created: 5, skipped: 2, checklists: 10 });

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: () => ({
    materializePattern: materializePatternMock,
    loading: false
  })
}));

vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: () => ({
    shiftTemplates: [
      { id: 'st-1', name: 'Morning', color_theme: 'morning', is_active: true, default_start_time: '07:00', default_end_time: '15:00' },
      { id: 'st-2', name: 'Afternoon', color_theme: 'afternoon', is_active: true, default_start_time: '15:00', default_end_time: '23:00' }
    ],
    defaults: [],
    isLoading: false
  })
}));

vi.mock('@/hooks/useHouseParticipants', () => ({
  useHouseParticipants: () => ({
    houseParticipants: [
      { id: 'p-1', name: 'John Doe', status: 'active' },
      { id: 'p-2', name: 'Jane Smith', status: 'active' }
    ],
    isLoading: false
  })
}));

describe('PopulateRosterModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    houseId: 'house-123',
    houseName: 'Test House',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with house name', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    expect(screen.getByText(/Build Roster/i)).toBeInTheDocument();
    expect(screen.getByText(/for Test House/i)).toBeInTheDocument();
  }, 30000);

  it('shows participant assignment section', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    expect(screen.getByText(/Participant Assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('allows toggling participants', async () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    
    // Checkbox for John Doe should be checked by default (as per component logic)
    const johnCheckbox = screen.getByLabelText(/John Doe/i);
    expect(johnCheckbox).toBeChecked();
    
    // Uncheck John Doe
    fireEvent.click(johnCheckbox);
    expect(johnCheckbox).not.toBeChecked();
    
    // Re-check John Doe
    fireEvent.click(johnCheckbox);
    expect(johnCheckbox).toBeChecked();
  });

  it('shows rotation length selector', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    expect(screen.getByText(/Rotation Length/i)).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('1');
  });

  it('adds additional weeks when rotation length is increased', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 2/i)).toBeInTheDocument();
  });

  it('copies Week 1 to all weeks', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    
    // Increase rotation to 2 weeks
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    const copyBtn = screen.getByText(/Copy W1 to All/i);
    fireEvent.click(copyBtn);
    
    expect(toast.success).toHaveBeenCalledWith('Week 1 pattern copied to all weeks');
  });

  it('calls materializePattern with multi-week pattern when rotation > 1', async () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    
    // Increase rotation to 2 weeks
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Build/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(materializePatternMock).toHaveBeenCalledWith(expect.objectContaining({
        pattern: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object)
        ])
      }));
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Roster populated successfully!',
      expect.objectContaining({
        description: expect.stringMatching(/Created 5 shifts.*Skipped 2 duplicates/i)
      })
    );
  });

  it('copies Monday pattern to weekdays for specific week', () => {
    renderWithProviders(<PopulateRosterModal {...defaultProps} />);
    
    // Increase rotation to 2 weeks
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    const copyBtns = screen.getAllByText(/Copy Mon to Weekdays/i);
    expect(copyBtns.length).toBe(2); // One for each week
    
    fireEvent.click(copyBtns[1]); // Click for week 2
    
    expect(toast.success).toHaveBeenCalledWith('Monday pattern copied to weekdays for Week 2');
  });
});
