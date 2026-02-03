import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { ParticipantDetailSidebar } from './participant-detail-sidebar';
import { PersonalDetails } from './components/personal-details';
import { MedicalAllergies } from './components/medical-allergies';
import { HygieneRoutines } from './components/hygiene-routines';
import { Goals } from './components/goals';
import { Documents } from './components/documents';
import { Medications } from './components/medications';
import { ServiceProviders } from './components/service-providers';
import { Notes } from './components/notes';
import { RestrictivePractices } from './components/restrictive-practices';
import { ShiftNotes } from './components/shift-notes';
import { ActivityLog } from './components/activity-log';
import { Participant } from '@/models/participant';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { parseSupabaseError } from '@/lib/error-parser';
import { useFormValidation } from '@/hooks/use-form-validation';
import { validators } from '@/lib/validation-rules';

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

import { PendingChanges } from '@/models/pending-changes';

interface ParticipantDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
  updateParticipant?: (id: string, updates: Partial<Participant>) => Promise<{ data: any; error: string | null }>;
}

export function ParticipantDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  updateParticipant,
  pendingChanges,
  onPendingChangesChange,
}: ParticipantDetailContentProps) {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [participant, setParticipant] = useState<Participant | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshKeys, setRefreshKeys] = useState({
    documents: 0,
    medications: 0,
    serviceProviders: 0,
    shiftNotes: 0,
    activityLog: 0,
  });
  
  // TODO: Get user permissions from auth context
  // For now, set to true to enable all features
  const canEdit = true;
  const canAdd = true;
  const canDelete = true;
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    house_phone: '',
    personal_phone: '',
    address: '',
    date_of_birth: '',
    ndis_number: '',
    house_id: '',
    photo_url: '',
    status: 'draft',
    support_level: '',
    support_coordinator: '',
    medical_conditions: '',
    allergies: '',
    morning_routine: '',
    shower_support: '',
    current_goals: '',
    general_notes: '',
    restrictive_practices: '',
  });

  // Use form validation hook
  const { validationErrors, setFieldError, clearAllErrors, scrollToField } = useFormValidation();

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });
  
  // Get user name for activity logging
  const userName = user?.fullname || user?.email || 'Unknown User';
  
  // Debug: Log user object
  useEffect(() => {
    console.log('Current user:', user);
    console.log('User name for logging:', userName);
  }, [user, userName]);

  // Fetch participant data
  useEffect(() => {
    async function fetchParticipant() {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching participant:', error);
      } else if (data) {
        setParticipant(data);
        const initialData = {
          name: data.name ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          date_of_birth: data.date_of_birth ?? '',
          ndis_number: data.ndis_number ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          house_id: data.house_id ?? '',
          photo_url: data.photo_url ?? '',
          house_phone: data.house_phone ?? '',
          personal_mobile: data.personal_mobile ?? '',
          status: data.status ?? 'draft',
          support_level: data.support_level ?? '',
          support_coordinator: data.support_coordinator ?? '',
          medical_conditions: data.medical_conditions ?? '',
          allergies: data.allergies ?? '',
          morning_routine: data.morning_routine ?? '',
          shower_support: data.shower_support ?? '',
          current_goals: data.current_goals ?? '',
          general_notes: data.general_notes ?? '',
          restrictive_practices: data.restrictive_practices ?? '',
        };
        setFormData(initialData);
        
        // Notify parent of initial data
        if (onFormDataChange) onFormDataChange(initialData);
        if (onOriginalDataChange) onOriginalDataChange(initialData);

        // Set entity name for breadcrumbs
        (window as any).entityName = data.name;
      }
      setLoading(false);
    }

    fetchParticipant();
  }, [id, onFormDataChange, onOriginalDataChange]);

  // Effect to update parentRef after the component mounts
  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) {
      parentRef.current = scrollableElement;
    }
  }, []);

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  // Get the sticky class based on the current layout
  const stickyClass = 'top-[calc(var(--header-height)+1rem)]';

  const handleFormChange = (field: string, value: any) => {
    const normalizedValue = field === 'is_active' ? value === 'true' : value;
    
    setFormData((prev: any) => {
      return { ...prev, [field]: normalizedValue };
    });
  };

  // Notify parent of form data changes via useEffect to avoid setState during render
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleSave = async () => {
    if (!id || !participant) return;

    if (onSavingChange) onSavingChange(true);

    try {
      // Step 1: Upload pending documents
      if (pendingChanges?.documents.toAdd.length) {
        for (const doc of pendingChanges.documents.toAdd) {
          // Upload to storage
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `participant-documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('participants')
            .upload(filePath, doc.file);

          if (uploadError) {
            throw new Error(`Failed to upload document: ${uploadError.message}`);
          }

          // Create database record
          const { error: dbError } = await supabase
            .from('participant_documents')
            .insert({
              participant_id: id,
              file_name: doc.file.name,
              file_path: filePath,
            });

          if (dbError) {
            throw new Error(`Failed to create document record: ${dbError.message}`);
          }

          // Log activity
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

      // Step 2: Delete pending document deletions
      if (pendingChanges?.documents.toDelete.length) {
        for (const doc of pendingChanges.documents.toDelete) {
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('participants')
            .remove([doc.filePath]);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
          }

          // Delete from database
          const { error: dbError } = await supabase
            .from('participant_documents')
            .delete()
            .eq('id', doc.id);

          if (dbError) {
            throw new Error(`Failed to delete document: ${dbError.message}`);
          }

          // Log activity
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

      // Step 3: Process pending medications
      if (pendingChanges?.medications.toAdd.length) {
        for (const med of pendingChanges.medications.toAdd) {
          const { error } = await supabase
            .from('participant_medications')
            .insert({
              participant_id: id,
              medication_name: med.medication_name,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              is_active: med.is_active,
            });

          if (error) {
            throw new Error(`Failed to add medication: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added medication "${med.medication_name}"${med.dosage ? ` (${med.dosage})` : ''}`,
          });
        }
      }

      if (pendingChanges?.medications.toUpdate.length) {
        for (const med of pendingChanges.medications.toUpdate) {
          const { error } = await supabase
            .from('participant_medications')
            .update({
              medication_name: med.medication_name,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              is_active: med.is_active,
            })
            .eq('id', med.id);

          if (error) {
            throw new Error(`Failed to update medication: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated medication "${med.medication_name}"${med.dosage ? ` (${med.dosage})` : ''}`,
          });
        }
      }

      if (pendingChanges?.medications.toDelete.length) {
        for (const medId of pendingChanges.medications.toDelete) {
          // Get medication name before deleting
          const { data: medData } = await supabase
            .from('participant_medications')
            .select('medication_name')
            .eq('id', medId)
            .single();

          const { error } = await supabase
            .from('participant_medications')
            .delete()
            .eq('id', medId);

          if (error) {
            throw new Error(`Failed to delete medication: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted medication "${medData?.medication_name || 'Unknown medication'}"`,
          });
        }
      }

      // Step 4: Process pending service providers
      if (pendingChanges?.serviceProviders.toAdd.length) {
        for (const provider of pendingChanges.serviceProviders.toAdd) {
          const { error } = await supabase
            .from('participant_providers')
            .insert({
              participant_id: id,
              provider_name: provider.provider_name,
              provider_type: provider.provider_type || null,
              provider_description: provider.provider_description || null,
              is_active: provider.is_active,
            });

          if (error) {
            throw new Error(`Failed to add service provider: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added service provider "${provider.provider_name}"${provider.provider_type ? ` (${provider.provider_type})` : ''}`,
          });
        }
      }

      if (pendingChanges?.serviceProviders.toUpdate.length) {
        for (const provider of pendingChanges.serviceProviders.toUpdate) {
          const { error } = await supabase
            .from('participant_providers')
            .update({
              provider_name: provider.provider_name,
              provider_type: provider.provider_type || null,
              provider_description: provider.provider_description || null,
              is_active: provider.is_active,
            })
            .eq('id', provider.id);

          if (error) {
            throw new Error(`Failed to update service provider: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated service provider "${provider.provider_name}"${provider.provider_type ? ` (${provider.provider_type})` : ''}`,
          });
        }
      }

      if (pendingChanges?.serviceProviders.toDelete.length) {
        for (const providerId of pendingChanges.serviceProviders.toDelete) {
          // Get provider name before deleting
          const { data: providerData } = await supabase
            .from('participant_providers')
            .select('provider_name')
            .eq('id', providerId)
            .single();

          const { error } = await supabase
            .from('participant_providers')
            .delete()
            .eq('id', providerId);

          if (error) {
            throw new Error(`Failed to delete service provider: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted service provider "${providerData?.provider_name || 'Unknown provider'}"`,
          });
        }
      }

      // Step 5: Process pending shift notes
      if (pendingChanges?.shiftNotes.toAdd.length) {
        for (const note of pendingChanges.shiftNotes.toAdd) {
          const { error } = await supabase
            .from('shift_notes')
            .insert({
              participant_id: id,
              shift_date: note.shift_date,
              shift_time: note.shift_time,
              staff_id: note.staff_id,
              full_note: note.full_note,
              tags: note.tags,
            });

          if (error) {
            throw new Error(`Failed to add shift note: ${error.message}`);
          }

          // Log activity - use participant entity since created from participant page
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added shift note for ${new Date(note.shift_date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}${note.shift_time ? ` at ${note.shift_time}` : ''}`,
          });
        }
      }

      if (pendingChanges?.shiftNotes.toUpdate.length) {
        for (const note of pendingChanges.shiftNotes.toUpdate) {
          const { error } = await supabase
            .from('shift_notes')
            .update({
              shift_date: note.shift_date,
              shift_time: note.shift_time,
              staff_id: note.staff_id,
              full_note: note.full_note,
              tags: note.tags,
            })
            .eq('id', note.id);

          if (error) {
            throw new Error(`Failed to update shift note: ${error.message}`);
          }

          // Log activity - use participant entity since updated from participant page
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated shift note for ${new Date(note.shift_date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}${note.shift_time ? ` at ${note.shift_time}` : ''}`,
          });
        }
      }

      if (pendingChanges?.shiftNotes.toDelete.length) {
        for (const noteId of pendingChanges.shiftNotes.toDelete) {
          // Get shift note date before deleting
          const { data: noteData } = await supabase
            .from('shift_notes')
            .select('shift_date')
            .eq('id', noteId)
            .single();

          const { error } = await supabase
            .from('shift_notes')
            .delete()
            .eq('id', noteId);

          if (error) {
            throw new Error(`Failed to delete shift note: ${error.message}`);
          }

          // Log activity - use participant entity since deleted from participant page
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted shift note for ${noteData?.shift_date ? new Date(noteData.shift_date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }) : 'unknown date'}`,
          });
        }
      }

      // Step 6: Save main participant form data
      // Handle photo upload if there's a new photo file
      let photoUrl = formData.photo_url;
      if (formData.photo_file && formData.photo_file instanceof File) {
        const fileExt = formData.photo_file.name.split('.').pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;
        const filePath = `participant-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('participants')
          .upload(filePath, formData.photo_file, {
            upsert: true,
            contentType: formData.photo_file.type
          });

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        // Get public URL
        const { data } = supabase.storage
          .from('participants')
          .getPublicUrl(filePath);

        photoUrl = data.publicUrl;
      }

      // Helper function to convert empty strings to null
      const toNull = (value: any) => (value === '' ? null : value);

      // Prepare normalized data for comparison
      const normalizedFormData = {
        name: formData.name,
        email: toNull(formData.email),
        house_phone: toNull(formData.house_phone),
        personal_mobile: toNull(formData.personal_mobile),
        address: toNull(formData.address),
        date_of_birth: toNull(formData.date_of_birth),
        ndis_number: toNull(formData.ndis_number),
        emergency_contact_name: toNull(formData.emergency_contact_name),
        emergency_contact_phone: toNull(formData.emergency_contact_phone),
        house_id: toNull(formData.house_id),
        photo_url: toNull(photoUrl),
        status: formData.status,
        support_level: toNull(formData.support_level),
        support_coordinator: toNull(formData.support_coordinator),
        medical_conditions: toNull(formData.medical_conditions),
        allergies: toNull(formData.allergies),
        morning_routine: toNull(formData.morning_routine),
        shower_support: toNull(formData.shower_support),
        current_goals: toNull(formData.current_goals),
        general_notes: toNull(formData.general_notes),
        restrictive_practices: toNull(formData.restrictive_practices),
      };

      // Build object with only changed fields by comparing with original participant data
      const changedFields: Record<string, any> = {};
      const formFields = Object.keys(normalizedFormData) as (keyof typeof normalizedFormData)[];
      
      for (const field of formFields) {
        const newValue = normalizedFormData[field];
        const oldValue = participant[field as keyof Participant];
        
        // Compare values - handle null/undefined/empty string equivalence
        const normalizedOld = oldValue === undefined || oldValue === '' ? null : oldValue;
        const normalizedNew = newValue === undefined || newValue === '' ? null : newValue;
        
        if (normalizedOld !== normalizedNew) {
          changedFields[field] = newValue;
        }
      }

      console.log('Changed fields:', changedFields);

      // Only update if there are actual changes
      if (Object.keys(changedFields).length > 0) {
        // Clear previous validation errors
        clearAllErrors();

        // Check if status is being changed
        const newStatus = changedFields.status || normalizedFormData.status;
        const currentEmail = changedFields.email !== undefined ? changedFields.email : normalizedFormData.email;
        const currentName = normalizedFormData.name;

        // Validate: Name is required when status is Active
        const nameValidation = validators.requiredWhen(
          currentName,
          newStatus == 'active',
          'Name'
        );
        if (!nameValidation.isValid) {
          setFieldError('name', nameValidation.error);
          scrollToField('name');
          toast.error('Name is required', {
            description: 'Please enter a participant name.'
          });
          return;
        }

        // Validate: Email is required when status is active
        const emailValidation = validators.requiredWhen(
          currentEmail,
          newStatus == 'active',
          'Email'
        );
        if (!emailValidation.isValid) {
          setFieldError('email', 'Email is required when status is Active');
          scrollToField('email');
          toast.error('Email is required when status is Active', {
            description: 'Please add an email address before changing status.'
          });
          return;
        }

        // If updateParticipant is available (from profiles page), use it to sync hook state
        if (updateParticipant) {
          const { error } = await updateParticipant(id, changedFields);
          if (error) {
            const parsedError = parseSupabaseError(error);
            
            // Check if error is related to specific fields
            if (parsedError.title === 'Email already in use') {
              setFieldError('email', parsedError.description);
              scrollToField('email');
            } else if (parsedError.title === 'Name is required') {
              setFieldError('name', parsedError.description);
              scrollToField('name');
            } else if (parsedError.title === 'Email is required') {
              setFieldError('email', parsedError.description);
              scrollToField('email');
            }
            
            toast.error(parsedError.title, { description: parsedError.description });
            throw new Error(parsedError.description);
          }
          console.log('Successfully saved changes via updateParticipant hook');
        } else {
          // Fallback to direct Supabase call if not available
          const { error } = await supabase
            .from('participants')
            .update(changedFields)
            .eq('id', id);

          if (error) {
            const parsedError = parseSupabaseError(error);
            
            // Check if error is related to specific fields
            if (parsedError.title === 'Email already in use') {
              setFieldError('email', parsedError.description);
              scrollToField('email');
            } else if (parsedError.title === 'Name is required') {
              setFieldError('name', parsedError.description);
              scrollToField('name');
            } else if (parsedError.title === 'Email is required') {
              setFieldError('email', parsedError.description);
              scrollToField('email');
            }
            
            toast.error(parsedError.title, { description: parsedError.description });
            throw error;
          }
          console.log('Successfully saved changes to database');
        }
      } else {
        console.log('No changes detected in main form fields');
      }

      // Detect what changed for activity log (use existing helper for detailed tracking)
      const changes = detectChanges(participant, normalizedFormData);

      // Log the activity (only if there were actual changes)
      if (Object.keys(changes).length > 0) {
        await logActivity({
          activityType: 'update',
          entityType: 'participant',
          entityId: id,
          entityName: formData.name,
          changes,
          userName,
        });
      }

      // Update local state with saved data (no need to fetch from DB)
      setParticipant({ ...participant, ...normalizedFormData });
      
      // Normalize data to ensure all values are strings (not null/undefined) for form inputs
      const normalizedData = {
        name: normalizedFormData.name ?? '',
        email: normalizedFormData.email ?? '',
        house_phone: normalizedFormData.house_phone ?? '',
        personal_mobile: normalizedFormData.personal_mobile ?? '',
        address: normalizedFormData.address ?? '',
        date_of_birth: normalizedFormData.date_of_birth ?? '',
        ndis_number: normalizedFormData.ndis_number ?? '',
        emergency_contact_name: normalizedFormData.emergency_contact_name ?? '',
        emergency_contact_phone: normalizedFormData.emergency_contact_phone ?? '',
        house_id: normalizedFormData.house_id ?? '',
        photo_url: normalizedFormData.photo_url ?? '',
        status: normalizedFormData.status ?? '',
        support_level: normalizedFormData.support_level ?? '',
        support_coordinator: normalizedFormData.support_coordinator ?? '',
        medical_conditions: normalizedFormData.medical_conditions ?? '',
        allergies: normalizedFormData.allergies ?? '',
        morning_routine: normalizedFormData.morning_routine ?? '',
        shower_support: normalizedFormData.shower_support ?? '',
        current_goals: normalizedFormData.current_goals ?? '',
        general_notes: normalizedFormData.general_notes ?? '',
        restrictive_practices: normalizedFormData.restrictive_practices ?? '',
      };
      
      setFormData(normalizedData);
      
      // Update parent with new original data after successful save
      // Important: Update both formData and originalData to reset dirty state
      if (onFormDataChange) onFormDataChange(normalizedData);
      if (onOriginalDataChange) onOriginalDataChange(normalizedData);

      // Track which child entities had changes for selective refresh
      const changedEntities = {
        documents: (pendingChanges?.documents.toAdd.length || 0) > 0 || (pendingChanges?.documents.toDelete.length || 0) > 0,
        medications: (pendingChanges?.medications.toAdd.length || 0) > 0 || (pendingChanges?.medications.toUpdate.length || 0) > 0 || (pendingChanges?.medications.toDelete.length || 0) > 0,
        serviceProviders: (pendingChanges?.serviceProviders.toAdd.length || 0) > 0 || (pendingChanges?.serviceProviders.toUpdate.length || 0) > 0 || (pendingChanges?.serviceProviders.toDelete.length || 0) > 0,
        shiftNotes: (pendingChanges?.shiftNotes.toAdd.length || 0) > 0 || (pendingChanges?.shiftNotes.toUpdate.length || 0) > 0 || (pendingChanges?.shiftNotes.toDelete.length || 0) > 0,
      };

      // Check if main participant form or any child entity had changes
      const hasParticipantChanges = Object.keys(changedFields).length > 0;
      const hasChildChanges = Object.values(changedEntities).some(changed => changed);
      const hasAnyChanges = hasParticipantChanges || hasChildChanges;

      // Only increment refresh keys for entities that had changes
      setRefreshKeys(prev => ({
        documents: changedEntities.documents ? prev.documents + 1 : prev.documents,
        medications: changedEntities.medications ? prev.medications + 1 : prev.medications,
        serviceProviders: changedEntities.serviceProviders ? prev.serviceProviders + 1 : prev.serviceProviders,
        shiftNotes: changedEntities.shiftNotes ? prev.shiftNotes + 1 : prev.shiftNotes,
        activityLog: hasAnyChanges ? prev.activityLog + 1 : prev.activityLog,
      }));

      // Step 6: Clear pending changes after successful save
      if (onPendingChangesChange && pendingChanges) {
        onPendingChangesChange({
          documents: { toAdd: [], toDelete: [] },
          medications: { toAdd: [], toUpdate: [], toDelete: [] },
          serviceProviders: { toAdd: [], toUpdate: [], toDelete: [] },
          shiftNotes: { toAdd: [], toUpdate: [], toDelete: [] },
          staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] },
          staffResources: { toAdd: [], toUpdate: [], toDelete: [] },
        });
      }

      toast.success('Changes saved successfully');
    } catch (error: any) {
      console.error('Error updating participant:', error);
      toast.error('Failed to save changes', { description: error.message });
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  };

  // Expose save handler to parent component
  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
    return () => {
      delete (window as any).entityName;
    };
  }, [handleSave, saveHandlerRef]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading participant details...</p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Participant not found</p>
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
            <Scrollspy key={participant?.id} offset={100} targetRef={parentRef}>
              <ParticipantDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}
      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        <PersonalDetails
          participant={participant}
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
          validationErrors={validationErrors}
        />
        <MedicalAllergies
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
        />
        <HygieneRoutines
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
        />
        <Goals
          participant={participant}
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
        />
        <Documents
          key={`documents-${refreshKeys.documents}`}
          participantId={id}
          participantName={participant.name}
          canAdd={canAdd}
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <Medications 
          key={`medications-${refreshKeys.medications}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <ServiceProviders 
          key={`service-providers-${refreshKeys.serviceProviders}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <Notes canEdit={canEdit} formData={formData} onFormChange={handleFormChange} onSave={handleSave} />
        <RestrictivePractices
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
        />
        <ShiftNotes 
          key={`shift-notes-${refreshKeys.shiftNotes}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <ActivityLog participantId={id} refreshTrigger={refreshKeys.activityLog} />
      </div>
    </div>
  );
}
