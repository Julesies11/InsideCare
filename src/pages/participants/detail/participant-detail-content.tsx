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
import { ClinicalDetails } from './components/clinical-details';
import { BehaviourSupport } from './components/behaviour-support';
import { SupportNeeds } from './components/support-needs';
import { EmergencyManagement } from './components/emergency-management';
import { MedicalRoutine } from './components/medical-routine';
import { Goals } from './components/goals';
import { Documents } from './components/documents';
import { Medications } from './components/medications';
import { Contacts } from './components/contacts';
import { Funding } from './components/funding';
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

import { ParticipantPendingChanges } from '@/models/participant-pending-changes';
import { MealtimeManagement } from './components/mealtime-management';

interface ParticipantDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: ParticipantPendingChanges;
  onPendingChangesChange?: (changes: ParticipantPendingChanges) => void;
  updateParticipant?: (id: string, updates: Partial<Participant>) => Promise<{ data: any; error: string | null }>;
  onPhotoDirtyChange?: (dirty: boolean) => void;
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
}: ParticipantDetailContentProps) {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [participant, setParticipant] = useState<Participant | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshKeys, setRefreshKeys] = useState({
    goals: 0,
    documents: 0,
    medications: 0,
    contacts: 0,
    funding: 0,
    shiftNotes: 0,
    activityLog: 0,
  });
  
  // TODO: Get user permissions from auth context
  // For now, set to true to enable all features
  const canEdit = true;
  const canAdd = true;
  const canDelete = true;
  
  // Photo state — kept separate so it doesn't pollute dirty tracking
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

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
          house_id: data.house_id ?? '',
          photo_url: data.photo_url ?? '',
          house_phone: data.house_phone ?? '',
          personal_mobile: data.personal_mobile ?? '',
          status: data.status ?? 'draft',
          support_level: data.support_level ?? '',
          support_coordinator: data.support_coordinator ?? '',
          primary_diagnosis: data.primary_diagnosis ?? '',
          secondary_diagnosis: data.secondary_diagnosis ?? '',
          allergies: data.allergies ?? '',
          routine: data.routine ?? '',
          hygiene_support: data.hygiene_support ?? '',
          mobility_support: data.mobility_support ?? '',
          meal_prep_support: data.meal_prep_support ?? '',
          household_support: data.household_support ?? '',
          communication_type: data.communication_type ?? '',
          communication_notes: data.communication_notes ?? '',
          communication_language_needs: data.communication_language_needs ?? '',
          finance_support: data.finance_support ?? '',
          health_wellbeing_support: data.health_wellbeing_support ?? '',
          cultural_religious_support: data.cultural_religious_support ?? '',
          other_support: data.other_support ?? '',
          mental_health_plan: data.mental_health_plan ?? '',
          medical_plan: data.medical_plan ?? '',
          natural_disaster_plan: data.natural_disaster_plan ?? '',
          pharmacy_name: data.pharmacy_name ?? '',
          pharmacy_contact: data.pharmacy_contact ?? '',
          pharmacy_location: data.pharmacy_location ?? '',
          gp_name: data.gp_name ?? '',
          gp_contact: data.gp_contact ?? '',
          gp_location: data.gp_location ?? '',
          psychiatrist_name: data.psychiatrist_name ?? '',
          psychiatrist_contact: data.psychiatrist_contact ?? '',
          psychiatrist_location: data.psychiatrist_location ?? '',
          medical_routine_other: data.medical_routine_other ?? '',
          medical_routine_general_process: data.medical_routine_general_process ?? '',
          current_goals: data.current_goals ?? '',
          restrictive_practices: data.restrictive_practices ?? '',
          behaviour_of_concern: data.behaviour_of_concern ?? '',
          pbsp_engaged: data.pbsp_engaged ?? null,
          bsp_available: data.bsp_available ?? null,
          restrictive_practices_yn: data.restrictive_practices_yn ?? null,
          specialist_name: data.specialist_name ?? '',
          specialist_phone: data.specialist_phone ?? '',
          specialist_email: data.specialist_email ?? '',
          restrictive_practice_authorisation: data.restrictive_practice_authorisation ?? null,
          restrictive_practice_details: data.restrictive_practice_details ?? '',
          mtmp_required: data.mtmp_required ?? null,
          mtmp_details: data.mtmp_details ?? '',
        };
        setFormData(initialData);
        setOriginalPhotoUrl(data.photo_url ?? null);
        if (data.photo_url) setPhotoPreview(data.photo_url);
        
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

  // Notify parent when photo dirty state changes
  // Dirty if: new file selected OR preview differs from original (e.g. deleted)
  useEffect(() => {
    const photoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
    onPhotoDirtyChange?.(photoDirty);
  }, [photoFile, photoPreview, originalPhotoUrl, onPhotoDirtyChange]);

  // Get the sticky class based on the current layout
  const stickyClass = 'top-[calc(var(--header-height)+1rem)]';

  const handleFormChange = (field: string, value: any) => {
    // Intercept photo fields — keep them out of formData/dirty tracking
    if (field === 'photo_file') { setPhotoFile(value); return; }
    if (field === 'photo_url_preview') { setPhotoPreview(value); return; }
    const normalizedValue = field === 'is_active' ? value === 'true' : value;
    setFormData((prev: any) => ({ ...prev, [field]: normalizedValue }));
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

      // Subform: Process pending goals
      if (pendingChanges?.goals.toAdd.length) {
        for (const goal of pendingChanges.goals.toAdd) {
          const { error } = await supabase
            .from('participant_goals')
            .insert({
              participant_id: id,
              goal_type: goal.goal_type,
              description: goal.description || null,
              is_active: goal.is_active,
            });

          if (error) {
            throw new Error(`Failed to add goal: ${error.message}`);
          }

          // Log activity
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

      if (pendingChanges?.goals.toUpdate.length) {
        for (const goal of pendingChanges.goals.toUpdate) {
          const { error } = await supabase
            .from('participant_goals')
            .update({
              goal_type: goal.goal_type,
              description: goal.description || null,
              is_active: goal.is_active,
            })
            .eq('id', goal.id);

          if (error) {
            throw new Error(`Failed to update goal: ${error.message}`);
          }

          // Log activity
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

      if (pendingChanges?.goals.toDelete.length) {
        for (const goalId of pendingChanges.goals.toDelete) {
          // Get goal type before deleting
          const { data: medData } = await supabase
            .from('participant_goals')
            .select('goal_type')
            .eq('id', goalId)
            .single();

          const { error } = await supabase
            .from('participant_goals')
            .delete()
            .eq('id', goalId);

          if (error) {
            throw new Error(`Failed to delete goal: ${error.message}`);
          }

          // Log activity
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted goal "${goalId?.goal_type || 'Unknown goal'}"`,
          });
        }
      }

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
              medication_id: med.medication_id,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              is_active: med.is_active,
            });

          if (error) {
            throw new Error(`Failed to add medication: ${error.message}`);
          }

          // Get medication name for logging
          const { data: medData } = await supabase
            .from('medications_master')
            .select('name')
            .eq('id', med.medication_id)
            .single();

          // Log activity
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added medication "${medData?.name || 'Unknown'}"${med.dosage ? ` (${med.dosage})` : ''}`,
          });
        }
      }

      if (pendingChanges?.medications.toUpdate.length) {
        for (const med of pendingChanges.medications.toUpdate) {
          const { error } = await supabase
            .from('participant_medications')
            .update({
              medication_id: med.medication_id,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              is_active: med.is_active,
            })
            .eq('id', med.id);

          if (error) {
            throw new Error(`Failed to update medication: ${error.message}`);
          }

          // Get medication name for logging
          const { data: medData } = await supabase
            .from('medications_master')
            .select('name')
            .eq('id', med.medication_id)
            .single();

          // Log activity
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated medication "${medData?.name || 'Unknown'}"${med.dosage ? ` (${med.dosage})` : ''}`,
          });
        }
      }

      if (pendingChanges?.medications.toDelete.length) {
        for (const medId of pendingChanges.medications.toDelete) {
          // Get medication name before deleting
          const { data: medData } = await supabase
            .from('participant_medications')
            .select(`
              medication:medications_master(name)
            `)
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
            customDescription: `Deleted medication "${medData?.medication?.name || 'Unknown'}"`,
          });
        }
      }

      // Step 4: Process pending contacts
      if (pendingChanges?.contacts.toAdd.length) {
        for (const contact of pendingChanges.contacts.toAdd) {
          const { error } = await supabase
            .from('participant_contacts')
            .insert({
              participant_id: id,
              contact_name: contact.contact_name,
              contact_type_id: contact.contact_type_id || null,
              phone: contact.phone || null,
              email: contact.email || null,
              address: contact.address || null,
              notes: contact.notes || null,
              is_active: contact.is_active,
            });

          if (error) {
            throw new Error(`Failed to add contact: ${error.message}`);
          }

          // Get contact type name for logging
          let contactTypeName = '';
          if (contact.contact_type_id) {
            const { data: typeData } = await supabase
              .from('contact_types_master')
              .select('name')
              .eq('id', contact.contact_type_id)
              .single();
            contactTypeName = typeData?.name || '';
          }

          // Log activity
          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added contact "${contact.contact_name}"${contactTypeName ? ` (${contactTypeName})` : ''}`,
          });
        }
      }

      if (pendingChanges?.contacts.toUpdate.length) {
        for (const contact of pendingChanges.contacts.toUpdate) {
          const { error } = await supabase
            .from('participant_contacts')
            .update({
              contact_name: contact.contact_name,
              contact_type_id: contact.contact_type_id || null,
              phone: contact.phone || null,
              email: contact.email || null,
              address: contact.address || null,
              notes: contact.notes || null,
              is_active: contact.is_active,
            })
            .eq('id', contact.id);

          if (error) {
            throw new Error(`Failed to update contact: ${error.message}`);
          }

          // Get contact type name for logging
          let contactTypeName = '';
          if (contact.contact_type_id) {
            const { data: typeData } = await supabase
              .from('contact_types_master')
              .select('name')
              .eq('id', contact.contact_type_id)
              .single();
            contactTypeName = typeData?.name || '';
          }

          // Log activity
          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated contact "${contact.contact_name}"${contactTypeName ? ` (${contactTypeName})` : ''}`,
          });
        }
      }

      if (pendingChanges?.contacts.toDelete.length) {
        for (const contactId of pendingChanges.contacts.toDelete) {
          // Get contact name and type before deleting
          const { data: contactData } = await supabase
            .from('participant_contacts')
            .select(`
              contact_name,
              contact_type:contact_types_master(name)
            `)
            .eq('id', contactId)
            .single();

          const { error } = await supabase
            .from('participant_contacts')
            .delete()
            .eq('id', contactId);

          if (error) {
            throw new Error(`Failed to delete contact: ${error.message}`);
          }

          const contactTypeName = contactData?.contact_type?.name || '';

          // Log activity
          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted contact "${contactData?.contact_name || 'Unknown'}"${contactTypeName ? ` (${contactTypeName})` : ''}`,
          });
        }
      }

      // Step 5: Process pending funding
      if (pendingChanges?.funding.toAdd.length) {
        for (const funding of pendingChanges.funding.toAdd) {
          const { error } = await supabase
            .from('participant_funding')
            .insert({
              participant_id: id,
              funding_source_id: funding.funding_source_id,
              funding_type_id: funding.funding_type_id,
              code: funding.code || null,
              invoice_recipient: funding.invoice_recipient || null,
              allocated_amount: funding.allocated_amount,
              used_amount: funding.used_amount,
              remaining_amount: funding.remaining_amount || null,
              status: funding.status,
              end_date: funding.end_date || null,
              notes: funding.notes || null,
            });

          if (error) {
            throw new Error(`Failed to add funding: ${error.message}`);
          }

          // Get funding source and type names for logging
          const { data: sourceData } = await supabase
            .from('funding_sources_master')
            .select('name')
            .eq('id', funding.funding_source_id)
            .single();
          
          const { data: typeData } = await supabase
            .from('funding_types_master')
            .select('name')
            .eq('id', funding.funding_type_id)
            .single();

          await logActivity({
            activityType: 'create',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Added funding "${sourceData?.name || 'Unknown'}" (${typeData?.name || 'Unknown'})`,
          });
        }
      }

      if (pendingChanges?.funding.toUpdate.length) {
        for (const funding of pendingChanges.funding.toUpdate) {
          const { error } = await supabase
            .from('participant_funding')
            .update({
              funding_source_id: funding.funding_source_id,
              funding_type_id: funding.funding_type_id,
              code: funding.code || null,
              invoice_recipient: funding.invoice_recipient || null,
              allocated_amount: funding.allocated_amount,
              used_amount: funding.used_amount,
              remaining_amount: funding.remaining_amount || null,
              status: funding.status,
              end_date: funding.end_date || null,
              notes: funding.notes || null,
            })
            .eq('id', funding.id);

          if (error) {
            throw new Error(`Failed to update funding: ${error.message}`);
          }

          // Get funding source and type names for logging
          const { data: sourceData } = await supabase
            .from('funding_sources_master')
            .select('name')
            .eq('id', funding.funding_source_id)
            .single();
          
          const { data: typeData } = await supabase
            .from('funding_types_master')
            .select('name')
            .eq('id', funding.funding_type_id)
            .single();

          await logActivity({
            activityType: 'update',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Updated funding "${sourceData?.name || 'Unknown'}" (${typeData?.name || 'Unknown'})`,
          });
        }
      }

      if (pendingChanges?.funding.toDelete.length) {
        for (const fundingId of pendingChanges.funding.toDelete) {
          // Get funding data with joined names before deleting
          const { data: fundingData } = await supabase
            .from('participant_funding')
            .select(`
              funding_source:funding_sources_master(name),
              funding_type:funding_types_master(name)
            `)
            .eq('id', fundingId)
            .single();

          const { error } = await supabase
            .from('participant_funding')
            .delete()
            .eq('id', fundingId);

          if (error) {
            throw new Error(`Failed to delete funding: ${error.message}`);
          }

          await logActivity({
            activityType: 'delete',
            entityType: 'participant',
            entityId: id,
            entityName: participant?.name,
            userName,
            customDescription: `Deleted funding "${fundingData?.funding_source?.name || 'Unknown'}" (${fundingData?.funding_type?.name || 'Unknown'})`,
          });
        }
      }

      // Step 6: Process pending shift notes
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
      // Handle photo upload if there's a new photo file, or clear if deleted
      let photoUrl = formData.photo_url;
      if (photoFile && photoFile instanceof File) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;
        const filePath = `participant-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('participants')
          .upload(filePath, photoFile, {
            upsert: true,
            contentType: photoFile.type
          });

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        const { data } = supabase.storage
          .from('participants')
          .getPublicUrl(filePath);

        photoUrl = data.publicUrl;
        setOriginalPhotoUrl(photoUrl);
        setPhotoFile(null);
        setPhotoPreview(photoUrl);
      } else if (photoPreview === null && originalPhotoUrl !== null) {
        // Photo was deleted — write null to DB
        photoUrl = null;
        setOriginalPhotoUrl(null);
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
        house_id: toNull(formData.house_id),
        photo_url: toNull(photoUrl),
        status: formData.status,
        support_level: toNull(formData.support_level),
        support_coordinator: toNull(formData.support_coordinator),
        primary_diagnosis: toNull(formData.primary_diagnosis),
        secondary_diagnosis: toNull(formData.secondary_diagnosis),
        allergies: toNull(formData.allergies),
        routine: toNull(formData.routine),
        hygiene_support: toNull(formData.hygiene_support),
        mobility_support: toNull(formData.mobility_support),
        meal_prep_support: toNull(formData.meal_prep_support),
        household_support: toNull(formData.household_support),
        communication_type: toNull(formData.communication_type),
        communication_notes: toNull(formData.communication_notes),
        communication_language_needs: toNull(formData.communication_language_needs),
        finance_support: toNull(formData.finance_support),
        health_wellbeing_support: toNull(formData.health_wellbeing_support),
        cultural_religious_support: toNull(formData.cultural_religious_support),
        other_support: toNull(formData.other_support),
        mental_health_plan: toNull(formData.mental_health_plan),
        medical_plan: toNull(formData.medical_plan),
        natural_disaster_plan: toNull(formData.natural_disaster_plan),
        pharmacy_name: toNull(formData.pharmacy_name),
        pharmacy_contact: toNull(formData.pharmacy_contact),
        pharmacy_location: toNull(formData.pharmacy_location),
        gp_name: toNull(formData.gp_name),
        gp_contact: toNull(formData.gp_contact),
        gp_location: toNull(formData.gp_location),
        psychiatrist_name: toNull(formData.psychiatrist_name),
        psychiatrist_contact: toNull(formData.psychiatrist_contact),
        psychiatrist_location: toNull(formData.psychiatrist_location),
        medical_routine_other: toNull(formData.medical_routine_other),
        medical_routine_general_process: toNull(formData.medical_routine_general_process),
        current_goals: toNull(formData.current_goals),
        restrictive_practices: toNull(formData.restrictive_practices),
        behaviour_of_concern: toNull(formData.behaviour_of_concern),
        pbsp_engaged: formData.pbsp_engaged,
        bsp_available: formData.bsp_available,
        restrictive_practices_yn: formData.restrictive_practices_yn,
        specialist_name: toNull(formData.specialist_name),
        specialist_phone: toNull(formData.specialist_phone),
        specialist_email: toNull(formData.specialist_email),
        restrictive_practice_authorisation: formData.restrictive_practice_authorisation,
        restrictive_practice_details: toNull(formData.restrictive_practice_details),
        mtmp_required: formData.mtmp_required,
        mtmp_details: toNull(formData.mtmp_details),
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

        // Validate: MTMP details are required when MTMP is required
        const mtmpRequired = changedFields.mtmp_required !== undefined ? changedFields.mtmp_required : normalizedFormData.mtmp_required;
        const mtmpDetails = changedFields.mtmp_details !== undefined ? changedFields.mtmp_details : normalizedFormData.mtmp_details;
        
        if (mtmpRequired && !mtmpDetails) {
          setFieldError('mtmp_details', 'MTMP details are required when MTMP is enabled');
          scrollToField('mtmp_details');
          toast.error('MTMP details required', {
            description: 'Please provide details for the Mealtime Management Plan.'
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
        house_id: normalizedFormData.house_id ?? '',
        photo_url: normalizedFormData.photo_url ?? '',
        status: normalizedFormData.status ?? '',
        support_level: normalizedFormData.support_level ?? '',
        support_coordinator: normalizedFormData.support_coordinator ?? '',
        primary_diagnosis: normalizedFormData.primary_diagnosis ?? '',
        secondary_diagnosis: normalizedFormData.secondary_diagnosis ?? '',
        allergies: normalizedFormData.allergies ?? '',
        routine: normalizedFormData.routine ?? '',
        hygiene_support: normalizedFormData.hygiene_support ?? '',
        mobility_support: normalizedFormData.mobility_support ?? '',
        meal_prep_support: normalizedFormData.meal_prep_support ?? '',
        household_support: normalizedFormData.household_support ?? '',
        communication_type: normalizedFormData.communication_type ?? '',
        communication_notes: normalizedFormData.communication_notes ?? '',
        communication_language_needs: normalizedFormData.communication_language_needs ?? '',
        finance_support: normalizedFormData.finance_support ?? '',
        health_wellbeing_support: normalizedFormData.health_wellbeing_support ?? '',
        cultural_religious_support: normalizedFormData.cultural_religious_support ?? '',
        other_support: normalizedFormData.other_support ?? '',
        mental_health_plan: normalizedFormData.mental_health_plan ?? '',
        medical_plan: normalizedFormData.medical_plan ?? '',
        natural_disaster_plan: normalizedFormData.natural_disaster_plan ?? '',
        pharmacy_name: normalizedFormData.pharmacy_name ?? '',
        pharmacy_contact: normalizedFormData.pharmacy_contact ?? '',
        pharmacy_location: normalizedFormData.pharmacy_location ?? '',
        gp_name: normalizedFormData.gp_name ?? '',
        gp_contact: normalizedFormData.gp_contact ?? '',
        gp_location: normalizedFormData.gp_location ?? '',
        psychiatrist_name: normalizedFormData.psychiatrist_name ?? '',
        psychiatrist_contact: normalizedFormData.psychiatrist_contact ?? '',
        psychiatrist_location: normalizedFormData.psychiatrist_location ?? '',
        medical_routine_other: normalizedFormData.medical_routine_other ?? '',
        medical_routine_general_process: normalizedFormData.medical_routine_general_process ?? '',
        current_goals: normalizedFormData.current_goals ?? '',
        restrictive_practices: normalizedFormData.restrictive_practices ?? '',
        behaviour_of_concern: normalizedFormData.behaviour_of_concern ?? '',
        pbsp_engaged: normalizedFormData.pbsp_engaged ?? null,
        bsp_available: normalizedFormData.bsp_available ?? null,
        restrictive_practices_yn: normalizedFormData.restrictive_practices_yn ?? null,
        specialist_name: normalizedFormData.specialist_name ?? '',
        specialist_phone: normalizedFormData.specialist_phone ?? '',
        specialist_email: normalizedFormData.specialist_email ?? '',
        restrictive_practice_authorisation: normalizedFormData.restrictive_practice_authorisation ?? null,
        restrictive_practice_details: normalizedFormData.restrictive_practice_details ?? '',
        mtmp_required: normalizedFormData.mtmp_required ?? null,
        mtmp_details: normalizedFormData.mtmp_details ?? '',
      };
      
      setFormData(normalizedData);
      
      // Update parent with new original data after successful save
      // Important: Update both formData and originalData to reset dirty state
      if (onFormDataChange) onFormDataChange(normalizedData);
      if (onOriginalDataChange) onOriginalDataChange(normalizedData);

      // Track which child entities had changes for selective refresh
      const changedEntities = {
        goals: (pendingChanges?.goals.toAdd.length || 0) > 0 || (pendingChanges?.goals.toUpdate.length || 0) > 0 || (pendingChanges?.goals.toDelete.length || 0) > 0,
        documents: (pendingChanges?.documents.toAdd.length || 0) > 0 || (pendingChanges?.documents.toDelete.length || 0) > 0,
        medications: (pendingChanges?.medications.toAdd.length || 0) > 0 || (pendingChanges?.medications.toUpdate.length || 0) > 0 || (pendingChanges?.medications.toDelete.length || 0) > 0,
        contacts: (pendingChanges?.contacts.toAdd.length || 0) > 0 || (pendingChanges?.contacts.toUpdate.length || 0) > 0 || (pendingChanges?.contacts.toDelete.length || 0) > 0,
        funding: (pendingChanges?.funding.toAdd.length || 0) > 0 || (pendingChanges?.funding.toUpdate.length || 0) > 0 || (pendingChanges?.funding.toDelete.length || 0) > 0,
        shiftNotes: (pendingChanges?.shiftNotes.toAdd.length || 0) > 0 || (pendingChanges?.shiftNotes.toUpdate.length || 0) > 0 || (pendingChanges?.shiftNotes.toDelete.length || 0) > 0,
      };

      // Check if main participant form or any child entity had changes
      const hasParticipantChanges = Object.keys(changedFields).length > 0;
      const hasChildChanges = Object.values(changedEntities).some(changed => changed);
      const hasAnyChanges = hasParticipantChanges || hasChildChanges;

      // Only increment refresh keys for entities that had changes
      setRefreshKeys(prev => ({
        goals: changedEntities.goals ? prev.goals + 1 : prev.goals,
        documents: changedEntities.documents ? prev.documents + 1 : prev.documents,
        medications: changedEntities.medications ? prev.medications + 1 : prev.medications,
        contacts: changedEntities.contacts ? prev.contacts + 1 : prev.contacts,
        funding: changedEntities.funding ? prev.funding + 1 : prev.funding,
        shiftNotes: changedEntities.shiftNotes ? prev.shiftNotes + 1 : prev.shiftNotes,
        activityLog: hasAnyChanges ? prev.activityLog + 1 : prev.activityLog,
      }));

      // Step 6: Clear pending changes after successful save
      if (onPendingChangesChange && pendingChanges) {
        onPendingChangesChange({
          goals: { toAdd: [], toUpdate: [], toDelete: [] },
          documents: { toAdd: [], toDelete: [] },
          medications: { toAdd: [], toUpdate: [], toDelete: [] },
          contacts: { toAdd: [], toUpdate: [], toDelete: [] },
          funding: { toAdd: [], toUpdate: [], toDelete: [] },
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
          formData={{ ...formData, photo_url: photoPreview ?? formData.photo_url }}
          onFormChange={handleFormChange}
          onSave={handleSave}
          validationErrors={validationErrors}
        />
        <Goals 
          key={`goals-${refreshKeys.goals}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <BehaviourSupport
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
        />
        <SupportNeeds
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
        />
        <MealtimeManagement
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
          validationErrors={validationErrors}
        />
        <MedicalRoutine
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
        />
        <Medications 
          key={`medications-${refreshKeys.medications}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <EmergencyManagement
          canEdit={canEdit}
          formData={formData}
          onFormChange={handleFormChange}
        />
        <Contacts 
          key={`contacts-${refreshKeys.contacts}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
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
        <ShiftNotes 
          key={`shift-notes-${refreshKeys.shiftNotes}`}
          participantId={id} 
          canAdd={canAdd} 
          canDelete={canDelete}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
        <Funding 
          key={`funding-${refreshKeys.funding}`}
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
