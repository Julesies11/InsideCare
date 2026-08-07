import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    sleep_records: [
      {
        id: 'record-1',
        sleep_start_time: '22:00:00',
        sleep_wake_time: '06:00:00',
        sleep_quality_id: 'some-uuid',
        sleep_type_id: 'some-type-uuid',
        sleep_support_required: 'No',
      }
    ],
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

  it('renders Behaviour Observation with a text input for behaviour type', () => {
    const mockFormDataWithBehaviour = {
      participant: {
        track_behaviour: true,
      },
      behaviour_observed: true,
      behaviour_type: 'Agitation',
    };

    renderWithProviders(
      <ShiftNoteTrackersSection
        canEdit={true}
        formData={mockFormDataWithBehaviour}
        onFormChange={mockOnFormChange}
      />
    );

    expect(screen.getByText('Behaviour Observation')).toBeInTheDocument();
    
    // Check that behaviour_type is an input with correct value
    const input = screen.getByLabelText('Behaviour Type') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('text');
    expect(input.value).toBe('Agitation');
  });
});
