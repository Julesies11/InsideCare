import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClinicalTrackersSetup } from './clinical-trackers-setup';

describe('ClinicalTrackersSetup', () => {
  const defaultFormData = {
    track_bowel: true,
    track_seizure: false,
    track_sleep: true,
    track_behaviour: false,
    track_community: true,
    track_nutrition: false,
    track_mtm: true,
    track_hygiene: false,
  };

  it('renders correctly with title and description', () => {
    render(
      <ClinicalTrackersSetup
        canEdit={true}
        formData={defaultFormData}
        onFormChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Clinical Trackers Setup')).toBeInTheDocument();
    expect(
      screen.getByText('Configure which clinical detail trackers are enabled for this participant\'s shift notes.')
    ).toBeInTheDocument();
  });

  it('reflects checked/unchecked state from formData', () => {
    render(
      <ClinicalTrackersSetup
        canEdit={true}
        formData={defaultFormData}
        onFormChange={vi.fn()}
      />
    );

    // Switches reflect checked/unchecked state correctly
    expect(screen.getByLabelText('Bowel Tracking')).toBeChecked();
    expect(screen.getByLabelText('Seizure Activity')).not.toBeChecked();
    expect(screen.getByLabelText('Sleep Tracking')).toBeChecked();
    expect(screen.getByLabelText('Behaviour Observation')).not.toBeChecked();
    expect(screen.getByLabelText('Community Participation')).toBeChecked();
    expect(screen.getByLabelText('Nutrition Tracker')).not.toBeChecked();
    expect(screen.getByLabelText('Mealtime Management')).toBeChecked();
    expect(screen.getByLabelText('Hygiene Tracking')).not.toBeChecked();
  });

  it('disables switches when canEdit is false', () => {
    render(
      <ClinicalTrackersSetup
        canEdit={false}
        formData={defaultFormData}
        onFormChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Bowel Tracking')).toBeDisabled();
    expect(screen.getByLabelText('Seizure Activity')).toBeDisabled();
    expect(screen.getByLabelText('Sleep Tracking')).toBeDisabled();
    expect(screen.getByLabelText('Behaviour Observation')).toBeDisabled();
    expect(screen.getByLabelText('Community Participation')).toBeDisabled();
    expect(screen.getByLabelText('Nutrition Tracker')).toBeDisabled();
    expect(screen.getByLabelText('Mealtime Management')).toBeDisabled();
    expect(screen.getByLabelText('Hygiene Tracking')).toBeDisabled();
  });

  it('calls onFormChange with correct arguments when switch is toggled', () => {
    const handleFormChange = vi.fn();
    render(
      <ClinicalTrackersSetup
        canEdit={true}
        formData={defaultFormData}
        onFormChange={handleFormChange}
      />
    );

    // Toggle track_seizure switch from false to true
    fireEvent.click(screen.getByLabelText('Seizure Activity'));
    expect(handleFormChange).toHaveBeenCalledWith('track_seizure', true);

    // Toggle track_bowel switch from true to false
    fireEvent.click(screen.getByLabelText('Bowel Tracking'));
    expect(handleFormChange).toHaveBeenCalledWith('track_bowel', false);
  });
});
