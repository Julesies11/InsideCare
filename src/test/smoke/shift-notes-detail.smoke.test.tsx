import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { ShiftNoteHealthSection } from '@/pages/shift-notes/components/sections/shift-note-health-section';
import { ShiftNoteTrackersSection } from '@/pages/shift-notes/components/sections/shift-note-trackers-section';

describe('Shift Note Sections Smoke Tests', () => {
  const onFormChange = vi.fn();
  const baseFormData = {
    prn_medication_given: null,
    pbs_strategies_used: null,
    mtm_texture_correct: null,
    mtm_consistency_correct: null,
    mtm_positioning_appropriate: null,
    mtm_supervision_required: null,
  };

  describe('ShiftNoteHealthSection', () => {
    it('renders RadioGroups for PRN and PBS', () => {
      renderWithProviders(
        <ShiftNoteHealthSection 
          canEdit={true} 
          formData={baseFormData} 
          onFormChange={onFormChange} 
        />
      );
      expect(screen.getByText(/PRN medication given\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Were PBS strategies used\?/i)).toBeInTheDocument();
      
      // Check for Yes/No radio labels (multiple occurrences)
      const yesLabels = screen.getAllByText(/Yes/i);
      const noLabels = screen.getAllByText(/No/i);
      expect(yesLabels.length).toBeGreaterThanOrEqual(2);
      expect(noLabels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ShiftNoteTrackersSection', () => {
    const mockParticipant = { track_mtm: true };

    it('renders Mealtime Management RadioGroups and conditional textareas', async () => {
      renderWithProviders(
        <ShiftNoteTrackersSection 
          canEdit={true} 
          formData={{ ...baseFormData, mtm_meal_provided: true, participant: mockParticipant }} 
          onFormChange={onFormChange} 
        />
      );

      expect(screen.getByText(/Correct food texture provided\?/i)).toBeInTheDocument();

      // Mock selecting "No" for texture
      renderWithProviders(
        <ShiftNoteTrackersSection 
          canEdit={true} 
          formData={{ ...baseFormData, mtm_meal_provided: true, mtm_texture_correct: false, participant: mockParticipant }} 
          onFormChange={onFormChange} 
        />
      );
      expect(screen.getByText(/Describe why food texture was not correct/i)).toBeInTheDocument();

      // Mock selecting "Yes" for supervision
      renderWithProviders(
        <ShiftNoteTrackersSection 
          canEdit={true} 
          formData={{ ...baseFormData, mtm_meal_provided: true, mtm_supervision_required: true, participant: mockParticipant }} 
          onFormChange={onFormChange} 
        />
      );
      expect(screen.getByText(/Describe supervision required/i)).toBeInTheDocument();
    });
  });
});
