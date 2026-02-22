import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { StaffDetailForm } from './components/staff-detail-form';
import { StaffDetailSidebar } from './components/staff-detail-sidebar';
import { Documents } from './components/documents';
import { Staff, StaffUpdateData, useStaff } from '@/hooks/useStaff';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
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

interface StaffDetailContentProps {
  staffId: string;
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  updateStaff?: (id: string, updates: StaffUpdateData) => Promise<{ data: any; error: string | null }>;
  onSaveSuccess?: () => void;
  onPhotoDirtyChange?: (dirty: boolean) => void;
}

export function StaffDetailContent({
  staffId,
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  pendingChanges,
  onPendingChangesChange,
  updateStaff,
  onSaveSuccess,
  onPhotoDirtyChange,
}: StaffDetailContentProps) {
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const { user, setUser } = useAuth();
  const [staffMember, setStaffMember] = useState<Staff | undefined>();
  const [loading, setLoading] = useState(true);
  const [sidebarSticky, setSidebarSticky] = useState(false);

  // Photo state kept separate from formData so it doesn't affect dirty tracking
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Track the original photo URL as state so mutations trigger re-render + dirty effect
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  // Notify parent when photo dirty state changes
  // Dirty if: new file selected OR preview differs from original (e.g. deleted)
  useEffect(() => {
    const photoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
    onPhotoDirtyChange?.(photoDirty);
  }, [photoFile, photoPreview, originalPhotoUrl, onPhotoDirtyChange]);

  const canEdit = true;

  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    hobbies: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    department_id: '',
    employment_type_id: '',
    manager_id: '',
    hire_date: '',
    separation_date: '',
    availability: '',
    notes: '',
    status: 'draft',
  });

  // Use form validation hook
  const { validationErrors, setFieldError, clearAllErrors, scrollToField } = useFormValidation();

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  const { getStaffById, updateStaff: updateStaffFromHook } = useStaff();
  // Use prop if available, otherwise use hook instance
  const updateStaffFn = updateStaff || updateStaffFromHook;
  
  // Get user name for activity logging
  const userName = user?.fullname || user?.email || 'Unknown User';

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

  // Fetch staff member data
  useEffect(() => {
    async function fetchStaff() {
      if (!staffId) return;

      setLoading(true);
      const { data, error } = await getStaffById(staffId);

      if (error) {
        console.error('Error fetching staff member:', error);
        toast.error('Failed to load staff member');
      } else if (data) {
        setStaffMember(data);
        const initialData = {
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          address: data.address ?? '',
          hobbies: data.hobbies ?? '',
          allergies: data.allergies ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          photo_url: data.photo_url ?? null,
          department_id: data.department_id ?? '',
          employment_type_id: data.employment_type_id ?? '',
          manager_id: data.manager_id ?? '',
          hire_date: data.hire_date ?? '',
          separation_date: data.separation_date ?? '',
          availability: data.availability ?? '',
          notes: data.notes ?? '',
          // Compliance checklist fields
          ndis_worker_screening_check: data.ndis_worker_screening_check ?? false,
          ndis_worker_screening_check_expiry: data.ndis_worker_screening_check_expiry ?? '',
          ndis_orientation_module: data.ndis_orientation_module ?? false,
          ndis_orientation_module_expiry: data.ndis_orientation_module_expiry ?? '',
          ndis_code_of_conduct: data.ndis_code_of_conduct ?? false,
          ndis_code_of_conduct_expiry: data.ndis_code_of_conduct_expiry ?? '',
          ndis_infection_control_training: data.ndis_infection_control_training ?? false,
          ndis_infection_control_training_expiry: data.ndis_infection_control_training_expiry ?? '',
          drivers_license: data.drivers_license ?? false,
          drivers_license_expiry: data.drivers_license_expiry ?? '',
          comprehensive_car_insurance: data.comprehensive_car_insurance ?? false,
          comprehensive_car_insurance_expiry: data.comprehensive_car_insurance_expiry ?? '',
          status: data.status ?? 'draft',
        };
        setFormData(initialData);
        onOriginalDataChange?.(initialData);
        onFormDataChange?.(initialData);
        // Record original photo URL for deletion dirty tracking
        setOriginalPhotoUrl(data.photo_url ?? null);
        if (data.photo_url) setPhotoPreview(data.photo_url);
        
        // Set entity name for breadcrumbs
        (window as any).entityName = data.name;
      }
      setLoading(false);
    }

    fetchStaff();
  }, [staffId]);

  const [refreshKeys, setRefreshKeys] = useState({
    compliance: 0,
    resources: 0,
    training: 0,
    activityLog: 0,
  });

  // Set up save handler
  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = async () => {
        if (!staffId || !staffMember) return;

        onSavingChange?.(true);

        try {
          // Step 0: Upload profile photo if a new file was selected, or clear if deleted
          if (photoFile) {
            const file = photoFile;
            const ext = file.name.split('.').pop();
            const path = `${staffId}/profile/${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from('staff-documents')
              .upload(path, file, { upsert: true });
            if (uploadErr) {
              toast.error('Failed to upload profile photo', { description: uploadErr.message });
              throw uploadErr;
            }
            const { data: urlData } = supabase.storage.from('staff-documents').getPublicUrl(path);
            const newPhotoUrl = urlData.publicUrl;

            const { error: photoErr } = await supabase
              .from('staff')
              .update({ photo_url: newPhotoUrl, updated_at: new Date().toISOString() })
              .eq('id', staffId);
            if (photoErr) {
              toast.error('Failed to save profile photo', { description: photoErr.message });
              throw photoErr;
            }

            setOriginalPhotoUrl(newPhotoUrl);
            setStaffMember(prev => prev ? { ...prev, photo_url: newPhotoUrl } : prev);
            if (user?.staff_id === staffId && setUser && user) {
              setUser({ ...user, photo_url: newPhotoUrl });
            }
            setPhotoFile(null);
            setPhotoPreview(newPhotoUrl);
            setFormData((prev: any) => ({ ...prev, photo_url: newPhotoUrl }));

            await logActivity({
              activityType: 'update',
              entityType: 'staff',
              entityId: staffId,
              entityName: staffMember?.name,
              userName,
              customDescription: 'Updated profile photo',
            });
          } else if (photoPreview === null && originalPhotoUrl !== null) {
            // Photo was deleted — clear it in the DB
            const { error: photoErr } = await supabase
              .from('staff')
              .update({ photo_url: null, updated_at: new Date().toISOString() })
              .eq('id', staffId);
            if (photoErr) {
              toast.error('Failed to remove profile photo', { description: photoErr.message });
              throw photoErr;
            }
            setOriginalPhotoUrl(null);
            setStaffMember(prev => prev ? { ...prev, photo_url: null } : prev);
            if (user?.staff_id === staffId && setUser && user) {
              setUser({ ...user, photo_url: null });
            }
            setFormData((prev: any) => ({ ...prev, photo_url: null }));

            await logActivity({
              activityType: 'update',
              entityType: 'staff',
              entityId: staffId,
              entityName: staffMember?.name,
              userName,
              customDescription: 'Removed profile photo',
            });
          }

          // Step 1: Process pending compliance
          if (pendingChanges?.staffCompliance.toAdd.length) {
            for (const item of pendingChanges.staffCompliance.toAdd) {
              const { error } = await supabase
                .from('staff_compliance')
                .insert({
                  staff_id: staffId,
                  compliance_name: item.compliance_name,
                  completion_date: item.completion_date || null,
                  expiry_date: item.expiry_date || null,
                  status: item.status || 'Complete',
                });
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'create',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Added compliance requirement "${item.compliance_name}"`,
              });
            }
          }

          if (pendingChanges?.staffCompliance.toUpdate.length) {
            for (const item of pendingChanges.staffCompliance.toUpdate) {
              const { error } = await supabase
                .from('staff_compliance')
                .update({
                  compliance_name: item.compliance_name,
                  completion_date: item.completion_date || null,
                  expiry_date: item.expiry_date || null,
                  status: item.status || 'Complete',
                })
                .eq('id', item.id);
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'update',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Updated compliance requirement "${item.compliance_name}"`,
              });
            }
          }

          if (pendingChanges?.staffCompliance.toDelete.length) {
            for (const id of pendingChanges.staffCompliance.toDelete) {
              // Get name before deleting for log
              const { data: compData } = await supabase
                .from('staff_compliance')
                .select('compliance_name')
                .eq('id', id)
                .single();

              const { error } = await supabase
                .from('staff_compliance')
                .delete()
                .eq('id', id);
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'delete',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Deleted compliance requirement "${compData?.compliance_name || 'Unknown requirement'}"`,
              });
            }
          }

          // Step 2: Process pending training records
          if (pendingChanges?.training.toAdd.length) {
            for (const item of pendingChanges.training.toAdd) {
              let filePath = null;
              let fileName = null;
              let fileSize = null;

              // Upload file if present
              if (item.file) {
                const fileExt = item.file.name.split('.').pop();
                const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const storagePath = `${staffId}/training/${uniqueFileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('staff-documents')
                  .upload(storagePath, item.file);

                if (uploadError) {
                  toast.error('Failed to upload training document');
                  throw uploadError;
                }

                filePath = storagePath;
                fileName = item.file.name;
                fileSize = item.file.size;
              }

              const { error } = await supabase
                .from('staff_training')
                .insert({
                  staff_id: staffId,
                  title: item.title,
                  category: item.category,
                  description: item.description || null,
                  provider: item.provider || null,
                  date_completed: item.date_completed || null,
                  expiry_date: item.expiry_date || null,
                  file_path: filePath,
                  file_name: fileName,
                  file_size: fileSize,
                  created_by: staffId,
                });
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'create',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Added training record "${item.title}"`,
              });
            }
          }

          if (pendingChanges?.training.toUpdate.length) {
            for (const item of pendingChanges.training.toUpdate) {
              let filePath = item.filePath;
              let fileName = item.fileName;
              let fileSize = null;

              // Upload new file if present
              if (item.file) {
                // Delete old file if exists
                if (item.filePath) {
                  await supabase.storage
                    .from('staff-documents')
                    .remove([item.filePath]);
                }

                const fileExt = item.file.name.split('.').pop();
                const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const storagePath = `${staffId}/training/${uniqueFileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('staff-documents')
                  .upload(storagePath, item.file);

                if (uploadError) {
                  toast.error('Failed to upload training document');
                  throw uploadError;
                }

                filePath = storagePath;
                fileName = item.file.name;
                fileSize = item.file.size;
              }

              const { error } = await supabase
                .from('staff_training')
                .update({
                  title: item.title,
                  category: item.category,
                  description: item.description || null,
                  provider: item.provider || null,
                  date_completed: item.date_completed || null,
                  expiry_date: item.expiry_date || null,
                  file_path: filePath,
                  file_name: fileName,
                  file_size: fileSize,
                })
                .eq('id', item.id);
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'update',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Updated training record "${item.title}"`,
              });
            }
          }

          if (pendingChanges?.training.toDelete.length) {
            for (const item of pendingChanges.training.toDelete) {
              // Get title before deleting for log
              const { data: trainingData } = await supabase
                .from('staff_training')
                .select('title')
                .eq('id', item.id)
                .single();

              // Delete file from storage if exists
              if (item.filePath) {
                await supabase.storage
                  .from('staff-documents')
                  .remove([item.filePath]);
              }

              const { error } = await supabase
                .from('staff_training')
                .delete()
                .eq('id', item.id);
              if (error) {
                const parsedError = parseSupabaseError(error);
                toast.error(parsedError.title, { description: parsedError.description });
                throw error;
              }

              // Log activity
              await logActivity({
                activityType: 'delete',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Deleted training record "${trainingData?.title || 'Unknown training'}"`,
              });
            }
          }

          // Step 1: Upload pending documents
          if (pendingChanges?.documents.toAdd.length) {
            for (const doc of pendingChanges.documents.toAdd) {
              // Upload to storage
              const fileExt = doc.file.name.split('.').pop();
              const fileName = `${staffId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `staff-documents/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('staff-documents')
                .upload(filePath, doc.file);

              if (uploadError) {
                throw new Error(`Failed to upload document: ${uploadError.message}`);
              }

              // Create database record
              const { error: dbError } = await supabase
                .from('staff_documents')
                .insert({
                  staff_id: staffId,
                  file_name: doc.file.name,
                  file_path: filePath,
                });

              if (dbError) {
                throw new Error(`Failed to create document record: ${dbError.message}`);
              }

              // Log activity
              await logActivity({
                activityType: 'create',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
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
                .from('staff-documents')
                .remove([doc.filePath]);

              if (storageError) {
                console.error('Failed to delete from storage:', storageError);
              }

              // Delete from database
              const { error: dbError } = await supabase
                .from('staff_documents')
                .delete()
                .eq('id', doc.id);

              if (dbError) {
                throw new Error(`Failed to delete document record: ${dbError.message}`);
              }

              // Log activity
              await logActivity({
                activityType: 'delete',
                entityType: 'staff',
                entityId: staffId,
                entityName: staffMember?.name,
                userName,
                customDescription: `Deleted document "${doc.fileName}"`,
              });
            }
          }

          // Step 3: Save main staff form data using json-diff-ts
          const toNull = (value: any) => (value === '' ? null : value);
          const normalizedFormData = {
            name: formData.name,
            email: formData.email,
            phone: toNull(formData.phone),
            date_of_birth: toNull(formData.date_of_birth),
            address: toNull(formData.address),
            hobbies: toNull(formData.hobbies),
            allergies: toNull(formData.allergies),
            emergency_contact_name: toNull(formData.emergency_contact_name),
            emergency_contact_phone: toNull(formData.emergency_contact_phone),
            department_id: toNull(formData.department_id),
            employment_type_id: toNull(formData.employment_type_id),
            manager_id: toNull(formData.manager_id),
            hire_date: toNull(formData.hire_date),
            separation_date: toNull(formData.separation_date),
            availability: toNull(formData.availability),
            notes: toNull(formData.notes),
            status: formData.status,
            // Compliance checklist fields
            ndis_worker_screening_check: formData.ndis_worker_screening_check ?? false,
            ndis_worker_screening_check_expiry: toNull(formData.ndis_worker_screening_check_expiry),
            ndis_orientation_module: formData.ndis_orientation_module ?? false,
            ndis_orientation_module_expiry: toNull(formData.ndis_orientation_module_expiry),
            ndis_code_of_conduct: formData.ndis_code_of_conduct ?? false,
            ndis_code_of_conduct_expiry: toNull(formData.ndis_code_of_conduct_expiry),
            ndis_infection_control_training: formData.ndis_infection_control_training ?? false,
            ndis_infection_control_training_expiry: toNull(formData.ndis_infection_control_training_expiry),
            drivers_license: formData.drivers_license ?? false,
            drivers_license_expiry: toNull(formData.drivers_license_expiry),
            comprehensive_car_insurance: formData.comprehensive_car_insurance ?? false,
            comprehensive_car_insurance_expiry: toNull(formData.comprehensive_car_insurance_expiry),
          };

          // Build object with only changed fields by comparing with original staff data
          const changedFields: Record<string, any> = {};
          const formFields = Object.keys(normalizedFormData) as (keyof typeof normalizedFormData)[];
          
          for (const field of formFields) {
            const newValue = normalizedFormData[field];
            const oldValue = staffMember[field as keyof Staff];
            
            // Compare values - handle null/undefined/empty string equivalence
            const normalizedOld = oldValue === undefined || oldValue === '' ? null : oldValue;
            const normalizedNew = newValue === undefined || newValue === '' ? null : newValue;
            
            if (normalizedOld !== normalizedNew) {
              changedFields[field] = newValue;
            }
          }

          console.log('Changed fields:', changedFields);

          // Clear previous validation errors
          clearAllErrors();

          // Validate before saving
          if (Object.keys(changedFields).length > 0) {
            // Check if status is being changed to active or inactive
            const newStatus = changedFields.status || normalizedFormData.status;
            const currentEmail = changedFields.email !== undefined ? changedFields.email : normalizedFormData.email;
            const currentName = normalizedFormData.name;
            
            // Validate: Name is required when status is not draft
            const nameValidation = validators.requiredWhen(
              currentName,
              newStatus == 'active',
              'Name'
            );
            if (!nameValidation.isValid) {
              setFieldError('name', nameValidation.error);
              scrollToField('name');
              toast.error('Name is required', {
                description: 'Please enter a staff member name.'
              });
              return;
            }
            
            // Validate: Email is required when status is not 'draft'
            const emailValidation = validators.requiredWhen(
              currentEmail,
              newStatus == 'active',
              'Email'
            );
            if (!emailValidation.isValid) {
              setFieldError('email', 'Email is required when status is Active');
              scrollToField('email');
              toast.error('Email is required when status is Active', {
                description: 'Please add an email address before changing status to Active.'
              });
              return;
            }

            const { error } = await updateStaffFn(staffId, changedFields);
            if (error) {
              // Parse error using centralized error parser
              const parsedError = parseSupabaseError(error);
              
              // Check if error is related to specific fields
              if (parsedError.title === 'Email already in use') {
                setFieldError('email', parsedError.description);
                scrollToField('email');
              } else if (parsedError.title === 'Email is required') {
                setFieldError('email', parsedError.description);
                scrollToField('email');
              }
              
              toast.error(parsedError.title, { description: parsedError.description });
              throw new Error(parsedError.description);
            }
            console.log('Successfully saved changes to database');
          } else {
            console.log('No changes detected in main form fields');
          }

          // Detect what changed for activity log
          const changes = detectChanges(staffMember, normalizedFormData);

          // Log the activity (only if there were actual changes)
          if (Object.keys(changes).length > 0) {
            await logActivity({
              activityType: 'update',
              entityType: 'staff',
              entityId: staffId,
              entityName: formData.name,
              changes,
              userName,
            });
          }

          // Update local state with saved data
          setStaffMember({ ...staffMember, ...normalizedFormData, photo_url: formData.photo_url ?? staffMember.photo_url });
          
          // Normalize data for form inputs
          const normalizedData = {
            name: normalizedFormData.name ?? '',
            email: normalizedFormData.email ?? '',
            phone: normalizedFormData.phone ?? '',
            date_of_birth: normalizedFormData.date_of_birth ?? '',
            address: normalizedFormData.address ?? '',
            hobbies: normalizedFormData.hobbies ?? '',
            allergies: normalizedFormData.allergies ?? '',
            emergency_contact_name: normalizedFormData.emergency_contact_name ?? '',
            emergency_contact_phone: normalizedFormData.emergency_contact_phone ?? '',
            department_id: normalizedFormData.department_id ?? '',
            employment_type_id: normalizedFormData.employment_type_id ?? '',
            manager_id: normalizedFormData.manager_id ?? '',
            hire_date: normalizedFormData.hire_date ?? '',
            separation_date: normalizedFormData.separation_date ?? '',
            availability: normalizedFormData.availability ?? '',
            notes: normalizedFormData.notes ?? '',
            status: normalizedFormData.status ?? 'draft',
            // Compliance checklist fields
            ndis_worker_screening_check: normalizedFormData.ndis_worker_screening_check ?? false,
            ndis_worker_screening_check_expiry: normalizedFormData.ndis_worker_screening_check_expiry ?? '',
            ndis_orientation_module: normalizedFormData.ndis_orientation_module ?? false,
            ndis_orientation_module_expiry: normalizedFormData.ndis_orientation_module_expiry ?? '',
            ndis_code_of_conduct: normalizedFormData.ndis_code_of_conduct ?? false,
            ndis_code_of_conduct_expiry: normalizedFormData.ndis_code_of_conduct_expiry ?? '',
            ndis_infection_control_training: normalizedFormData.ndis_infection_control_training ?? false,
            ndis_infection_control_training_expiry: normalizedFormData.ndis_infection_control_training_expiry ?? '',
            drivers_license: normalizedFormData.drivers_license ?? false,
            drivers_license_expiry: normalizedFormData.drivers_license_expiry ?? '',
            comprehensive_car_insurance: normalizedFormData.comprehensive_car_insurance ?? false,
            comprehensive_car_insurance_expiry: normalizedFormData.comprehensive_car_insurance_expiry ?? '',
          };
          
          setFormData(normalizedData);
          
          // Update parent with new original data to reset dirty state
          if (onFormDataChange) onFormDataChange(normalizedData);
          if (onOriginalDataChange) onOriginalDataChange(normalizedData);

          // Trigger refresh of child forms
          setRefreshKeys(prev => ({
            compliance: prev.compliance + 1,
            resources: prev.resources + 1,
            training: prev.training + 1,
            activityLog: prev.activityLog + 1,
          }));

          toast.success('Staff member updated successfully');
          onSaveSuccess?.();
        } catch (err: any) {
          console.error('Error saving staff details:', err);
          toast.error('Failed to save changes', { description: err.message });
        } finally {
          onSavingChange?.(false);
        }
      };
    }
    return () => {
      delete (window as any).entityName;
    };
  }, [staffId, staffMember, formData, photoFile, pendingChanges, updateStaff, onFormDataChange, onOriginalDataChange, onSaveSuccess, onSavingChange]);

  // Get the sticky class based on the current layout
  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  if (loading) {
    return <div className="p-4 text-center">Loading staff member...</div>;
  }

  if (!staffMember) {
    return <div className="p-4 text-center text-red-600">Staff member not found</div>;
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
              <StaffDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}
      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        <StaffDetailForm
          key={`staff-form-${refreshKeys.compliance}-${refreshKeys.resources}-${refreshKeys.training}-${refreshKeys.activityLog}`}
          staffId={staffId}
          formData={{ ...formData, photo_url_preview: photoPreview }}
          onFormDataChange={(data) => {
            // Intercept photo fields so they don't enter formData / dirty tracker
            const { photo_file, photo_url_preview, ...rest } = data;
            if (photo_file !== undefined) setPhotoFile(photo_file);
            if (photo_url_preview !== undefined) setPhotoPreview(photo_url_preview);
            setFormData(rest);
            onFormDataChange?.(rest);
          }}
          canEdit={canEdit}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          activityRefreshTrigger={refreshKeys.activityLog}
          validationErrors={validationErrors}
          staffName={staffMember.name}
          documentsRefreshKey={refreshKeys.resources}
          trainingRefreshKey={refreshKeys.training}
        />
      </div>
    </div>
  );
}
