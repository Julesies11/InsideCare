import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { StaffDetailForm } from './components/staff-detail-form';
import { StaffDetailSidebar } from './components/staff-detail-sidebar';
import { Staff, StaffUpdateData, useUpdateStaff, useStaffMember } from '@/hooks/use-staff';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { StaffPendingChanges, emptyStaffPendingChanges } from '@/models/staff-pending-changes';
import { parseSupabaseError } from '@/lib/error-parser';
import { handleAvatarUpload } from '@/lib/api/profiles';
import { useFormValidation } from '@/hooks/use-form-validation';
import { validators } from '@/lib/validation-rules';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';
import { STATUS, COMPLIANCE_STATUS } from '@/config/enums';

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
  onFormDataChange?: (data: Record<string, any>) => void;
  onOriginalDataChange?: (data: Record<string, any>) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  updateStaff?: (params: { id: string; updates: StaffUpdateData }) => Promise<any>;
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
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const { user, setUser } = useAuth();
  const [staffMember, setStaffMember] = useState<Staff | undefined>();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use refs to avoid stale closures in handleSave
  const latestPendingChanges = useRef<StaffPendingChanges>(pendingChanges || emptyStaffPendingChanges);
  const latestFormData = useRef<Record<string, any>>({});
  const latestOriginalData = useRef<Record<string, any>>({});

  // Sync refs when state/props change
  useEffect(() => {
    if (pendingChanges) {
      latestPendingChanges.current = pendingChanges;
    }
  }, [pendingChanges]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Track the original photo URL as state so mutations trigger re-render + dirty effect
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  const { data: staffData, isLoading: staffLoading } = useStaffMember(staffId);
  const { mutateAsync: updateStaffFromHook } = useUpdateStaff();
  // Use prop if available, otherwise use hook instance
  const updateStaffFn = updateStaff || updateStaffFromHook;
  
  // Get user name for activity logging
  const userName = user?.fullname || user?.email || 'Unknown User';

  // Notify parent when photo dirty state changes
  useEffect(() => {
    const photoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
    onPhotoDirtyChange?.(photoDirty);
  }, [photoFile, photoPreview, originalPhotoUrl, onPhotoDirtyChange]);

  const { hasAccess } = useRBAC();

  // Granular RBAC Flags
  const canViewPersonal = hasAccess({ resource: RBAC_MODULES.EMPLOYEES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditPersonal = hasAccess({ resource: RBAC_MODULES.EMPLOYEES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewEmployment = hasAccess({ resource: RBAC_MODULES.STAFF_EMPLOYMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditEmployment = hasAccess({ resource: RBAC_MODULES.STAFF_EMPLOYMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewAvailability = hasAccess({ resource: RBAC_MODULES.STAFF_AVAILABILITY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditAvailability = hasAccess({ resource: RBAC_MODULES.STAFF_AVAILABILITY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewEmergency = hasAccess({ resource: RBAC_MODULES.STAFF_EMERGENCY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditEmergency = hasAccess({ resource: RBAC_MODULES.STAFF_EMERGENCY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewCompliance = hasAccess({ resource: RBAC_MODULES.STAFF_COMPLIANCE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditCompliance = hasAccess({ resource: RBAC_MODULES.STAFF_COMPLIANCE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewTraining = hasAccess({ resource: RBAC_MODULES.STAFF_TRAINING, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditTraining = hasAccess({ resource: RBAC_MODULES.STAFF_TRAINING, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewDocuments = hasAccess({ resource: RBAC_MODULES.STAFF_DOCUMENTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditDocuments = hasAccess({ resource: RBAC_MODULES.STAFF_DOCUMENTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewRoster = hasAccess({ resource: RBAC_MODULES.STAFF_ROSTER, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditRoster = hasAccess({ resource: RBAC_MODULES.STAFF_ROSTER, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewLeave = hasAccess({ resource: RBAC_MODULES.STAFF_LEAVE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditLeave = hasAccess({ resource: RBAC_MODULES.STAFF_LEAVE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewWarnings = hasAccess({ resource: RBAC_MODULES.STAFF_WARNINGS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditWarnings = hasAccess({ resource: RBAC_MODULES.STAFF_WARNINGS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewActivityLog = hasAccess({ resource: RBAC_MODULES.STAFF_ACTIVITY_LOG, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });

  const [formData, setFormData] = useState<Record<string, any>>({
    staff_name: '',
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
    role_id: '',
    manager_id: '',
    hire_date: '',
    separation_date: '',
    availability: '',
    notes: '',
    status: STATUS.draft,
  });

  // Use form validation hook
  const { validationErrors, setFieldError, clearAllErrors, scrollToField } = useFormValidation();

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);
  // Sync staff member data to form state
  useEffect(() => {
    if (staffData && !hasInitialized) {
      setStaffMember(staffData);
      const initialData = {
        staff_name: staffData.staff_name ?? '',
        email: staffData.email ?? '',
        phone: staffData.phone ?? '',
        date_of_birth: staffData.date_of_birth ?? '',
        address: staffData.address ?? '',
        hobbies: staffData.hobbies ?? '',
        allergies: staffData.allergies ?? '',
        emergency_contact_name: staffData.emergency_contact_name ?? '',
        emergency_contact_phone: staffData.emergency_contact_phone ?? '',
        photo_url: staffData.photo_url ?? null,
        department_id: staffData.department_id ?? '',
        employment_type_id: staffData.employment_type_id ?? '',
        role_id: staffData.role_id ?? '',
        manager_id: staffData.manager_id ?? '',
        hire_date: staffData.hire_date ?? '',
        separation_date: staffData.separation_date ?? '',
        availability: staffData.availability ?? '',
        notes: staffData.notes ?? '',
        // Compliance checklist fields
        ndis_worker_screening_check: staffData.ndis_worker_screening_check ?? false,
        ndis_worker_screening_check_expiry: staffData.ndis_worker_screening_check_expiry ?? '',
        ndis_orientation_module: staffData.ndis_orientation_module ?? false,
        ndis_orientation_module_expiry: staffData.ndis_orientation_module_expiry ?? '',
        ndis_code_of_conduct: staffData.ndis_code_of_conduct ?? false,
        ndis_code_of_conduct_expiry: staffData.ndis_code_of_conduct_expiry ?? '',
        ndis_infection_control_training: staffData.ndis_infection_control_training ?? false,
        ndis_infection_control_training_expiry: staffData.ndis_infection_control_training_expiry ?? '',
        drivers_license: staffData.drivers_license ?? false,
        drivers_license_expiry: staffData.drivers_license_expiry ?? '',
        comprehensive_car_insurance: staffData.comprehensive_car_insurance ?? false,
        comprehensive_car_insurance_expiry: staffData.comprehensive_car_insurance_expiry ?? '',
        status: staffData.status ?? 'draft',
      };
      setFormData(initialData);
      latestFormData.current = initialData;
      latestOriginalData.current = initialData;
      onOriginalDataChange?.(initialData);
      onFormDataChange?.(initialData);
      // Record original photo URL for deletion dirty tracking
      setOriginalPhotoUrl(staffData.photo_url ?? null);
      if (staffData.photo_url) setPhotoPreview(staffData.photo_url);
      
      setHasInitialized(true);
      (window as any).entityName = staffData.staff_name;
    }
  }, [staffData, hasInitialized, onFormDataChange, onOriginalDataChange]);

  const loading = staffLoading && !hasInitialized;

  const [refreshKeys, setRefreshKeys] = useState({
    compliance: 0,
    resources: 0,
    training: 0,
    activityLog: 0,
  });

  const handleSave = useCallback(async () => {
    // Get latest data from refs to avoid stale closures
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    const currentOriginalData = latestOriginalData.current;

    if (!staffId || !staffMember) return;

    onSavingChange?.(true);

    try {
      // Step 0: Upload profile photo if a new file was selected, or clear if deleted
      if (photoFile && canEditPersonal) {
        // Use the new handleAvatarUpload utility for resizing and processing
        const newPhotoUrl = await handleAvatarUpload(photoFile, STORAGE_BUCKETS.STAFF_PHOTOS, staffId);

        const { error: photoErr } = await supabase
          .from(TABLES.STAFF)
          .update({ photo_url: newPhotoUrl })
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
        latestFormData.current = { ...currentFormData, photo_url: newPhotoUrl };
      } else if (photoPreview === null && originalPhotoUrl !== null && canEditPersonal) {
        // Photo was deleted — clear it in the DB
        const { error: photoErr } = await supabase
          .from(TABLES.STAFF)
          .update({ photo_url: null })
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
        latestFormData.current = { ...currentFormData, photo_url: null };
      }

      // Step 1: Process pending compliance
      if (canEditCompliance) {
        if (currentPending.staffCompliance.toAdd.length > 0) {
          const toInsert = currentPending.staffCompliance.toAdd.map(item => ({
            staff_id: staffId,
            compliance_name: item.compliance_name,
            completion_date: item.completion_date || null,
            expiry_date: item.expiry_date || null,
            status: item.status || COMPLIANCE_STATUS.COMPLETE,
          }));

          const { error } = await supabase.from(TABLES.STAFF_COMPLIANCE).insert(toInsert);
          if (error) {
            const parsedError = parseSupabaseError(error);
            toast.error(parsedError.title, { description: parsedError.description });
            throw error;
          }
        }

        if (currentPending.staffCompliance.toUpdate.length > 0) {
          for (const item of currentPending.staffCompliance.toUpdate) {
            const { error } = await supabase
              .from(TABLES.STAFF_COMPLIANCE)
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
          }
        }

        if (currentPending.staffCompliance.toDelete.length > 0) {
          const { error } = await supabase
            .from(TABLES.STAFF_COMPLIANCE)
            .delete()
            .in('id', currentPending.staffCompliance.toDelete);
          
          if (error) {
            const parsedError = parseSupabaseError(error);
            toast.error(parsedError.title, { description: parsedError.description });
            throw error;
          }
        }
      }

      // Step 2: Process pending training records
      if (canEditTraining) {
        if (currentPending.training.toAdd.length > 0) {
          const toInsert = [];
          for (const item of currentPending.training.toAdd) {
            let filePath = null;
            let fileName = null;
            let fileSize = null;

            if (item.file) {
              const fileExt = item.file.name.split('.').pop();
              const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const storagePath = `${staffId}/training/${uniqueFileName}`;

              const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
                .upload(storagePath, item.file);

              if (uploadError) {
                toast.error('Failed to upload training document');
                throw uploadError;
              }

              filePath = storagePath;
              fileName = item.file.name;
              fileSize = item.file.size;
            }

            toInsert.push({
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
          }

          const { error } = await supabase.from(TABLES.STAFF_TRAINING).insert(toInsert);
          if (error) {
            const parsedError = parseSupabaseError(error);
            toast.error(parsedError.title, { description: parsedError.description });
            throw error;
          }
        }

        if (currentPending.training.toUpdate.length > 0) {
          for (const item of currentPending.training.toUpdate) {
            let filePath = item.filePath;
            let fileName = item.fileName;
            let fileSize = null;

            if (item.file) {
              if (item.filePath) {
                await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove([item.filePath]);
              }

              const fileExt = item.file.name.split('.').pop();
              const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const storagePath = `${staffId}/training/${uniqueFileName}`;

              const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
                .upload(storagePath, item.file);

              if (uploadError) {
                toast.error('Failed to upload training document');
                throw uploadError;
              }

              filePath = storagePath;
              fileName = item.file.name;
              fileSize = item.file.size;
            }

            const { error = null } = await supabase
              .from(TABLES.STAFF_TRAINING)
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
          }
        }

        if (currentPending.training.toDelete.length > 0) {
          const ids = currentPending.training.toDelete.map(i => i.id);
          const filePaths = currentPending.training.toDelete.map(i => i.filePath).filter(Boolean) as string[];

          if (filePaths.length > 0) {
            await supabase.storage.from(STORAGE_BUCKETS.STAFF_DOCUMENTS).remove(filePaths);
          }

          const { error } = await supabase.from(TABLES.STAFF_TRAINING).delete().in('id', ids);
          if (error) {
            const parsedError = parseSupabaseError(error);
            toast.error(parsedError.title, { description: parsedError.description });
            throw error;
          }
        }
      }

      // Step 3: Process pending documents
      if (canEditDocuments) {
        if (currentPending.documents.toAdd.length > 0) {
          const toInsert = [];
          for (const doc of currentPending.documents.toAdd) {
            const fileExt = doc.file.name.split('.').pop();
            const fileName = `${staffId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `staff-documents/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
              .upload(filePath, doc.file);

            if (uploadError) throw new Error(`Failed to upload document: ${uploadError.message}`);

            toInsert.push({
              staff_id: staffId,
              file_name: doc.file.name,
              file_path: filePath,
            });
          }

          const { error: dbError } = await supabase.from(TABLES.STAFF_DOCUMENTS).insert(toInsert);
          if (dbError) throw new Error(`Failed to create document records: ${dbError.message}`);
        }

        if (currentPending.documents.toDelete.length > 0) {
          const ids = currentPending.documents.toDelete.map(d => d.id);
          const filePaths = currentPending.documents.toDelete.map(d => d.filePath);

          await supabase.storage.from(TABLES.STAFF_DOCUMENTS).remove(filePaths);

          const { error: dbError } = await supabase.from(TABLES.STAFF_DOCUMENTS).delete().in('id', ids);
          if (dbError) throw new Error(`Failed to delete document records: ${dbError.message}`);
        }
      }

      // Step 4: Save main staff form data
      const toNull = (value: any) => (value === '' ? null : value);
      
      const changedFields: Record<string, any> = {};
      const formFields = Object.keys(currentFormData);
      
      for (const field of formFields) {
        const newValue = currentFormData[field];
        const oldValue = currentOriginalData[field];
        
        const normalizedOld = oldValue === undefined || oldValue === '' ? null : oldValue;
        const normalizedNew = newValue === undefined || newValue === '' ? null : newValue;
        
        if (normalizedOld !== normalizedNew) {
          // Check granular permissions for the field
          let canUpdateField = false;
          
          const personalFields = ['staff_name', 'email', 'phone', 'date_of_birth', 'address', 'hobbies', 'allergies', 'status'];
          const employmentFields = ['department_id', 'employment_type_id', 'role_id', 'manager_id', 'hire_date', 'separation_date', 'notes'];
          const availabilityFields = ['availability'];
          const emergencyFields = ['emergency_contact_name', 'emergency_contact_phone'];
          const complianceFields = [
            'ndis_worker_screening_check', 'ndis_worker_screening_check_expiry',
            'ndis_orientation_module', 'ndis_orientation_module_expiry',
            'ndis_code_of_conduct', 'ndis_code_of_conduct_expiry',
            'ndis_infection_control_training', 'ndis_infection_control_training_expiry',
            'drivers_license', 'drivers_license_expiry',
            'comprehensive_car_insurance', 'comprehensive_car_insurance_expiry'
          ];

          if (personalFields.includes(field)) canUpdateField = canEditPersonal;
          else if (employmentFields.includes(field)) canUpdateField = canEditEmployment;
          else if (availabilityFields.includes(field)) canUpdateField = canEditAvailability;
          else if (emergencyFields.includes(field)) canUpdateField = canEditEmergency;
          else if (complianceFields.includes(field)) canUpdateField = canEditCompliance;

          if (canUpdateField) {
            changedFields[field] = (normalizedNew === '' ? null : normalizedNew);
          }
        }
      }

      // Validate and Save
      if (Object.keys(changedFields).length > 0) {
        const newStatus = changedFields.status || currentFormData.status;
        const currentEmail = changedFields.email !== undefined ? changedFields.email : currentFormData.email;
        const currentName = changedFields.staff_name !== undefined ? changedFields.staff_name : currentFormData.staff_name;
        
        clearAllErrors();

        // Validation logic
        if (newStatus === STATUS.active) {
          if (!currentName) {
            setFieldError('staff_name', 'Staff name is required when Active');
            scrollToField('staff_name');
            toast.error('Staff name is required');
            return;
          }
          if (!currentEmail) {
            setFieldError('email', 'Email is required when Active');
            scrollToField('email');
            toast.error('Email is required');
            return;
          }
        }

        try {
          await updateStaffFn({ id: staffId, updates: changedFields });
        } catch (error: any) {
          const parsedError = parseSupabaseError(error);
          if (parsedError.title === 'Email already in use') {
            setFieldError('email', parsedError.description);
            scrollToField('email');
          }
          toast.error(parsedError.title, { description: parsedError.description });
          throw new Error(parsedError.description);
        }
      }

      // Reset state and refs
      setFormData(currentFormData);
      latestOriginalData.current = currentFormData;
      onOriginalDataChange?.(currentFormData);
      onFormDataChange?.(currentFormData);

      if (onPendingChangesChange) {
        onPendingChangesChange(emptyStaffPendingChanges);
        latestPendingChanges.current = emptyStaffPendingChanges;
      }

      // Invalidate and refresh
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF, staffId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_COMPLIANCE, staffId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_TRAINING, staffId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, staffId] });

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
  }, [staffId, staffMember, userName, updateStaffFn, onSavingChange, onOriginalDataChange, onFormDataChange, onPendingChangesChange, onSaveSuccess, clearAllErrors, scrollToField, setFieldError, setUser, user, photoFile, photoPreview, originalPhotoUrl, queryClient, canEditPersonal, canEditEmployment, canEditAvailability, canEditEmergency, canEditCompliance, canEditTraining, canEditDocuments]);

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
    return () => {
      delete (window as any).entityName;
    };
  }, [handleSave, saveHandlerRef]);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  if (loading) {
    return <div className="p-4 text-center">Loading staff member...</div>;
  }

  if (!staffMember && !staffLoading) {
    return <div className="p-4 text-center text-red-600">Staff member not found</div>;
  }

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {!isMobile && (
        <div className="w-[230px] shrink-0">
          <div className={cn('w-[230px]', sidebarSticky && `fixed z-10 start-auto ${stickyClass}`)}>
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
            const { photo_file, photo_url_preview, ...rest } = data;
            if (photo_file !== undefined) setPhotoFile(photo_file);
            if (photo_url_preview !== undefined) setPhotoPreview(photo_url_preview);
            setFormData(rest);
            latestFormData.current = rest;
            onFormDataChange?.(rest);
          }}
          canEditPersonal={canEditPersonal}
          canEditEmployment={canEditEmployment}
          canEditAvailability={canEditAvailability}
          canEditEmergency={canEditEmergency}
          canEditCompliance={canEditCompliance}
          canEditTraining={canEditTraining}
          canEditDocuments={canEditDocuments}
          canEditRoster={canEditRoster}
          canEditLeave={canEditLeave}
          canEditWarnings={canEditWarnings}
          canViewPersonal={canViewPersonal}
          canViewEmployment={canViewEmployment}
          canViewAvailability={canViewAvailability}
          canViewEmergency={canViewEmergency}
          canViewCompliance={canViewCompliance}
          canViewTraining={canViewTraining}
          canViewDocuments={canViewDocuments}
          canViewRoster={canViewRoster}
          canViewLeave={canViewLeave}
          canViewWarnings={canViewWarnings}
          canViewActivityLog={canViewActivityLog}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          activityRefreshTrigger={refreshKeys.activityLog}
          validationErrors={validationErrors}
          staffName={staffMember!.staff_name}
          documentsRefreshKey={refreshKeys.resources}          trainingRefreshKey={refreshKeys.training}
        />
      </div>
    </div>
  );
}
