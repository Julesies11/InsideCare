import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { ParticipantDetailSidebar } from './participant-detail-sidebar';
import { PersonalDetails } from './components/personal-details';
import { BehaviourSupport } from './components/behaviour-support';
import { SupportNeeds } from './components/support-needs';
import { EmergencyManagement } from './components/emergency-management';
import { MedicalRoutine } from './components/medical-routine';
import { Goals } from './components/goals';
import { Documents } from './components/documents';
import { Medications } from './components/medications';
import { Contacts } from './components/contacts';
import { ShiftNotes } from './components/shift-notes';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { useUpdateParticipant, useParticipant } from '@/hooks/use-participants';
import { Participant } from '@/models/participant';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { NotificationService } from '@/lib/notification-service';
import { useFormValidation } from '@/hooks/use-form-validation';

import { ParticipantPendingChanges, emptyParticipantPendingChanges } from '@/models/participant-pending-changes';
import { MealtimeManagement } from './components/mealtime-management';

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
  updateParticipant?: (params: { id: string; updates: Partial<Participant> }) => Promise<any>;
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

  const { user } = useAuth();
  const { settings } = useSettings();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [participant, setParticipant] = useState<Participant | undefined>();
  const [, setOriginalData] = useState<Record<string, any>>({});
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const latestPendingChanges = useRef<ParticipantPendingChanges>(pendingChanges || emptyParticipantPendingChanges);
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
  
  const canEdit = true;
  const canAdd = true;
  const canDelete = true;
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
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
  });

  const { data: participantData, isLoading: participantLoading } = useParticipant(id);
  const { mutateAsync: updateParticipantFromHook } = useUpdateParticipant();
  const updateParticipantFn = updateParticipant || updateParticipantFromHook;

  const { validationErrors, setFieldError, scrollToField } = useFormValidation();

  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });
  
  const userName = user?.fullname || user?.email || 'Unknown User';
  
  useEffect(() => {
    const photoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
    onPhotoDirtyChange?.(photoDirty);
  }, [photoFile, photoPreview, originalPhotoUrl, onPhotoDirtyChange]);

  useEffect(() => {
    if (participantData && !hasInitialized) {
      setParticipant(participantData);
      const initialData = {
        name: participantData.name ?? '',
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
        communication_language_needs: participantData.communication_language_needs ?? '',
        finance_support: participantData.finance_support ?? '',
        health_wellbeing_support: participantData.health_wellbeing_support ?? '',
        cultural_religious_support: participantData.cultural_religious_support ?? '',
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
        medical_routine_general_process: participantData.medical_routine_general_process ?? '',
        current_goals: participantData.current_goals ?? '',
        restrictive_practices: participantData.restrictive_practices ?? '',
        behaviour_of_concern: participantData.behaviour_of_concern ?? '',
        pbsp_engaged: participantData.pbsp_engaged ?? null,
        bsp_available: participantData.bsp_available ?? null,
        restrictive_practices_yn: participantData.restrictive_practices_yn ?? null,
        specialist_name: participantData.specialist_name ?? '',
        specialist_phone: participantData.specialist_phone ?? '',
        specialist_email: participantData.specialist_email ?? '',
        restrictive_practice_authorisation: participantData.restrictive_practice_authorisation ?? null,
        restrictive_practice_details: participantData.restrictive_practice_details ?? '',
        mtmp_required: participantData.mtmp_required ?? null,
        mtmp_details: participantData.mtmp_details ?? '',
        photo_url: participantData.photo_url ?? '',
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      latestFormData.current = initialData;
      latestOriginalData.current = initialData;

      requestAnimationFrame(() => {
        onOriginalDataChange?.(initialData);
        onFormDataChange?.(initialData);
      });
      
      setOriginalPhotoUrl(participantData.photo_url ?? null);
      if (participantData.photo_url) setPhotoPreview(participantData.photo_url);
      setHasInitialized(true);
      (window as any).entityName = participantData.name;
    }
  }, [participantData, hasInitialized, onFormDataChange, onOriginalDataChange]);

  const loading = participantLoading && !hasInitialized;

  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  const handleFormChange = useCallback((field: string, value: any) => {
    if (field === 'photo_file') { setPhotoFile(value); return; }
    if (field === 'photo_url_preview') { setPhotoPreview(value); return; }
    const normalizedValue = field === 'is_active' ? value === 'true' : value;
    
    setFormData((prev) => {
      const newData = { ...prev, [field]: normalizedValue };
      latestFormData.current = newData;
      onFormDataChange?.(newData);
      return newData;
    });
  }, [onFormDataChange]);

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    const currentOriginalData = latestOriginalData.current;

    if (!id || !participant) return;

    if (onSavingChange) onSavingChange(true);

    try {
      // Step 1: Process pending goals
      if (currentPending.goals.toAdd.length > 0) {
        const toInsert = currentPending.goals.toAdd.map(goal => ({
          participant_id: id,
          goal_type: goal.goal_type,
          description: goal.description || null,
          is_active: goal.is_active,
        }));
        
        const { error } = await supabase.from('participant_goals').insert(toInsert);
        if (error) throw new Error(`Failed to add goals: ${error.message}`);
        
        for (const goal of currentPending.goals.toAdd) {
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added goal "${goal.goal_type}"${goal.description ? ` (${goal.description})` : ''}`,
          });
        }
      }

      if (currentPending.goals.toUpdate.length > 0) {
        for (const goal of currentPending.goals.toUpdate) {
          const { error } = await supabase
            .from('participant_goals')
            .update({
              goal_type: goal.goal_type,
              description: goal.description || null,
              is_active: goal.is_active,
            })
            .eq('id', goal.id);
          if (error) throw new Error(`Failed to update goal: ${error.message}`);
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated goal "${goal.goal_type}"${goal.description ? ` (${goal.description})` : ''}`,
          });
        }
      }

      if (currentPending.goals.toDelete.length > 0) {
        const { data: goalRecords } = await supabase
          .from('participant_goals')
          .select('id, goal_type')
          .in('id', currentPending.goals.toDelete);

        const { error } = await supabase
          .from('participant_goals')
          .delete()
          .in('id', currentPending.goals.toDelete);
        
        if (error) throw new Error(`Failed to delete goals: ${error.message}`);
        
        if (goalRecords) {
          for (const record of goalRecords) {
            await logActivity({
              activityType: 'delete',
              entityType: 'participant',
              entityId: id,
              entityName: participant?.name,
              userName,
              customDescription: `Deleted goal "${record.goal_type || 'Unknown goal'}"`,
            });
          }
        }
      }

      // Step 2: Process pending medications
      if (currentPending.medications.toAdd.length > 0) {
        const toInsert = currentPending.medications.toAdd.map(med => ({
          participant_id: id,
          medication_id: med.medication_id,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          is_active: med.is_active,
        }));

        const { error } = await supabase.from('participant_medications').insert(toInsert);
        if (error) throw new Error(`Failed to add medications: ${error.message}`);
        
        if (participant?.house_id) {
          await NotificationService.notifyAssignedStaff(participant.house_id, participant.id, participant.name || 'Participant', 'medication');
        }
      }

      if (currentPending.medications.toUpdate.length > 0) {
        for (const med of currentPending.medications.toUpdate) {
          const { error } = await supabase
            .from('participant_medications')
            .update({
              medication_id: med.medication_id,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              is_active: med.is_active,
            })
            .eq('id', med.id);
          if (error) throw new Error(`Failed to update medication: ${error.message}`);
        }
        if (participant?.house_id) {
          await NotificationService.notifyAssignedStaff(participant.house_id, participant.id, participant.name || 'Participant', 'medication');
        }
      }

      if (currentPending.medications.toDelete.length > 0) {
        const { error } = await supabase
          .from('participant_medications')
          .delete()
          .in('id', currentPending.medications.toDelete);
        
        if (error) throw new Error(`Failed to delete medications: ${error.message}`);
      }

      // Step 3: Process pending contacts
      if (currentPending.contacts.toAdd.length > 0) {
        const toInsert = currentPending.contacts.toAdd.map(contact => ({
          participant_id: id,
          contact_name: contact.contact_name,
          contact_type_id: contact.contact_type_id,
          phone: contact.phone || null,
          email: contact.email || null,
          address: contact.address || null,
          notes: contact.notes || null,
          is_active: contact.is_active,
        }));

        const { error } = await supabase.from('participant_contacts').insert(toInsert);
        if (error) throw new Error(`Failed to add contacts: ${error.message}`);
        
        for (const contact of currentPending.contacts.toAdd) {
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added contact "${contact.contact_name}"`,
          });
        }
      }

      if (currentPending.contacts.toUpdate.length > 0) {
        for (const contact of currentPending.contacts.toUpdate) {
          const { error } = await supabase
            .from('participant_contacts')
            .update({
              contact_name: contact.contact_name,
              contact_type_id: contact.contact_type_id,
              phone: contact.phone || null,
              email: contact.email || null,
              address: contact.address || null,
              notes: contact.notes || null,
              is_active: contact.is_active,
            })
            .eq('id', contact.id);
          if (error) throw new Error(`Failed to update contact: ${error.message}`);
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated contact "${contact.contact_name}"`,
          });
        }
      }

      if (currentPending.contacts.toDelete.length > 0) {
        const { error } = await supabase
          .from('participant_contacts')
          .delete()
          .in('id', currentPending.contacts.toDelete);
        
        if (error) throw new Error(`Failed to delete contacts: ${error.message}`);
      }

      // Step 4: Process pending documents
      if (currentPending.documents.toAdd.length > 0) {
        const toInsert = [];
        for (const doc of currentPending.documents.toAdd) {
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${id}/documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('participant-documents')
            .upload(filePath, doc.file);

          if (uploadError) {
            throw new Error(`Failed to upload document "${doc.file.name}": ${uploadError.message}`);
          }

          toInsert.push({
            participant_id: id,
            file_name: doc.file.name,
            file_path: filePath,
            file_size: doc.file.size,
            mime_type: doc.file.type,
          });
        }

        const { error: dbError } = await supabase.from('participant_documents').insert(toInsert);
        if (dbError) throw new Error(`Failed to create document records: ${dbError.message}`);

        for (const doc of currentPending.documents.toAdd) {
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Uploaded document "${doc.file.name}"`,
          });
        }
      }

      if (currentPending.documents.toDelete.length > 0) {
        const ids = currentPending.documents.toDelete.map(d => d.id);
        const filePaths = currentPending.documents.toDelete.map(d => d.filePath);

        await supabase.storage.from('participant-documents').remove(filePaths);

        const { error: dbError } = await supabase.from('participant_documents').delete().in('id', ids);
        if (dbError) throw new Error(`Failed to delete document records: ${dbError.message}`);

        for (const doc of currentPending.documents.toDelete) {
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted document "${doc.fileName}"`,
          });
        }
      }

      // Profile Photo handling
      if (photoFile) {
        const file = photoFile;
        const ext = file.name.split('.').pop();
        const path = `${id}/profile/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('participant-documents')
          .upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('participant-documents').getPublicUrl(path);
        const newPhotoUrl = urlData.publicUrl;
        const { error: photoErr } = await supabase
          .from('participants')
          .update({ photo_url: newPhotoUrl, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (photoErr) throw photoErr;
        setOriginalPhotoUrl(newPhotoUrl);
        setPhotoFile(null);
        setPhotoPreview(newPhotoUrl);
        setFormData(prev => ({ ...prev, photo_url: newPhotoUrl }));
        latestFormData.current = { ...currentFormData, photo_url: newPhotoUrl };
        await logActivity({
          activityType: 'update',
          entityType: 'participant',
          entityId: id,
          entityName: currentFormData.name,
          userName,
          customDescription: 'Updated profile photo',
        });
      } else if (photoPreview === null && originalPhotoUrl !== null) {
        const { error: photoErr } = await supabase
          .from('participants')
          .update({ photo_url: null, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (photoErr) throw photoErr;
        setOriginalPhotoUrl(null);
        setFormData(prev => ({ ...prev, photo_url: null }));
        latestFormData.current = { ...currentFormData, photo_url: null };
        await logActivity({
          activityType: 'update',
          entityType: 'participant',
          entityId: id,
          entityName: currentFormData.name,
          userName,
          customDescription: 'Removed profile photo',
        });
      }

      // Step 4: Save main participant form data
      const normalizedFormData = { ...currentFormData };
      Object.keys(normalizedFormData).forEach(key => {
        if (normalizedFormData[key] === '') normalizedFormData[key] = null;
      });

      const changedFields: Record<string, any> = {};
      Object.keys(normalizedFormData).forEach((key) => {
        const newValue = normalizedFormData[key];
        const oldValue = currentOriginalData[key];
        if (newValue !== oldValue) changedFields[key] = newValue;
      });

      if (Object.keys(changedFields).length > 0) {
        if (!currentFormData.name) {
          setFieldError('name', 'Name is required');
          scrollToField('name');
          toast.error('Validation Error', { description: 'Name is required' });
          return;
        }
        await updateParticipantFn({ id, updates: changedFields });

        if (participant?.house_id) {
          const routineFields = ['routine', 'medical_routine_general_process', 'behaviour_of_concern', 'restrictive_practices'];
          const hasRoutineChange = routineFields.some(field => Object.keys(changedFields).includes(field));
          if (hasRoutineChange) {
            await NotificationService.notifyAssignedStaff(participant.house_id, participant.id, participant.name || 'Participant', 'routine');
          }
        }
      }

      // Detect changes for activity log
      const changes = detectChanges(currentOriginalData, normalizedFormData);
      if (Object.keys(changes).length > 0) {
        await logActivity({
          activityType: 'update',
          entityType: 'participant',
          entityId: id,
          entityName: currentFormData.name,
          changes,
          userName,
        });
      }

      // Step 5: Process pending shift notes
      if (currentPending.shiftNotes.toAdd.length > 0) {
        const toInsert = currentPending.shiftNotes.toAdd.map(note => ({
          participant_id: id,
          staff_id: note.staff_id,
          start_date: note.start_date,
          shift_time: note.shift_time || null,
          full_note: note.full_note,
        }));
        
        const { error } = await supabase.from('shift_notes').insert(toInsert);
        if (error) throw new Error(`Failed to add shift notes: ${error.message}`);
        
        if (participant?.house_id) {
          await NotificationService.notifyAssignedStaff(participant.house_id, participant.id, participant.name || 'Participant', 'note');
        }
      }

      if (currentPending.shiftNotes.toUpdate.length > 0) {
        for (const note of currentPending.shiftNotes.toUpdate) {
          const { error } = await supabase
            .from('shift_notes')
            .update({
              staff_id: note.staff_id,
              start_date: note.start_date,
              shift_time: note.shift_time || null,
              full_note: note.full_note,
              updated_at: new Date().toISOString(),
            })
            .eq('id', note.id);
          if (error) throw new Error(`Failed to update shift note: ${error.message}`);
        }
        if (participant?.house_id) {
          await NotificationService.notifyAssignedStaff(participant.house_id, participant.id, participant.name || 'Participant', 'note');
        }
      }

      if (currentPending.shiftNotes.toDelete.length > 0) {
        const { error } = await supabase
          .from('shift_notes')
          .delete()
          .in('id', currentPending.shiftNotes.toDelete);
        if (error) throw new Error(`Failed to delete shift notes: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['participants', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-goals', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-medications', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-contacts', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-documents', id] });

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
  }, [id, participant, user?.fullname, user?.email, updateParticipantFn, onSavingChange, onOriginalDataChange, onPendingChangesChange, onSaveSuccess, setFieldError, scrollToField, photoFile, photoPreview, originalPhotoUrl, queryClient, onFormDataChange]);

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
          <div className={cn('w-[230px]', sidebarSticky && `fixed z-10 start-auto ${stickyClass}`)}>
            <Scrollspy offset={100} targetRef={parentRef}>
              <ParticipantDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        <PersonalDetails 
          formData={formData} 
          onFormChange={handleFormChange} 
          validationErrors={validationErrors}
          canEdit={canEdit}
          onSave={handleSave}
        />

        <Goals 
          participantId={id} 
          canAdd={canAdd}
          canDelete={canDelete}
          canEdit={canEdit}
          pendingChanges={pendingChanges?.goals}
          onPendingChangesChange={(goalsChanges) => 
            pendingChanges && onPendingChangesChange?.({ ...pendingChanges, goals: goalsChanges })
          }
          refreshTrigger={refreshKeys.goals}
        />

        <BehaviourSupport formData={formData} onFormChange={handleFormChange} canEdit={canEdit} onSave={handleSave} />
        
        <SupportNeeds formData={formData} onFormChange={handleFormChange} canEdit={canEdit} />
        
        <MealtimeManagement formData={formData} onFormChange={handleFormChange} canEdit={canEdit} />
        
        <MedicalRoutine formData={formData} onFormChange={handleFormChange} canEdit={canEdit} />

        <Medications 
          participantId={id} 
          canAdd={canAdd}
          canDelete={canDelete}
          canEdit={canEdit}
          pendingChanges={pendingChanges?.medications}
          onPendingChangesChange={(medsChanges) => 
            pendingChanges && onPendingChangesChange?.({ ...pendingChanges, medications: medsChanges })
          }
        />

        <EmergencyManagement formData={formData} onFormChange={handleFormChange} canEdit={canEdit} />

        <Contacts 
          participantId={id} 
          canAdd={canAdd}
          canDelete={canDelete}
          canEdit={canEdit}
          pendingChanges={pendingChanges?.contacts}
          onPendingChangesChange={(contactsChanges) => 
            pendingChanges && onPendingChangesChange?.({ ...pendingChanges, contacts: contactsChanges })
          }
        />

        <Documents 
          participantId={id} 
          canAdd={canAdd}
          canDelete={canDelete}
          canEdit={canEdit}
          pendingChanges={pendingChanges?.documents}
          onPendingChangesChange={(docsChanges) => 
            pendingChanges && onPendingChangesChange?.({ ...pendingChanges, documents: docsChanges })
          }
        />

        <ShiftNotes 
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
        />

        <ActivityLog 
          entityId={id} 
          entityType="participant" 
          refreshTrigger={refreshKeys.activityLog}
        />
      </div>
    </div>
  );
}
