import { useState, useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
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
import { generateShiftNoteReferenceId } from '@/lib/shift-note-utils';
import { QUERY_KEYS } from '@/config/query-keys';

const DEFAULT_FORM_STATE: Record<string, unknown> = {
  start_date: '',
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
};

interface ShiftNoteDetailContentProps {
  onFormDataChange?: (data: Record<string, unknown>) => void;
  onOriginalDataChange?: (data: Record<string, unknown>) => void;
  onSavingChange?: (saving: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
  saveHandlerRef?: MutableRefObject<((status?: 'draft' | 'active') => Promise<void>) | null>;
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
  const location = useLocation();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const originalDataRef = useRef<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({
    ...DEFAULT_FORM_STATE,
    start_date: new Date().toISOString().split('T')[0],
  }));

  const isNewNote = id === 'new' || id === 'undefined' || !id;

  const { isShiftLocked, isParticipantLocked } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const queryShiftId = params.get('shiftId');

    return {
      isShiftLocked: !!queryShiftId || (!isNewNote && !!formData.shift_id),
      isParticipantLocked: false,
    };
  }, [isNewNote, formData.shift_id]);

  // Auto-populate Care Plan details & Trackers from Participant Profile
  const fetchParticipantDetails = async (participantId: string) => {
    if (!participantId || !isNewNote) return;

    try {
      const data = await participantsApi.get(participantId);

      if (data) {
        const updates: Record<string, any> = {
          participant: data,
          bowel_movement_occurred: !!data.track_bowel,
          seizure_occurred: !!data.track_seizure,
          sleep_occurred: !!data.track_sleep,
          behaviour_observed: !!data.track_behaviour,
          community_access_occurred: !!data.track_community,
          meal_provided: !!data.track_nutrition,
          mtm_meal_provided: !!data.track_mtm,
          hygiene_support_required: !!data.track_hygiene,
        };

        if (data.mtmp_required) {
          updates.mtm_meal_provided = true;
          updates.mtm_notes = `Auto-populated from Care Plan: ${data.mtmp_details || ''}`;
        }

        handleBulkChange(updates);
      }
    } catch (err) {
      console.error('Error auto-populating participant details:', err);
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
          staff_id: data.staff_id,
          shift: data
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
    const initNewNote = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(window.location.search);
        const shiftId = params.get('shiftId');
        const participantId = params.get('participantId');
        const staffId = params.get('staffId');

        // Start with a copy of initial default state
        const initialForm = {
          ...DEFAULT_FORM_STATE,
          start_date: new Date().toISOString().split('T')[0],
        };

        if (staffId) {
          initialForm.staff_id = staffId;
        }
        if (participantId) {
          initialForm.participant_id = participantId;
        }

        // Fetch shift details if shiftId exists
        if (shiftId) {
          initialForm.shift_id = shiftId;
          try {
            const shiftData = await rosterApi.getShift(shiftId);
            if (shiftData) {
              initialForm.start_date = shiftData.start_date;
              initialForm.shift_time = shiftData.start_time;
              initialForm.end_time = shiftData.end_time;
              initialForm.house_id = shiftData.house_id;
              initialForm.staff_id = shiftData.staff_id;
              initialForm.shift = shiftData;
              if (shiftData.staff_info) {
                initialForm.staff = shiftData.staff_info;
              }
              
              const mappedType = shiftData.shift_template?.toLowerCase();
              if (Object.values(SHIFT_PERIODS).includes(mappedType as any)) {
                initialForm.shift_type = mappedType as any;
              }
            }
          } catch (err) {
            console.error('Error fetching shift details for new note:', err);
          }
        }

        // Fetch participant details and configure trackers if participantId exists
        if (participantId) {
          try {
            const partData = await participantsApi.get(participantId);
            if (partData) {
              initialForm.participant = partData;
              initialForm.bowel_movement_occurred = !!partData.track_bowel;
              initialForm.seizure_occurred = !!partData.track_seizure;
              initialForm.sleep_occurred = !!partData.track_sleep;
              initialForm.behaviour_observed = !!partData.track_behaviour;
              initialForm.community_access_occurred = !!partData.track_community;
              initialForm.meal_provided = !!partData.track_nutrition;
              initialForm.mtm_meal_provided = !!partData.track_mtm;
              initialForm.hygiene_support_required = !!partData.track_hygiene;

              if (partData.mtmp_required) {
                initialForm.mtm_meal_provided = true;
                initialForm.mtm_notes = `Auto-populated from Care Plan: ${partData.mtmp_details || ''}`;
              }
            }
          } catch (err) {
            console.error('Error auto-populating trackers for new note:', err);
          }
        }

        // Apply fully populated state to keep form pristine (not dirty)
        setFormData(initialForm);
        originalDataRef.current = initialForm;
        onFormDataChange?.(initialForm);
        onOriginalDataChange?.(initialForm);
      } catch (err) {
        console.error('Error initializing new shift note:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isNewNote) {
      initNewNote();
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

  const isEditable = canEdit && formData?.status !== 'active';

  const handleFormChange = (field: string, value: unknown) => {
    if (!isEditable) return;

    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'participant_id' && isNewNote) {
      if (value) {
        fetchParticipantDetails(value as string);
      } else {
        handleBulkChange({
          participant: null,
          bowel_movement_occurred: false,
          seizure_occurred: false,
          sleep_occurred: false,
          behaviour_observed: false,
          community_access_occurred: false,
          meal_provided: false,
          mtm_meal_provided: false,
          hygiene_support_required: false,
        });
      }
    }
  };

  const handleBulkChange = (changes: Record<string, unknown>) => {
    if (!isEditable) return;

    setFormData(prev => ({ ...prev, ...changes }));

    if (changes.participant_id && isNewNote) {
      fetchParticipantDetails(changes.participant_id as string);
    }
  };

  const handleSave = useCallback(async (targetStatus?: 'draft' | 'active') => {
    if (!canEdit) return;

    if (!formData.start_date) {
      toast.error('Date is required to save a shift note');
      return;
    }

    if (!formData.shift_id) {
      toast.error('A linked shift is required to save a shift note');
      return;
    }

    const statusToSave = targetStatus || formData.status || 'draft';

    // Strict validation only on active (completed) note submission
    if (statusToSave === 'active') {
      if (!formData.overall_presentation?.trim()) {
        toast.error('Overall Presentation is required to submit a shift note');
        return;
      }
      if (!formData.shift_summary?.trim()) {
        toast.error('Shift Summary is required to submit a shift note');
        return;
      }
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

      // Set tracker occurrences explicitly based on participant's flags
      const participant = formData.participant as any;
      dataToSave.bowel_movement_occurred = !!participant?.track_bowel;
      dataToSave.seizure_occurred = !!participant?.track_seizure;
      dataToSave.sleep_occurred = !!participant?.track_sleep;
      dataToSave.behaviour_observed = !!participant?.track_behaviour;
      dataToSave.community_access_occurred = !!participant?.track_community;
      dataToSave.meal_provided = !!participant?.track_nutrition;
      dataToSave.mtm_meal_provided = !!participant?.track_mtm;
      dataToSave.hygiene_support_required = !!participant?.track_hygiene;

      // Explicitly set the target status
      dataToSave.status = statusToSave;

      if (isNewNote) {
        dataToSave.reference_id = generateShiftNoteReferenceId({
          startDate: formData.start_date as string,
          shiftTime: formData.shift_time as string,
          staffName: (formData.staff as any)?.staff_name || (formData.staff as any)?.name,
          participantName: (formData.participant as any)?.participant_name || (formData.participant as any)?.name,
          orgPrefix: 'SC'
        });

        const data = await shiftNotesApi.upsert(dataToSave);
        
        // Invalidate queries to refresh lists
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

        const msg = statusToSave === 'active' ? 'Shift note submitted successfully' : 'Draft saved successfully';
        toast.success(msg);

        // Update local and original values to reset dirty checker
        const updatedNote = { ...formData, id: data.id, status: statusToSave, reference_id: data.reference_id };
        setFormData(updatedNote);
        originalDataRef.current = updatedNote;
        onFormDataChange?.(updatedNote);
        onOriginalDataChange?.(updatedNote);

        if (statusToSave === 'active') {
          const fromPath = location.state?.from;
          navigate(fromPath || ROUTES.SHIFT_NOTES);
        } else {
          navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${data.id}`, { 
            replace: true,
            state: { from: location.state?.from }
          });
        }
      } else {
        await shiftNotesApi.update(id as string, dataToSave);

        // Update local and original values to reset dirty checker
        const updatedNote = { ...formData, status: statusToSave };
        setFormData(updatedNote);
        originalDataRef.current = updatedNote;
        if (onOriginalDataChange) onOriginalDataChange(updatedNote);

        // Invalidate queries to refresh lists
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

        const msg = statusToSave === 'active' ? 'Shift note submitted successfully' : 'Draft saved successfully';
        toast.success(msg);

        if (statusToSave === 'active') {
          const fromPath = location.state?.from;
          navigate(fromPath || ROUTES.SHIFT_NOTES);
        }
      }
    } catch (err: unknown) {
      console.error('Error saving shift note:', err);
      const error = err as any;
      let errorMessage = 'Failed to save shift note';
      if (error?.code === '23505' || error?.message?.includes('unique constraint')) {
        errorMessage = 'A shift note already exists for this participant on this shift. Please update the existing note instead.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [canEdit, formData, isNewNote, id, navigate, location, onOriginalDataChange, onSavingChange]);

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
          canEdit={isEditable} 
          formData={formData} 
          onFormChange={handleFormChange}
          onBulkChange={handleBulkChange}
          isShiftLocked={isShiftLocked}
          isParticipantLocked={isParticipantLocked}
        />
      </div>

      <div id="shift_note_supports">
        <ShiftNoteSupportsSection 
          canEdit={isEditable} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_health">
        <ShiftNoteHealthSection 
          canEdit={isEditable} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_trackers">
        <ShiftNoteTrackersSection 
          canEdit={isEditable} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>

      <div id="shift_note_summary">
        <ShiftNoteSummarySection 
          canEdit={isEditable} 
          formData={formData} 
          onFormChange={handleFormChange} 
        />
      </div>
    </div>
  );
}
