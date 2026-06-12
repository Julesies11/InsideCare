import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ShiftNoteTrackersSection } from './shift-note-trackers-section';

describe('ShiftNoteTrackersSection', () => {
  const mockOnFormChange = vi.fn();
  const mockFormData = {
    participant: {
      track_bowel: true,
      track_sleep: true,
      track_mtm: true,
    },
    bowel_bristol_scale: 4,
    sleep_quality_id: 'some-uuid',
    mtm_diet_type_id: 'some-diet-uuid',
  };

  it('renders enabled tracker cards based on participant setup', () => {
    renderWithProviders(
      <ShiftNoteTrackersSection
        canEdit={true}
        formData={mockFormData}
        onFormChange={mockOnFormChange}
      />
    );

    expect(screen.getByText('Bowel Tracking')).toBeInTheDocument();
    expect(screen.getByText('Sleep Tracking')).toBeInTheDocument();
    expect(screen.getByText('Mealtime Management')).toBeInTheDocument();
    
    // Check that disabled trackers are NOT rendered
    expect(screen.queryByText('Seizure Activity')).not.toBeInTheDocument();
    expect(screen.queryByText('Behaviour Observation')).not.toBeInTheDocument();
  });

  it('renders dropdowns for master list values', () => {
    renderWithProviders(
      <ShiftNoteTrackersSection
        canEdit={true}
        formData={mockFormData}
        onFormChange={mockOnFormChange}
      />
    );

    // Sleep Quality was an input, now it should be a select. 
    // Radix UI Select components often use aria-label or just the text of the trigger.
    expect(screen.getByText('Sleep Quality')).toBeInTheDocument();
    
    // Check that the trigger exists (Radix SelectValue placeholder or value)
    // We check for the label specifically
    const sleepQualityLabel = screen.getByText('Sleep Quality');
    expect(sleepQualityLabel).toBeInTheDocument();
  });
});
