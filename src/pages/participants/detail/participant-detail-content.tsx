import { useCallback, useEffect, useRef, useState } from 'react';
import { participantDetailsApi } from '@/api/participant-details.api';
import { useAuth } from '@/auth/context/auth-context';
import { Participant } from '@/models/participant';
import {
  emptyParticipantPendingChanges,
  ParticipantPendingChanges,
} from '@/models/participant-pending-changes';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { handleAvatarUpload } from '@/lib/api/profiles';
import { NotificationService } from '@/lib/notification-service';
import { cn } from '@/lib/utils';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useParticipant, useUpdateParticipant } from '@/hooks/use-participants';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { useSettings } from '@/providers/settings-provider';
import { Scrollspy } from '@/components/ui/scrollspy';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { BehaviourSupport } from './components/behaviour-support';
import { ClinicalDetails } from './components/clinical-details';
import { ClinicalTrackersSetup } from './components/clinical-trackers-setup';
import { Contacts } from './components/contacts';
import { Documents } from './components/documents';
import { EmergencyManagement } from './components/emergency-management';
import { Goals } from './components/goals';
import { MealtimeManagement } from './components/mealtime-management';
import { MedicalRoutine } from './components/medical-routine';
import { Medications } from './components/medications';
import { PersonalDetails } from './components/personal-details';
import { ShiftNotes } from './components/shift-notes';
import { SupportNeeds } from './components/support-needs';
import { ParticipantDetailSidebar } from './participant-detail-sidebar';

const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--header-height)+var(--navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]',
};

interface ParticipantDetailContentProps {
  onFormDataChange?: (data: Record<string, any>) => void;
  onOriginalDataChange?: (data: Record<string, any>) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: ParticipantPendingChanges;
  onPendingChangesChange?: (changes: ParticipantPendingChanges) => void;
  updateParticipant?: (params: {
    id: string;
    updates: Partial<Participant>;
  }) => Promise<any>;
  onPhotoDirtyChange?: (dirty: boolean) => void;
  onSaveSuccess?: () => void;
}

export function ParticipantDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  updateParticipant,
  pendingChanges,
  onPendingChangesChange,
  onPhotoDirtyChange,
  onSaveSuccess,
}: ParticipantDetailContentProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { settings } = useSettings();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [participant, setParticipant] = useState<Participant | undefined>();
  const [, setOriginalData] = useState<Record<string, any>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  const latestPendingChanges = useRef<ParticipantPendingChanges>(
    pendingChanges || emptyParticipantPendingChanges,
  );
  const latestFormData = useRef<Record<string, any>>({});
  const latestOriginalData = useRef<Record<string, any>>({});

  useEffect(() => {
    if (pendingChanges) {
      latestPendingChanges.current = pendingChanges;
    }
  }, [pendingChanges]);

  const [refreshKeys, setRefreshKeys] = useState({
    goals: 0,
    documents: 0,
    medications: 0,
    contacts: 0,
    shiftNotes: 0,
    activityLog: 0,
  });

  const { hasAccess } = useRBAC();

  // Granular RBAC Flags
  const canViewPersonal = hasAccess({
    resource: RBAC_MODULES.PARTICIPANTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditPersonal = hasAccess({
    resource: RBAC_MODULES.PARTICIPANTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewGoals = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_GOALS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditGoals = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_GOALS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });
  const canAddGoals = canEditGoals;
  const canDeleteGoals = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_GOALS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canViewBehaviour = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_BEHAVIOUR,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditBehaviour = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_BEHAVIOUR,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewSupportNeeds = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SUPPORT_NEEDS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditSupportNeeds = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SUPPORT_NEEDS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewMealtime = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEALTIME,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditMealtime = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEALTIME,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewMedicalRoutine = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditMedicalRoutine = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewClinicalTrackers = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_CLINICAL_TRACKERS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditClinicalTrackers = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_CLINICAL_TRACKERS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewMedications = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEDICATIONS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditMedications = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEDICATIONS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });
  const canAddMedications = canEditMedications;
  const canDeleteMedications = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_MEDICATIONS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canViewEmergency = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_EMERGENCY,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditEmergency = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_EMERGENCY,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canViewContacts = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_CONTACTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditContacts = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_CONTACTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });
  const canAddContacts = canEditContacts;
  const canDeleteContacts = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_CONTACTS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canViewDocuments = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditDocuments = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });
  const canAddDocuments = canEditDocuments;
  const canDeleteDocuments = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canViewShiftNotes = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditShiftNotes = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });
  const canAddShiftNotes = canEditShiftNotes;
  const canDeleteShiftNotes = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canViewActivityLog = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_ACTIVITY_LOG,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    participant_name: '',
    email: '',
    house_phone: '',
    personal_mobile: '',
    address: '',
    date_of_birth: '',
    move_in_date: '',
    ndis_number: '',
    house_id: '',
    photo_url: '',
    status: 'draft',
    support_level: '',
    support_coordinator: '',
    primary_diagnosis: '',
    secondary_diagnosis: '',
    allergies: '',
    routine: '',
    hygiene_support: '',
    mobility_support: '',
    meal_prep_support: '',
    household_support: '',
    communication_type: '',
    communication_notes: '',
    communication_language_needs: '',
    finance_support: '',
    health_wellbeing_support: '',
    cultural_religious_support: '',
    other_support: '',
    mental_health_plan: '',
    medical_plan: '',
    natural_disaster_plan: '',
    pharmacy_name: '',
    pharmacy_contact: '',
    pharmacy_location: '',
    gp_name: '',
    gp_contact: '',
    gp_location: '',
    psychiatrist_name: '',
    psychiatrist_contact: '',
    psychiatrist_location: '',
    medical_routine_other: '',
    medical_routine_general_process: '',
    current_goals: '',
    restrictive_practices: '',
    behaviour_of_concern: '',
    pbsp_engaged: null,
    bsp_available: null,
    restrictive_practices_yn: null,
    specialist_name: '',
    specialist_phone: '',
    specialist_email: '',
    restrictive_practice_authorisation: null,
    restrictive_practice_details: '',
    mtmp_required: null,
    mtmp_details: '',
    track_bowel: false,
    track_seizure: false,
    track_sleep: false,
    track_behaviour: false,
    track_community: false,
    track_nutrition: false,
    track_mtm: false,
    track_hygiene: false,
  });

  const { data: participantData, isLoading: participantLoading } =
    useParticipant(id);
  const { mutateAsync: updateParticipantFromHook } = useUpdateParticipant();
  const updateParticipantFn = updateParticipant || updateParticipantFromHook;

  const { validationErrors, setFieldError, scrollToField } =
    useFormValidation();

  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  useEffect(() => {
    const photoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
    onPhotoDirtyChange?.(photoDirty);
  }, [photoFile, photoPreview, originalPhotoUrl, onPhotoDirtyChange]);

  useEffect(() => {
    if (participantData && !hasInitialized) {
      setParticipant(participantData);
      const mappedData: any = {
        participant_name: participantData.participant_name ?? '',
        email: participantData.email ?? '',
        house_phone: participantData.house_phone ?? '',
        personal_mobile: participantData.personal_mobile ?? '',
        address: participantData.address ?? '',
        date_of_birth: participantData.date_of_birth ?? '',
        move_in_date: participantData.move_in_date ?? '',
        ndis_number: participantData.ndis_number ?? '',
        house_id: participantData.house_id ?? '',
        status: participantData.status ?? 'active',
        support_level: participantData.support_level ?? '',
        support_coordinator: participantData.support_coordinator ?? '',
        primary_diagnosis: participantData.primary_diagnosis ?? '',
        secondary_diagnosis: participantData.secondary_diagnosis ?? '',
        allergies: participantData.allergies ?? '',
        routine: participantData.routine ?? '',
        hygiene_support: participantData.hygiene_support ?? '',
        mobility_support: participantData.mobility_support ?? '',
        meal_prep_support: participantData.meal_prep_support ?? '',
        household_support: participantData.household_support ?? '',
        communication_type: participantData.communication_type ?? '',
        communication_notes: participantData.communication_notes ?? '',
        communication_language_needs:
          participantData.communication_language_needs ?? '',
        finance_support: participantData.finance_support ?? '',
        health_wellbeing_support:
          participantData.health_wellbeing_support ?? '',
        cultural_religious_support:
          participantData.cultural_religious_support ?? '',
        other_support: participantData.other_support ?? '',
        mental_health_plan: participantData.mental_health_plan ?? '',
        medical_plan: participantData.medical_plan ?? '',
        natural_disaster_plan: participantData.natural_disaster_plan ?? '',
        pharmacy_name: participantData.pharmacy_name ?? '',
        pharmacy_contact: participantData.pharmacy_contact ?? '',
        pharmacy_location: participantData.pharmacy_location ?? '',
        gp_name: participantData.gp_name ?? '',
        gp_contact: participantData.gp_contact ?? '',
        gp_location: participantData.gp_location ?? '',
        psychiatrist_name: participantData.psychiatrist_name ?? '',
        psychiatrist_contact: participantData.psychiatrist_contact ?? '',
        psychiatrist_location: participantData.psychiatrist_location ?? '',
        medical_routine_other: participantData.medical_routine_other ?? '',
        medical_routine_general_process:
          participantData.medical_routine_general_process ?? '',
        current_goals: participantData.current_goals ?? '',
        restrictive_practices: participantData.restrictive_practices ?? '',
        behaviour_of_concern: participantData.behaviour_of_concern ?? '',
        pbsp_engaged: participantData.pbsp_engaged ?? null,
        bsp_available: participantData.bsp_available ?? null,
        restrictive_practices_yn:
          participantData.restrictive_practices_yn ?? null,
        specialist_name: participantData.specialist_name ?? '',
        specialist_phone: participantData.specialist_phone ?? '',
        specialist_email: participantData.specialist_email ?? '',
        restrictive_practice_authorisation:
          participantData.restrictive_practice_authorisation ?? null,
        restrictive_practice_details:
          participantData.restrictive_practice_details ?? '',
        mtmp_required: participantData.mtmp_required ?? null,
        mtmp_details: participantData.mtmp_details ?? '',
        photo_url: participantData.photo_url ?? '',
        track_bowel: participantData.track_bowel ?? false,
        track_seizure: participantData.track_seizure ?? false,
        track_sleep: participantData.track_sleep ?? false,
        track_behaviour: participantData.track_behaviour ?? false,
        track_community: participantData.track_community ?? false,
        track_nutrition: participantData.track_nutrition ?? false,
        track_mtm: participantData.track_mtm ?? false,
        track_hygiene: participantData.track_hygiene ?? false,
      };

      setFormData(mappedData);
      setOriginalData(mappedData);
      latestFormData.current = mappedData;
      latestOriginalData.current = mappedData;

      setOriginalPhotoUrl(participantData.photo_url ?? null);
      if (participantData.photo_url) setPhotoPreview(participantData.photo_url);
      setHasInitialized(true);
      (window as any).entityName = participantData.participant_name;
    }
  }, [participantData, hasInitialized]);

  // Sync state to parent on mount or when formData is fully loaded/updated
  useEffect(() => {
    if (hasInitialized && !participantLoading) {
      onOriginalDataChange?.(latestOriginalData.current);
    }
  }, [hasInitialized, participantLoading, onOriginalDataChange]);

  useEffect(() => {
    if (hasInitialized && !participantLoading) {
      latestFormData.current = formData;
      onFormDataChange?.(formData);
    }
  }, [formData, hasInitialized, participantLoading, onFormDataChange]);

  const loading = participantLoading && !hasInitialized;

  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  const handleFormChange = useCallback((field: string, value: any) => {
    if (field === 'photo_file') {
      setPhotoFile(value);
      return;
    }
    if (field === 'photo_url_preview') {
      setPhotoPreview(value);
      return;
    }
    const normalizedValue = field === 'is_active' ? value === 'true' : value;

    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
  }, []);

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    const currentOriginalData = latestOriginalData.current;

    if (!id || !participant) return;

    if (onSavingChange) onSavingChange(true);

    try {
      // 1. Use the new DAL to synchronize all child entities in bulk
      await participantDetailsApi.syncDetails(id, currentPending);

      // 2. Process pending documents (Storage operations + DB)
      if (canEditDocuments) {
        if (currentPending.documents.toAdd.length > 0) {
          for (const doc of currentPending.documents.toAdd) {
            await participantDetailsApi.documents.upload(id, doc.file);
          }
        }

        if (
          canDeleteDocuments &&
          currentPending.documents.toDelete.length > 0
        ) {
          const ids = currentPending.documents.toDelete.map((d) => d.id);
          const filePaths = currentPending.documents.toDelete.map(
            (d) => d.filePath,
          );
          await participantDetailsApi.documents.bulkDelete(ids, filePaths);
        }
      }

      // 3. Profile Photo handling
      if (canEditPersonal) {
        if (photoFile) {
          const newPhotoUrl = await handleAvatarUpload(
            photoFile,
            STORAGE_BUCKETS.PARTICIPANT_PHOTOS,
            id,
          );

          const { id: updatedId } = await updateParticipantFn({
            id,
            updates: { photo_url: newPhotoUrl },
          });
          if (!updatedId) throw new Error('Failed to update photo');
          setOriginalPhotoUrl(newPhotoUrl);
          setPhotoFile(null);
          setPhotoPreview(newPhotoUrl);
          setFormData((prev) => ({ ...prev, photo_url: newPhotoUrl }));
          latestFormData.current = {
            ...currentFormData,
            photo_url: newPhotoUrl,
          };
        } else if (photoPreview === null && originalPhotoUrl !== null) {
          const { id: updatedId } = await updateParticipantFn({
            id,
            updates: { photo_url: null },
          });
          if (!updatedId) throw new Error('Failed to update photo');
          setOriginalPhotoUrl(null);
          setFormData((prev) => ({ ...prev, photo_url: null }));
          latestFormData.current = { ...currentFormData, photo_url: null };
        }
      }

      // 4. Save main participant form data
      const normalizedFormData = { ...currentFormData };
      const excludeFields = [
        'photo_url',
        'photo_file',
        'photo_url_preview',
        'updated_at',
        'created_at',
      ];

      Object.keys(normalizedFormData).forEach((key) => {
        if (excludeFields.includes(key)) {
          delete (normalizedFormData as any)[key];
        } else if (normalizedFormData[key] === '') {
          normalizedFormData[key] = null;
        }
      });

      const changedFields: Record<string, any> = {};
      Object.keys(normalizedFormData).forEach((key) => {
        const newValue = normalizedFormData[key];
        const oldValue = currentOriginalData[key];

        let canUpdateField = false;

        const personalFields = [
          'participant_name',
          'email',
          'house_phone',
          'personal_mobile',
          'address',
          'date_of_birth',
          'move_in_date',
          'ndis_number',
          'house_id',
          'status',
          'support_level',
          'support_coordinator',
        ];
        const behaviourFields = [
          'behaviour_of_concern',
          'pbsp_engaged',
          'bsp_available',
          'restrictive_practices_yn',
          'specialist_name',
          'specialist_phone',
          'specialist_email',
          'restrictive_practice_authorisation',
          'restrictive_practice_details',
        ];
        const supportNeedsFields = [
          'routine',
          'hygiene_support',
          'mobility_support',
          'meal_prep_support',
          'household_support',
          'communication_type',
          'communication_notes',
          'communication_language_needs',
          'finance_support',
          'health_wellbeing_support',
          'cultural_religious_support',
          'other_support',
        ];
        const mealtimeFields = ['mtmp_required', 'mtmp_details'];
        const medicalRoutineFields = [
          'pharmacy_name',
          'pharmacy_contact',
          'pharmacy_location',
          'gp_name',
          'gp_contact',
          'gp_location',
          'psychiatrist_name',
          'psychiatrist_contact',
          'psychiatrist_location',
          'medical_routine_other',
          'medical_routine_general_process',
          'mental_health_plan',
          'medical_plan',
          'primary_diagnosis',
          'secondary_diagnosis',
          'allergies',
        ];
        const clinicalTrackersFields = [
          'track_bowel',
          'track_seizure',
          'track_sleep',
          'track_behaviour',
          'track_community',
          'track_nutrition',
          'track_mtm',
          'track_hygiene',
        ];
        const emergencyFields = ['natural_disaster_plan'];

        if (personalFields.includes(key)) canUpdateField = canEditPersonal;
        else if (behaviourFields.includes(key))
          canUpdateField = canEditBehaviour;
        else if (supportNeedsFields.includes(key))
          canUpdateField = canEditSupportNeeds;
        else if (mealtimeFields.includes(key)) canUpdateField = canEditMealtime;
        else if (medicalRoutineFields.includes(key))
          canUpdateField = canEditMedicalRoutine;
        else if (clinicalTrackersFields.includes(key))
          canUpdateField = canEditClinicalTrackers;
        else if (emergencyFields.includes(key))
          canUpdateField = canEditEmergency;

        if (newValue !== oldValue && canUpdateField)
          changedFields[key] = newValue;
      });

      if (Object.keys(changedFields).length > 0) {
        if (
          !currentFormData.participant_name &&
          changedFields.participant_name !== undefined
        ) {
          setFieldError('participant_name', 'Name is required');
          scrollToField('participant_name');
          toast.error('Validation Error', { description: 'Name is required' });
          return;
        }
        await updateParticipantFn({ id, updates: changedFields });

        if (participant?.house_id) {
          const routineFields = [
            'routine',
            'medical_routine_general_process',
            'behaviour_of_concern',
            'restrictive_practices',
          ];
          const hasRoutineChange = routineFields.some((field) =>
            Object.keys(changedFields).includes(field),
          );
          if (hasRoutineChange) {
            await NotificationService.notifyAssignedStaff(
              participant.house_id,
              participant.id,
              participant.participant_name || 'Participant',
              'routine',
            );
          }
        }
      }

      // 5. Handle notifications for bulk-synced changes
      if (participant?.house_id) {
        if (
          currentPending.medications.toAdd.length > 0 ||
          currentPending.medications.toUpdate.length > 0
        ) {
          await NotificationService.notifyAssignedStaff(
            participant.house_id,
            participant.id,
            participant.participant_name || 'Participant',
            'medication',
          );
        }
        if (
          currentPending.shiftNotes.toAdd.length > 0 ||
          currentPending.shiftNotes.toUpdate.length > 0
        ) {
          await NotificationService.notifyAssignedStaff(
            participant.house_id,
            participant.id,
            participant.participant_name || 'Participant',
            'note',
          );
        }
      }

      // Reset state and refs
      setOriginalData(normalizedFormData);
      setFormData(normalizedFormData);
      latestOriginalData.current = normalizedFormData;
      latestFormData.current = normalizedFormData;
      onOriginalDataChange?.(normalizedFormData);
      onFormDataChange?.(normalizedFormData);

      if (onPendingChangesChange) {
        onPendingChangesChange(emptyParticipantPendingChanges);
        latestPendingChanges.current = emptyParticipantPendingChanges;
      }

      // Invalidate queries to refresh data from server
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANTS, id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_CONTACTS, id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, id],
      });

      setRefreshKeys((prev) => ({
        goals: prev.goals + 1,
        documents: prev.documents + 1,
        medications: prev.medications + 1,
        contacts: prev.contacts + 1,
        shiftNotes: prev.shiftNotes + 1,
        activityLog: prev.activityLog + 1,
      }));

      toast.success('Changes saved successfully');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error('Error updating participant:', err);
      toast.error('Failed to save changes', { description: err.message });
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [
    id,
    participant,
    updateParticipantFn,
    onSavingChange,
    onOriginalDataChange,
    onPendingChangesChange,
    onSaveSuccess,
    setFieldError,
    scrollToField,
    photoFile,
    photoPreview,
    originalPhotoUrl,
    queryClient,
    onFormDataChange,
    canEditPersonal,
    canEditGoals,
    canDeleteGoals,
    canEditBehaviour,
    canEditSupportNeeds,
    canEditMealtime,
    canEditMedicalRoutine,
    canEditMedications,
    canDeleteMedications,
    canEditEmergency,
    canEditContacts,
    canDeleteContacts,
    canEditDocuments,
    canDeleteDocuments,
    canEditShiftNotes,
    canDeleteShiftNotes,
  ]);

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [handleSave, saveHandlerRef]);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading participant details...</p>
      </div>
    );
  }

  if (!participant && !participantLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Participant not found.</p>
      </div>
    );
  }

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {!isMobile && (
        <div className="w-[230px] shrink-0">
          <div
            className={cn(
              'w-[230px]',
              sidebarSticky && `fixed z-10 start-auto ${stickyClass}`,
            )}
          >
            <Scrollspy offset={100} targetRef={parentRef}>
              <ParticipantDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        {canViewPersonal && (
          <PersonalDetails
            formData={{ ...formData, photo_url_preview: photoPreview }}
            onFormChange={handleFormChange}
            validationErrors={validationErrors}
            canEdit={canEditPersonal}
            onSave={handleSave}
          />
        )}

        {canViewGoals && (
          <Goals
            participantId={id}
            canAdd={canAddGoals}
            canDelete={canDeleteGoals}
            canEdit={canEditGoals}
            pendingChanges={pendingChanges?.goals}
            onPendingChangesChange={(goalsChanges) =>
              pendingChanges &&
              onPendingChangesChange?.({
                ...pendingChanges,
                goals: goalsChanges,
              })
            }
            refreshTrigger={refreshKeys.goals}
          />
        )}

        {canViewBehaviour && (
          <BehaviourSupport
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditBehaviour}
            onSave={handleSave}
          />
        )}

        {canViewSupportNeeds && (
          <SupportNeeds
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditSupportNeeds}
          />
        )}

        {canViewMealtime && (
          <MealtimeManagement
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditMealtime}
          />
        )}

        {canViewMedicalRoutine && (
          <ClinicalDetails
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditMedicalRoutine}
          />
        )}

        {canViewClinicalTrackers && (
          <ClinicalTrackersSetup
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditClinicalTrackers}
          />
        )}

        {canViewMedicalRoutine && (
          <MedicalRoutine
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditMedicalRoutine}
          />
        )}

        {canViewMedications && (
          <Medications
            participantId={id}
            canAdd={canAddMedications}
            canDelete={canDeleteMedications}
            canEdit={canEditMedications}
            pendingChanges={pendingChanges?.medications}
            onPendingChangesChange={(medsChanges) =>
              pendingChanges &&
              onPendingChangesChange?.({
                ...pendingChanges,
                medications: medsChanges,
              })
            }
          />
        )}

        {canViewEmergency && (
          <EmergencyManagement
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={canEditEmergency}
          />
        )}

        {canViewContacts && (
          <Contacts
            participantId={id}
            canAdd={canAddContacts}
            canDelete={canDeleteContacts}
            canEdit={canEditContacts}
            pendingChanges={pendingChanges?.contacts}
            onPendingChangesChange={(contactsChanges) =>
              pendingChanges &&
              onPendingChangesChange?.({
                ...pendingChanges,
                contacts: contactsChanges,
              })
            }
          />
        )}

        {canViewDocuments && (
          <Documents
            participantId={id}
            canAdd={canAddDocuments}
            canDelete={canDeleteDocuments}
            canEdit={canEditDocuments}
            pendingChanges={pendingChanges?.documents}
            onPendingChangesChange={(docsChanges) =>
              pendingChanges &&
              onPendingChangesChange?.({
                ...pendingChanges,
                documents: docsChanges,
              })
            }
          />
        )}

        {canViewShiftNotes && (
          <ShiftNotes
            participantId={id}
            canAdd={canAddShiftNotes}
            canDelete={canDeleteShiftNotes}
            canEdit={canEditShiftNotes}
            pendingChanges={pendingChanges?.shiftNotes}
            onPendingChangesChange={(notesChanges) =>
              pendingChanges &&
              onPendingChangesChange?.({
                ...pendingChanges,
                shiftNotes: notesChanges,
              })
            }
          />
        )}

        {canViewActivityLog && (
          <ActivityLog
            entityId={id}
            entityType="participant"
            refreshTrigger={refreshKeys.activityLog}
          />
        )}
      </div>
    </div>
  );
}
