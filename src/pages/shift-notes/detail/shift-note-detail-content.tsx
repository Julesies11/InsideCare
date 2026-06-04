import { useState, useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftNotesApi } from '@/api/shift-notes.api';
import { rosterApi } from '@/api/roster.api';
import { participantsApi } from '@/api/participants.api';
import { SHIFT_PERIODS } from '@/config/enums';
import { ShiftNoteOverviewSection } from '../components/sections/shift-note-overview-section';
import { ShiftNoteSupportsSection } from '../components/sections/shift-note-supports-section';
import { ShiftNoteHealthSection } from '../components/sections/shift-note-health-section';
import { ShiftNoteTrackersSection } from '../components/sections/shift-note-trackers-section';
import { ShiftNoteSummarySection } from '../components/sections/shift-note-summary-section';
import { ROUTES } from '@/config/routes.config';
import { QUERY_KEYS } from '@/config/query-keys';

interface ShiftNoteDetailContentProps {
  onFormDataChange?: (data: Record<string, unknown>) => void;
  onOriginalDataChange?: (data: Record<string, unknown>) => void;
  onSavingChange?: (saving: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
  saveHandlerRef?: MutableRefObject<(() => Promise<void>) | null>;
  canEdit: boolean;
}

export function ShiftNoteDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  onLoadingChange,
  saveHandlerRef,
  canEdit,
}: ShiftNoteDetailContentProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const originalDataRef = useRef<Record<string, unknown> | null>(null);
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
    mtm_texture_notes: '',
    mtm_consistency_notes: '',
    mtm_positioning_notes: '',
    mtm_supervision_notes: '',
    hygiene_support_required: false,
    hygiene_shower: null,
    hygiene_oral_care: null,
    hygiene_toileting: null,
    hygiene_grooming: null,
    hygiene_observed_concerns: '',
    hygiene_notes: '',
  });

  const isNewNote = id === 'new' || id === 'undefined' || !id;

  const { isShiftLocked, isParticipantLocked } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const queryShiftId = params.get('shiftId');
    const queryParticipantId = params.get('participantId');

    return {
      isShiftLocked: !!queryShiftId || (!isNewNote && !!formData.shift_id),
      isParticipantLocked: !!queryParticipantId || (!isNewNote && !!formData.participant_id),
    };
  }, [isNewNote, formData.shift_id, formData.participant_id]);

  // Auto-populate Mealtime Management from Participant Profile
  const fetchParticipantMtm = async (participantId: string) => {
    if (!participantId || !isNewNote) return;

    try {
      const data = await participantsApi.get(participantId);

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
      const data = await rosterApi.getShift(shiftId);

      if (data) {
        const mappedType = data.shift_template?.toLowerCase();
        const isValidType = Object.values(SHIFT_PERIODS).includes(mappedType as any);

        // Batch update to prevent multiple re-renders
        const updates: Record<string, any> = {
          shift_id: shiftId,
          start_date: data.start_date,
          shift_time: data.start_time,
          end_time: data.end_time,
          house_id: data.house_id,
          staff_id: data.staff_id
        };

        if (isValidType) {
          updates.shift_type = mappedType;
        }

        handleBulkChange(updates);
      }
    } catch (err) {
      console.error('Error fetching shift details:', err);
    }
  };

  const fetchShiftNote = useCallback(async () => {
    if (!id || id === 'new' || id === 'undefined') return;

    try {
      setLoading(true);
      const data = await shiftNotesApi.get(id);

      if (!data) throw new Error("Shift note not found");

      setFormData(data);
      originalDataRef.current = data;
      if (onFormDataChange) onFormDataChange(data);
      if (onOriginalDataChange) onOriginalDataChange(data);
    } catch (err) {
      console.error('Error fetching shift note:', err);
      toast.error('Failed to load shift note');
    } finally {
      setLoading(false);
    }
  }, [id, queryClient, onFormDataChange, onOriginalDataChange]);

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
    } else {
      fetchShiftNote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewNote, fetchShiftNote]);

  // Sync state to parent on mount or when formData is fully loaded/updated
  useEffect(() => {
    if (onLoadingChange) onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!loading && !originalDataRef.current) {
      originalDataRef.current = formData;
      onOriginalDataChange?.(formData);
    }
  }, [loading, formData, onOriginalDataChange]);

  useEffect(() => {
    if (!loading) {
      onFormDataChange?.(formData);
    }
  }, [loading, formData, onFormDataChange]);

  const handleFormChange = (field: string, value: unknown) => {
    if (!canEdit) return;

    setFormData(prev => ({ ...prev, [field]: value }));

    // Side effect: Auto-populate MTM when participant changes
    if (field === 'participant_id' && value && isNewNote) {
      fetchParticipantMtm(value as string);
    }
  };

  const handleBulkChange = (changes: Record<string, unknown>) => {
    if (!canEdit) return;

    setFormData(prev => ({ ...prev, ...changes }));

    // Side effect: Auto-populate MTM if participant_id is in the changes
    if (changes.participant_id && isNewNote) {
      fetchParticipantMtm(changes.participant_id as string);
    }
  };

  const handleSave = useCallback(async () => {
    if (!canEdit) return;

    if (!formData.start_date) {
      toast.error('Date is required to save a shift note');
      return;
    }

    if (!formData.shift_id) {
      toast.error('A linked shift is required to save a shift note');
      return;
    }

    try {
      if (onSavingChange) onSavingChange(true);

      const validColumns = [
        'participant_id', 'staff_id', 'start_date', 'shift_time', 'house_id', 'shift_id', 
        'notes', 'full_note', 'status', 'shift_type', 'risks_observed', 'risk_description', 
        'overall_presentation', 'adl_supports', 'domestic_tasks', 'capacity_building_goals', 
        'regular_medication_status', 'prn_medication_given', 'prn_description', 
        'pbs_strategies_used', 'pbs_strategies_details', 'pbs_when_used', 'pbs_outcome', 
        'restrictive_practices_status', 'shift_summary', 'bowel_movement_occurred', 
        'bowel_time', 'bowel_bristol_scale', 'bowel_amount', 'bowel_assistance_required', 
        'bowel_notes', 'seizure_occurred', 'seizure_time_started', 'seizure_duration_minutes', 
        'seizure_type_id', 'seizure_description', 'seizure_injury_occurred', 
        'seizure_injury_description', 'seizure_emergency_services', 'seizure_notes', 
        'sleep_occurred', 'sleep_type_period', 'sleep_start_time', 'sleep_wake_time', 
        'sleep_quality', 'sleep_support_required', 'behaviour_observed', 
        'behaviour_type_id', 'behaviour_intensity', 'behaviour_notes', 
        'community_access_occurred', 'community_activity_type', 'community_location', 
        'community_engagement_level', 'community_notes', 'meal_provided', 
        'nutrition_meal_type', 'nutrition_intake', 'nutrition_refusal_alternatives', 
        'nutrition_assistance_needed', 'nutrition_fluids_intake', 'nutrition_notes', 
        'mtm_meal_provided', 'mtm_diet_type', 'mtm_fluids', 'mtm_texture_correct', 
        'mtm_consistency_correct', 'mtm_positioning_appropriate', 'mtm_supervision_required', 
        'mtm_swallowing_concerns', 'mtm_meal_intake', 'mtm_meal_intake_notes', 
        'mtm_fluid_intake', 'mtm_fluid_intake_notes', 'mtm_concerns', 'mtm_notes', 
        'mtm_texture_notes', 'mtm_consistency_notes', 'mtm_positioning_notes', 'mtm_supervision_notes',
        'hygiene_support_required', 'hygiene_shower', 'hygiene_oral_care', 
        'hygiene_toileting', 'hygiene_grooming', 'hygiene_observed_concerns', 'hygiene_notes'
      ];

      const dataToSave: Record<string, any> = {};
      
      // Only include valid database columns and clean up values
      Object.keys(formData).forEach(key => {
        if (validColumns.includes(key)) {
          let value = formData[key];
          // Clean up empty strings to null for better DB integrity
          if (value === '' && key !== 'notes') {
            value = null;
          }
          dataToSave[key] = value;
        }
      });

      if (isNewNote) {
        const data = await shiftNotesApi.upsert(dataToSave);
        
        // Invalidate queries to refresh lists
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

        toast.success('Shift note created successfully');
        navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${data.id}`, { replace: true });
      } else {
        await shiftNotesApi.update(id as string, dataToSave);

        // Update original data to match current form data after successful save
        originalDataRef.current = formData;
        if (onOriginalDataChange) onOriginalDataChange(formData);

        // Invalidate queries to refresh lists
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

        toast.success('Shift note updated successfully');
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
          onBulkChange={handleBulkChange}
          isShiftLocked={isShiftLocked}
          isParticipantLocked={isParticipantLocked}
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
