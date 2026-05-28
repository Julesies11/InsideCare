import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShiftNoteOverviewSection } from '../components/sections/shift-note-overview-section';
import { ShiftNoteSupportsSection } from '../components/sections/shift-note-supports-section';
import { ShiftNoteHealthSection } from '../components/sections/shift-note-health-section';
import { ShiftNoteTrackersSection } from '../components/sections/shift-note-trackers-section';
import { ShiftNoteSummarySection } from '../components/sections/shift-note-summary-section';

interface ShiftNoteDetailContentProps {
  onFormDataChange?: (data: Record<string, unknown>) => void;
  onOriginalDataChange?: (data: Record<string, unknown>) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: MutableRefObject<(() => Promise<void>) | null>;
  canEdit: boolean;
}

export function ShiftNoteDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  canEdit,
}: ShiftNoteDetailContentProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    start_date: new Date().toISOString().split('T')[0],
    shift_time: '',
    participant_id: '',
    staff_id: '',
    house_id: '',
    shift_id: '',
    shift_type: null,
    risks_observed: false,
    risk_description: '',
    overall_presentation: '',
    adl_supports: '',
    domestic_tasks: '',
    capacity_building_goals: '',
    regular_medication_status: 'none',
    prn_medication_given: false,
    prn_description: '',
    pbs_strategies_used: false,
    pbs_strategies_details: '',
    pbs_when_used: '',
    pbs_outcome: '',
    restrictive_practices_status: 'none',
    shift_summary: '',
    // Trackers
    bowel_movement_occurred: false,
    bowel_time: null,
    bowel_bristol_scale: null,
    bowel_amount: null,
    bowel_assistance_required: null,
    bowel_notes: '',
    seizure_occurred: false,
    seizure_time_started: null,
    seizure_duration_minutes: null,
    seizure_type_id: null,
    seizure_description: '',
    seizure_injury_occurred: false,
    seizure_injury_description: '',
    seizure_emergency_services: false,
    seizure_notes: '',
    sleep_occurred: false,
    sleep_type_period: null,
    sleep_start_time: null,
    sleep_wake_time: null,
    sleep_quality: '',
    sleep_support_required: '',
    behaviour_observed: false,
    behaviour_type_id: null,
    behaviour_intensity: null,
    behaviour_notes: '',
    community_access_occurred: false,
    community_activity_type: '',
    community_location: '',
    community_engagement_level: '',
    community_notes: '',
    meal_provided: false,
    nutrition_meal_type: null,
    nutrition_intake: null,
    nutrition_refusal_alternatives: '',
    nutrition_assistance_needed: '',
    nutrition_fluids_intake: '',
    nutrition_notes: '',
    mtm_meal_provided: false,
    mtm_diet_type: null,
    mtm_fluids: null,
    mtm_texture_correct: null,
    mtm_consistency_correct: null,
    mtm_positioning_appropriate: null,
    mtm_supervision_required: null,
    mtm_swallowing_concerns: 'no',
    mtm_meal_intake: null,
    mtm_meal_intake_notes: '',
    mtm_fluid_intake: null,
    mtm_fluid_intake_notes: '',
    mtm_concerns: '',
    mtm_notes: '',
    hygiene_support_required: false,
    hygiene_shower: null,
    hygiene_oral_care: null,
    hygiene_toileting: null,
    hygiene_grooming: null,
    hygiene_observed_concerns: '',
    hygiene_notes: '',
  });

  const isNewNote = id === 'new';

  // Auto-populate Mealtime Management from Participant Profile
  const fetchParticipantMtm = async (participantId: string) => {
    if (!participantId || !isNewNote) return;

    try {
      const { data, error } = await supabase
        .from('ic_participants')
        .select('mtmp_required, mtmp_details')
        .eq('id', participantId)
        .single();

      if (error) throw error;

      if (data?.mtmp_required) {
        handleFormChange('mtm_meal_provided', true);
        handleFormChange('mtm_notes', `Auto-populated from Care Plan: ${data.mtmp_details || ''}`);
      }
    } catch (err) {
      console.error('Error auto-populating MTM:', err);
    }
  };

  // Fetch shift details if creating from a shift
  const fetchShiftDetails = async (shiftId: string) => {
    if (!shiftId) return;

    try {
      const { data, error } = await supabase
        .from('ic_staff_shifts')
        .select('start_date, start_time, house_id, shift_template')
        .eq('id', shiftId)
        .single();

      if (error) throw error;

      if (data) {
        const mappedType = data.shift_template?.toLowerCase();
        const validTypes = ['morning', 'afternoon', 'evening', 'sleepover'];
        
        handleFormChange('start_date', data.start_date);
        handleFormChange('shift_time', data.start_time);
        handleFormChange('house_id', data.house_id);
        if (validTypes.includes(mappedType)) {
          handleFormChange('shift_type', mappedType);
        }
      }
    } catch (err) {
      console.error('Error fetching shift details:', err);
    }
  };

  const fetchShiftNote = useCallback(async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ic_shift_notes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Shift note not found");

      setFormData(data);
      if (onFormDataChange) onFormDataChange(data);
      if (onOriginalDataChange) onOriginalDataChange(data);
    } catch (err) {
      console.error('Error fetching shift note:', err);
      toast.error('Failed to load shift note');
    } finally {
      setLoading(false);
    }
  }, [id, onFormDataChange, onOriginalDataChange]);

  useEffect(() => {
    if (isNewNote) {
      setLoading(false);
      // Check for query params (e.g. ?shiftId=... or ?participantId=... or ?staffId=...)
      const params = new URLSearchParams(window.location.search);
      const shiftId = params.get('shiftId');
      const participantId = params.get('participantId');
      const staffId = params.get('staffId');

      if (shiftId) {
        handleFormChange('shift_id', shiftId);
        fetchShiftDetails(shiftId);
      }
      
      if (participantId) {
        handleFormChange('participant_id', participantId);
      }

      if (staffId) {
        handleFormChange('staff_id', staffId);
      }
      
      const initialData = { ...formData };
      if (onFormDataChange) onFormDataChange(initialData);
      if (onOriginalDataChange) onOriginalDataChange(initialData);
    } else {
      fetchShiftNote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewNote, fetchShiftNote]);

  const handleFormChange = (field: string, value: unknown) => {
    if (!canEdit) return;
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (onFormDataChange) onFormDataChange(updated);
      
      // Side effect: Auto-populate MTM when participant changes
      if (field === 'participant_id' && value && isNewNote) {
        fetchParticipantMtm(value);
      }
      
      return updated;
    });
  };

  const handleSave = useCallback(async () => {
    if (!canEdit) return;
    try {
      if (onSavingChange) onSavingChange(true);

      const dataToSave = { ...formData };
      // Clean up empty strings to null for better DB integrity
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === '' && key !== 'notes') {
          dataToSave[key] = null;
        }
      });

      if (isNewNote) {
        const { data, error } = await supabase
          .from('ic_shift_notes')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        toast.success('Shift note created successfully');
        navigate(`/shift-notes/detail/${data.id}`);
      } else {
        const { error } = await supabase
          .from('ic_shift_notes')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast.success('Shift note updated successfully');
        if (onOriginalDataChange) onOriginalDataChange(formData);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error saving shift note:', error);
      toast.error(error.message || 'Failed to save shift note');
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [canEdit, formData, isNewNote, id, navigate, onOriginalDataChange, onSavingChange]);

  // Expose save handler to parent
  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [handleSave, saveHandlerRef]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading shift note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
      <div id="shift_note_overview">
        <ShiftNoteOverviewSection 
          canEdit={canEdit} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_supports">
        <ShiftNoteSupportsSection 
          canEdit={canEdit} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_health">
        <ShiftNoteHealthSection 
          canEdit={canEdit} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_trackers">
        <ShiftNoteTrackersSection 
          canEdit={canEdit} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_summary">
        <ShiftNoteSummarySection 
          canEdit={canEdit} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>
    </div>
  );
}
