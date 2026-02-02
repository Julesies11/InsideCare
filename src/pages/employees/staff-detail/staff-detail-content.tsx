import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { StaffDetailForm } from './components/staff-detail-form';
import { StaffDetailSidebar } from './components/staff-detail-sidebar';
import { Staff, StaffUpdateData, useStaff } from '@/hooks/useStaff';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PendingChanges } from '@/models/pending-changes';
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
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
  updateStaff?: (id: string, updates: StaffUpdateData) => Promise<{ data: any; error: string | null }>;
  onSaveSuccess?: () => void;
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
}: StaffDetailContentProps) {
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [staffMember, setStaffMember] = useState<Staff | undefined>();
  const [loading, setLoading] = useState(true);
  const [sidebarSticky, setSidebarSticky] = useState(false);

  const canEdit = true;

  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    department: '',
    hire_date: '',
    qualifications: '',
    certifications: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    employment_type: '',
    working_hours: '',
    notes: '',
    status: 'draft',
    is_active: true,
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
          department: data.department ?? '',
          hire_date: data.hire_date ?? '',
          qualifications: data.qualifications ?? '',
          certifications: data.certifications ?? '',
          date_of_birth: data.date_of_birth ?? '',
          address: data.address ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          employment_type: data.employment_type ?? '',
          working_hours: data.working_hours ?? '',
          notes: data.notes ?? '',
          status: data.status ?? 'draft',
          is_active: data.is_active ?? true,
        };
        setFormData(initialData);
        onOriginalDataChange?.(initialData);
        onFormDataChange?.(initialData);
        
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
    activityLog: 0,
  });

  // Set up save handler
  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = async () => {
        if (!staffId || !staffMember) return;

        onSavingChange?.(true);

        try {
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

          // Step 2: Process pending resources
          if (pendingChanges?.staffResources.toAdd.length) {
            for (const item of pendingChanges.staffResources.toAdd) {
              const { error } = await supabase
                .from('staff_resources')
                .insert({
                  category: item.category,
                  title: item.title,
                  description: item.description || null,
                  type: item.type,
                  external_url: item.external_url || null,
                  duration: item.duration || null,
                  is_popular: item.is_popular || false,
                  created_by: staffId, // Assuming current staff is creator
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
                customDescription: `Added resource "${item.title}"`,
              });
            }
          }

          if (pendingChanges?.staffResources.toUpdate.length) {
            for (const item of pendingChanges.staffResources.toUpdate) {
              const { error } = await supabase
                .from('staff_resources')
                .update({
                  category: item.category,
                  title: item.title,
                  description: item.description || null,
                  type: item.type,
                  external_url: item.external_url || null,
                  duration: item.duration || null,
                  is_popular: item.is_popular || false,
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
                customDescription: `Updated resource "${item.title}"`,
              });
            }
          }

          if (pendingChanges?.staffResources.toDelete.length) {
            for (const id of pendingChanges.staffResources.toDelete) {
              // Get title before deleting for log
              const { data: resData } = await supabase
                .from('staff_resources')
                .select('title')
                .eq('id', id)
                .single();

              const { error } = await supabase
                .from('staff_resources')
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
                customDescription: `Deleted resource "${resData?.title || 'Unknown resource'}"`,
              });
            }
          }

          // Step 3: Save main staff form data using json-diff-ts
          const toNull = (value: any) => (value === '' ? null : value);
          const normalizedFormData = {
            name: formData.name,
            email: formData.email,
            phone: toNull(formData.phone),
            department: toNull(formData.department),
            hire_date: toNull(formData.hire_date),
            qualifications: toNull(formData.qualifications),
            certifications: toNull(formData.certifications),
            date_of_birth: toNull(formData.date_of_birth),
            address: toNull(formData.address),
            emergency_contact_name: toNull(formData.emergency_contact_name),
            emergency_contact_phone: toNull(formData.emergency_contact_phone),
            employment_type: toNull(formData.employment_type),
            working_hours: toNull(formData.working_hours),
            notes: toNull(formData.notes),
            status: formData.status,
            is_active: formData.is_active,
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
              newStatus !== 'draft',
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
              newStatus !== 'draft',
              'Email'
            );
            if (!emailValidation.isValid) {
              setFieldError('email', 'Email is required when status is Active or Inactive');
              scrollToField('email');
              toast.error('Email is required when status is Active or Inactive', {
                description: 'Please add an email address before changing status to Active or Inactive.'
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
          setStaffMember({ ...staffMember, ...normalizedFormData });
          
          // Normalize data for form inputs
          const normalizedData = {
            name: normalizedFormData.name ?? '',
            email: normalizedFormData.email ?? '',
            phone: normalizedFormData.phone ?? '',
            department: normalizedFormData.department ?? '',
            hire_date: normalizedFormData.hire_date ?? '',
            qualifications: normalizedFormData.qualifications ?? '',
            certifications: normalizedFormData.certifications ?? '',
            date_of_birth: normalizedFormData.date_of_birth ?? '',
            address: normalizedFormData.address ?? '',
            emergency_contact_name: normalizedFormData.emergency_contact_name ?? '',
            emergency_contact_phone: normalizedFormData.emergency_contact_phone ?? '',
            employment_type: normalizedFormData.employment_type ?? '',
            working_hours: normalizedFormData.working_hours ?? '',
            notes: normalizedFormData.notes ?? '',
            status: normalizedFormData.status ?? 'draft',
            is_active: normalizedFormData.is_active ?? true,
          };
          
          setFormData(normalizedData);
          
          // Update parent with new original data to reset dirty state
          if (onFormDataChange) onFormDataChange(normalizedData);
          if (onOriginalDataChange) onOriginalDataChange(normalizedData);

          // Trigger refresh of child forms
          setRefreshKeys(prev => ({
            compliance: prev.compliance + 1,
            resources: prev.resources + 1,
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
  }, [staffId, staffMember, formData, pendingChanges, updateStaff, onFormDataChange, onOriginalDataChange, onSaveSuccess, onSavingChange]);

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
          key={`staff-form-${refreshKeys.compliance}-${refreshKeys.resources}-${refreshKeys.activityLog}`}
          staffId={staffId}
          formData={formData}
          onFormDataChange={(data) => {
            setFormData(data);
            onFormDataChange?.(data);
          }}
          canEdit={canEdit}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          activityRefreshTrigger={refreshKeys.activityLog}
          validationErrors={validationErrors}
        />
      </div>
    </div>
  );
}
