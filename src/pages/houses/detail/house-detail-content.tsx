import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { HouseDetailSidebar } from './house-detail-sidebar';
import { HouseStaff } from './components/house-staff';
import { HouseCalendarEvents } from './components/house-calendar-events';
import { HouseComms } from './components/house-comms';
import { HouseDocuments } from './components/house-documents';
import { HouseChecklistHistory } from './components/house-checklist-history';
import { HouseChecklistSetup } from './components/house-checklist-setup';
import { HouseResources } from './components/house-resources';
import { HouseManagement } from './components/house-management';
import { HouseTypeCombobox } from './components/house-type-components/HouseTypeCombobox';
import { HouseTypeMasterDialog } from './components/house-type-components/HouseTypeMasterDialog';
import { House } from '@/models/house';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { handleSupabaseError } from '@/errors/error-handler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface HouseDetailContentProps {
  onFormDataChange?: (data: Record<string, any>) => void;
  onOriginalDataChange?: (data: Record<string, any>) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  pendingChanges,
  onPendingChangesChange,
}: HouseDetailContentProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const isSupervisor = user?.role_name?.toLowerCase().includes('supervisor');
  const canEditManagement = isAdmin || isSupervisor;
  const { settings } = useSettings();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [house, setHouse] = useState<House | undefined>();
  const [loading, setLoading] = useState(true);
  
  const canEdit = true;
  const canAdd = true;
  const canDelete = true;

  // Use refs to avoid stale closures in handleSave
  const latestPendingChanges = useRef<HousePendingChanges>(pendingChanges || emptyHousePendingChanges);
  const latestFormData = useRef<Record<string, any>>({});
  const latestOriginalData = useRef<Record<string, any>>({});

  // Sync refs when state/props change
  useEffect(() => {
    if (pendingChanges) {
      latestPendingChanges.current = pendingChanges;
    }
  }, [pendingChanges]);

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Effect to update parentRef after the component mounts
  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) {
      parentRef.current = scrollableElement;
    }
  }, []);

  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    address: '',
    phone: '',
    house_type_id: null,
    capacity: 0,
    current_occupancy: 0,
    house_manager: '',
    status: 'active',
    notes: '',
    individuals_breakdown: '',
    participant_dynamics: '',
    observations: '',
    general_house_details: '',
  });

  const [showHouseTypeDialog, setShowHouseTypeDialog] = useState(false);

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  useEffect(() => {
    if (!id) return;

    const fetchHouse = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('houses')
          .select('id, name, branch_id, address, phone, house_type_id, capacity, current_occupancy, house_manager, status, notes, individuals_breakdown, participant_dynamics, observations, general_house_details, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) throw error;

        setHouse(data);
        const houseData = {
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          house_type_id: data.house_type_id || null,
          capacity: data.capacity || 0,
          current_occupancy: data.current_occupancy || 0,
          house_manager: data.house_manager || '',
          status: data.status || 'active',
          notes: data.notes || '',
          individuals_breakdown: data.individuals_breakdown || '',
          participant_dynamics: data.participant_dynamics || '',
          observations: data.observations || '',
          general_house_details: data.general_house_details || '',
        };
        
        setFormData(houseData);
        latestFormData.current = houseData;
        latestOriginalData.current = houseData;
        
        // Wrap in requestAnimationFrame to avoid "Cannot update a component while rendering a different component"
        requestAnimationFrame(() => {
          if (onOriginalDataChange) onOriginalDataChange(houseData);
          if (onFormDataChange) onFormDataChange(houseData);
        });
      } catch (error) {
        const err = error as Error;
        console.error('Error fetching house:', error);
        toast.error('Failed to load house details', { description: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchHouse();
  }, [id, queryClient, onFormDataChange, onOriginalDataChange]);

  const [refreshKeys, setRefreshKeys] = useState({
    staff: 0,
    calendarEvents: 0,
    documents: 0,
    checklists: 0,
    forms: 0,
    resources: 0,
    participants: 0,
    comms: 0,
  });

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    latestFormData.current = updatedData;
    if (onFormDataChange) onFormDataChange(updatedData);
  };

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    if (!house || !id) return;

    try {
      if (onSavingChange) onSavingChange(true);

      // Step 1: Save basic house details
      const { data: houseData, error: houseError } = await supabase
        .from('houses')
        .update({
          name: currentFormData.name,
          address: currentFormData.address || null,
          phone: currentFormData.phone || null,
          house_type_id: currentFormData.house_type_id || null,
          capacity: currentFormData.capacity || 0,
          current_occupancy: currentFormData.current_occupancy || 0,
          house_manager: currentFormData.house_manager || null,
          status: currentFormData.status,
          notes: currentFormData.notes || null,
          individuals_breakdown: currentFormData.individuals_breakdown || null,
          participant_dynamics: currentFormData.participant_dynamics || null,
          observations: currentFormData.observations || null,
          general_house_details: currentFormData.general_house_details || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (houseError) {
        handleSupabaseError(houseError, 'Failed to save house details');
        return;
      }

      // Get the staff record ID for the current authenticated user
      let currentStaffId = null;
      if (user?.id) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (staffData) {
          currentStaffId = staffData.id;
        }
      }

      // Step 2: Process pending participants
      if (currentPending.participants.toAdd.length) {
        for (const p of currentPending.participants.toAdd) {
          const { error } = await supabase
            .from('participants')
            .update({
              house_id: id,
              move_in_date: p.move_in_date || null,
              status: p.is_active ? 'active' : 'inactive',
            })
            .eq('id', p.participant_id);

          if (error) {
            throw new Error(`Failed to link participant: ${error.message}`);
          }
        }
      }

      if (currentPending.participants.toUpdate.length) {
        for (const p of currentPending.participants.toUpdate) {
          const updates: any = {};
          if (p.move_in_date !== undefined) updates.move_in_date = p.move_in_date;
          if (p.is_active !== undefined) updates.status = p.is_active ? 'active' : 'inactive';
          
          const { error } = await supabase
            .from('participants')
            .update(updates)
            .eq('id', p.id);

          if (error) {
            throw new Error(`Failed to update participant: ${error.message}`);
          }
        }
      }

      if (currentPending.participants.toDelete.length) {
        for (const pId of currentPending.participants.toDelete) {
          const { error } = await supabase
            .from('participants')
            .update({ house_id: null })
            .eq('id', pId);

          if (error) {
            throw new Error(`Failed to unlink participant: ${error.message}`);
          }
        }
      }

      // Step 3: Process pending staff assignments
      if (currentPending.staff.toAdd.length) {
        for (const staffAssignment of currentPending.staff.toAdd) {
          const { error } = await supabase
            .from('house_staff_assignments')
            .insert({
              house_id: id,
              staff_id: staffAssignment.staff_id,
              is_primary: staffAssignment.is_primary,
              start_date: staffAssignment.start_date || null,
              end_date: staffAssignment.end_date || null,
              notes: staffAssignment.notes || null,
            });

          if (error) {
            throw new Error(`Failed to add staff assignment: ${error.message}`);
          }
        }
      }

      if (currentPending.staff.toUpdate.length) {
        for (const staffAssignment of currentPending.staff.toUpdate) {
          const { error } = await supabase
            .from('house_staff_assignments')
            .update({
              staff_id: staffAssignment.staff_id,
              is_primary: staffAssignment.is_primary,
              start_date: staffAssignment.start_date || null,
              end_date: staffAssignment.end_date || null,
              notes: staffAssignment.notes || null,
            })
            .eq('id', staffAssignment.id);

          if (error) {
            throw new Error(`Failed to update staff assignment: ${error.message}`);
          }
        }
      }

      if (currentPending.staff.toDelete.length) {
        for (const staffAssignmentId of currentPending.staff.toDelete) {
          const { error } = await supabase
            .from('house_staff_assignments')
            .delete()
            .eq('id', staffAssignmentId);

          if (error) {
            throw new Error(`Failed to delete staff assignment: ${error.message}`);
          }
        }
      }

      // Step 3: Process pending calendar events
      if (currentPending.calendarEvents.toAdd.length) {
        for (const event of currentPending.calendarEvents.toAdd) {
          const { error } = await supabase
            .from('house_calendar_events')
            .insert({
              house_id: id,
              title: event.title,
              type: event.type,
              event_type_id: event.event_type_id || null,
              description: event.description || null,
              event_date: event.event_date,
              start_time: event.start_time || null,
              end_time: event.end_time || null,
              participant_id: event.participant_id || null,
              assigned_staff_id: event.assigned_staff_id || null,
              status: event.status || 'scheduled',
              location: event.location || null,
              notes: event.notes || null,
              created_by: currentStaffId,
            });

          if (error) {
            throw new Error(`Failed to add calendar event: ${error.message}`);
          }
        }
      }

      if (currentPending.calendarEvents.toUpdate.length) {
        for (const event of currentPending.calendarEvents.toUpdate) {
          const { error } = await supabase
            .from('house_calendar_events')
            .update({
              title: event.title,
              type: event.type,
              event_type_id: event.event_type_id || null,
              description: event.description || null,
              event_date: event.event_date,
              start_time: event.start_time || null,
              end_time: event.end_time || null,
              participant_id: event.participant_id || null,
              assigned_staff_id: event.assigned_staff_id || null,
              status: event.status || 'scheduled',
              location: event.location || null,
              notes: event.notes || null,
            })
            .eq('id', event.id);

          if (error) {
            throw new Error(`Failed to update calendar event: ${error.message}`);
          }
        }
      }

      if (currentPending.calendarEvents.toDelete.length) {
        for (const eventId of currentPending.calendarEvents.toDelete) {
          const { error } = await supabase
            .from('house_calendar_events')
            .delete()
            .eq('id', eventId);

          if (error) {
            throw new Error(`Failed to delete calendar event: ${error.message}`);
          }
        }
      }

      // Step 4: Process pending documents
      if (currentPending.documents.toAdd.length) {
        for (const doc of currentPending.documents.toAdd) {
          // Upload to storage
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `house-documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('house-documents')
            .upload(filePath, doc.file);

          if (uploadError) {
            throw new Error(`Failed to upload document: ${uploadError.message}`);
          }

          // Insert record
          const { error } = await supabase
            .from('house_files')
            .insert({
              house_id: id,
              file_name: doc.fileName,
              file_path: filePath,
              file_size: doc.file.size,
              file_type: doc.file.type,
              uploaded_by: currentStaffId,
            });

          if (error) {
            throw new Error(`Failed to save document record: ${error.message}`);
          }
        }
      }

      if (currentPending.documents.toDelete.length) {
        for (const doc of currentPending.documents.toDelete) {
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('house-documents')
            .remove([doc.filePath]);

          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
          }

          // Delete record
          const { error } = await supabase
            .from('house_files')
            .delete()
            .eq('id', doc.id);

          if (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
          }
        }
      }

      // Step 5: Process pending checklists
      if (currentPending.checklists.toAdd.length) {
        for (const checklist of currentPending.checklists.toAdd) {
          // Insert checklist
          const { data: checklistData, error: checklistError } = await supabase
            .from('house_checklists')
            .insert({
              house_id: id,
              name: checklist.name,
              frequency: checklist.frequency,
              days_of_week: checklist.days_of_week || null,
              description: checklist.description || null,
              master_id: checklist.master_id || null,
            })
            .select()
            .single();

          if (checklistError) {
            throw new Error(`Failed to add checklist: ${checklistError.message}`);
          }

          // Insert checklist items
          if (checklist.items && checklist.items.length > 0) {
            const itemsToInsert = checklist.items.map(item => ({
              checklist_id: checklistData.id,
              title: item.title,
              instructions: item.instructions || null,
              priority: item.priority,
              is_required: item.is_required,
              sort_order: item.sort_order,
              master_item_id: item.master_item_id || null,
            }));

            const { error: itemsError } = await supabase
              .from('house_checklist_items')
              .insert(itemsToInsert);

            if (itemsError) {
              throw new Error(`Failed to add checklist items: ${itemsError.message}`);
            }
          }
        }
      }

      if (currentPending.checklists.toUpdate.length) {
        for (const checklist of currentPending.checklists.toUpdate) {
          if (!checklist.id) continue;
          const { error } = await supabase
            .from('house_checklists')
            .update({
              name: checklist.name,
              frequency: checklist.frequency,
              days_of_week: checklist.days_of_week || null,
              description: checklist.description || null,
            })
            .eq('id', checklist.id);

          if (error) {
            throw new Error(`Failed to update checklist: ${error.message}`);
          }
        }
      }

      if (currentPending.checklists.toDelete.length) {
        for (const checklistId of currentPending.checklists.toDelete) {
          if (!checklistId) continue;
          const { error } = await supabase
            .from('house_checklists')
            .delete()
            .eq('id', checklistId);

          if (error) {
            throw new Error(`Failed to delete checklist: ${error.message}`);
          }
        }
      }

      // Step 6: Process pending checklist items
      if (currentPending.checklists.checklistItems.toAdd.length) {
        for (const item of currentPending.checklists.checklistItems.toAdd) {
          const { error } = await supabase
            .from('house_checklist_items')
            .insert({
              checklist_id: item.checklist_id,
              title: item.title,
              instructions: item.instructions || null,
              priority: item.priority,
              is_required: item.is_required,
              sort_order: item.sort_order,
              master_item_id: item.master_item_id || null,
            });

          if (error) {
            throw new Error(`Failed to add checklist item: ${error.message}`);
          }
        }
      }

      if (currentPending.checklists.checklistItems.toUpdate.length) {
        for (const item of currentPending.checklists.checklistItems.toUpdate) {
          const { error } = await supabase
            .from('house_checklist_items')
            .update({
              title: item.title,
              instructions: item.instructions || null,
              priority: item.priority,
              is_required: item.is_required,
              sort_order: item.sort_order,
              master_item_id: item.master_item_id || null,
            })
            .eq('id', item.id);

          if (error) {
            throw new Error(`Failed to update checklist item: ${error.message}`);
          }
        }
      }

      if (currentPending.checklists.checklistItems.toDelete.length) {
        for (const itemId of currentPending.checklists.checklistItems.toDelete) {
          const { error } = await supabase
            .from('house_checklist_items')
            .delete()
            .eq('id', itemId);

          if (error) {
            throw new Error(`Failed to delete checklist item: ${error.message}`);
          }
        }
      }

      // Step 7: Process pending forms
      if (currentPending.forms.toAdd.length) {
        for (const form of currentPending.forms.toAdd) {
          const { error } = await supabase
            .from('house_forms')
            .insert({
              house_id: id,
              name: form.name,
              type: form.type,
              description: form.description || null,
              frequency: form.frequency,
              status: form.status || 'active',
              created_by: currentStaffId,
            });

          if (error) {
            throw new Error(`Failed to add form: ${error.message}`);
          }
        }
      }

      if (currentPending.forms.toUpdate.length) {
        for (const form of currentPending.forms.toUpdate) {
          const { error } = await supabase
            .from('house_forms')
            .update({
              name: form.name,
              type: form.type,
              description: form.description || null,
              frequency: form.frequency,
              status: form.status || 'active',
            })
            .eq('id', form.id);

          if (error) {
            throw new Error(`Failed to update form: ${error.message}`);
          }
        }
      }

      if (currentPending.forms.toDelete.length) {
        for (const formId of currentPending.forms.toDelete) {
          const { error } = await supabase
            .from('house_forms')
            .delete()
            .eq('id', formId);

          if (error) {
            throw new Error(`Failed to delete form: ${error.message}`);
          }
        }
      }

      // Step 8: Process pending form assignments
      if (currentPending.formAssignments.toAdd.length) {
        for (const assignment of currentPending.formAssignments.toAdd) {
          const { error } = await supabase
            .from('house_form_assignments')
            .insert({
              form_id: assignment.form_id,
              participant_id: assignment.participant_id || null,
              staff_id: assignment.staff_id || null,
              due_date: assignment.due_date || null,
              status: assignment.status || 'pending',
              notes: assignment.notes || null,
              assigned_by: currentStaffId,
            });

          if (error) {
            throw new Error(`Failed to add form assignment: ${error.message}`);
          }
        }
      }

      if (currentPending.formAssignments.toUpdate.length) {
        for (const assignment of currentPending.formAssignments.toUpdate) {
          const { error } = await supabase
            .from('house_form_assignments')
            .update({
              participant_id: assignment.participant_id || null,
              staff_id: assignment.staff_id || null,
              due_date: assignment.due_date || null,
              status: assignment.status || 'pending',
              notes: assignment.notes || null,
            })
            .eq('id', assignment.id);

          if (error) {
            throw new Error(`Failed to update form assignment: ${error.message}`);
          }
        }
      }

      if (currentPending.formAssignments.toDelete.length) {
        for (const assignmentId of currentPending.formAssignments.toDelete) {
          const { error } = await supabase
            .from('house_form_assignments')
            .delete()
            .eq('id', assignmentId);

          if (error) {
            throw new Error(`Failed to delete form assignment: ${error.message}`);
          }
        }
      }

      // Step 9: Process pending resources
      if (currentPending.resources.toAdd.length) {
        for (const resource of currentPending.resources.toAdd) {
          const { error } = await supabase
            .from('house_resources')
            .insert({
              house_id: id,
              title: resource.title,
              category: resource.category,
              type: resource.type,
              description: resource.description || null,
              priority: resource.priority,
              phone: resource.phone || null,
              address: resource.address || null,
              file_url: resource.file_url || null,
              file_name: resource.file_name || null,
              file_size: resource.file_size || null,
              notes: resource.notes || null,
              created_by: currentStaffId,
            });

          if (error) {
            throw new Error(`Failed to add resource: ${error.message}`);
          }
        }
      }

      if (currentPending.resources.toUpdate.length) {
        for (const resource of currentPending.resources.toUpdate) {
          const { error } = await supabase
            .from('house_resources')
            .update({
              title: resource.title,
              category: resource.category,
              type: resource.type,
              description: resource.description || null,
              priority: resource.priority,
              phone: resource.phone || null,
              address: resource.address || null,
              file_url: resource.file_url || null,
              file_name: resource.file_name || null,
              file_size: resource.file_size || null,
              notes: resource.notes || null,
            })
            .eq('id', resource.id);

          if (error) {
            throw new Error(`Failed to update resource: ${error.message}`);
          }
        }
      }

      if (currentPending.resources.toDelete.length) {
        for (const resourceId of currentPending.resources.toDelete) {
          const { error } = await supabase
            .from('house_resources')
            .delete()
            .eq('id', resourceId);

          if (error) {
            throw new Error(`Failed to delete resource: ${error.message}`);
          }
        }
      }

      // Step 10: Process pending comms
      if (currentPending.comms.toAdd.length) {
        for (const entry of currentPending.comms.toAdd) {
          const { error } = await supabase
            .from('house_comms')
            .insert({
              house_id: id,
              entry_date: entry.entry_date,
              content: entry.content,
              created_by: currentStaffId || entry.created_by,
            });

          if (error) {
            throw new Error(`Failed to add communication entry: ${error.message}`);
          }
        }
      }

      // Final Step: Log Activity & Refresh
      const updatedHouseData = { ...currentFormData };
      setHouse(houseData);
      latestOriginalData.current = updatedHouseData;
      if (onOriginalDataChange) onOriginalDataChange(updatedHouseData);
      if (onFormDataChange) onFormDataChange(updatedHouseData);

      // Invalidate queries to ensure child components fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['house-staff-assignments', { houseId: id }] });
      queryClient.invalidateQueries({ queryKey: ['house-participants', { houseId: id }] });
      queryClient.invalidateQueries({ queryKey: ['house-calendar-events', { houseId: id }] });
      queryClient.invalidateQueries({ queryKey: ['house-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['house-checklists', id] });
      queryClient.invalidateQueries({ queryKey: ['house-forms', id] });
      queryClient.invalidateQueries({ queryKey: ['house-resources', id] });
      queryClient.invalidateQueries({ queryKey: ['house_comms', { houseId: id }] });

      toast.success('All changes saved successfully');

      // Update counters based on what was changed
      setRefreshKeys(prev => ({
        ...prev,
        staff: (currentPending.staff.toAdd.length || 0) > 0 || (currentPending.staff.toUpdate.length || 0) > 0 || (currentPending.staff.toDelete.length || 0) > 0 ? prev.staff + 1 : prev.staff,
        calendarEvents: (currentPending.calendarEvents.toAdd.length || 0) > 0 || (currentPending.calendarEvents.toUpdate.length || 0) > 0 || (currentPending.calendarEvents.toDelete.length || 0) > 0 ? prev.calendarEvents + 1 : prev.calendarEvents,
        documents: (currentPending.documents.toAdd.length || 0) > 0 || (currentPending.documents.toDelete.length || 0) > 0 ? prev.documents + 1 : prev.documents,
        checklists: (currentPending.checklists.toAdd.length || 0) > 0 || (currentPending.checklists.toUpdate.length || 0) > 0 || (currentPending.checklists.toDelete.length || 0) > 0 || (currentPending.checklists.checklistItems.toAdd.length || 0) > 0 || (currentPending.checklists.checklistItems.toUpdate.length || 0) > 0 || (currentPending.checklists.checklistItems.toDelete.length || 0) > 0 ? prev.checklists + 1 : prev.checklists,
        forms: (currentPending.forms.toAdd.length || 0) > 0 || (currentPending.forms.toUpdate.length || 0) > 0 || (currentPending.forms.toDelete.length || 0) > 0 || (currentPending.formAssignments.toAdd.length || 0) > 0 || (currentPending.formAssignments.toUpdate.length || 0) > 0 || (currentPending.formAssignments.toDelete.length || 0) > 0 ? prev.forms + 1 : prev.forms,
        resources: (currentPending.resources.toAdd.length || 0) > 0 || (currentPending.resources.toUpdate.length || 0) > 0 || (currentPending.resources.toDelete.length || 0) > 0 ? prev.resources + 1 : prev.resources,
        participants: (currentPending.participants.toAdd.length || 0) > 0 || (currentPending.participants.toUpdate.length || 0) > 0 || (currentPending.participants.toDelete.length || 0) > 0 ? prev.participants + 1 : prev.participants,
        comms: (currentPending.comms.toAdd.length || 0) > 0 ? prev.comms + 1 : prev.comms,
      }));

      // Clear pending changes after successful save
      if (onPendingChangesChange) {
        onPendingChangesChange(emptyHousePendingChanges);
      }

    } catch (error) {
      const err = error as Error;
      console.error('Error saving house changes:', error);
      toast.error('Failed to save some changes', { description: err.message });
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [id, house, user, queryClient, onOriginalDataChange, onFormDataChange, onSavingChange, onPendingChangesChange, isAdmin]);

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [saveHandlerRef, handleSave]);

  // Get the sticky class based on the current layout
  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  if (loading && !house) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground animate-pulse font-medium">Loading house details...</div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground font-medium text-center">
          <p>House not found.</p>
          <Button variant="link" onClick={() => window.history.back()}>Go Back</Button>
        </div>
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
              <HouseDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5" id="scrollable_content">
          <Card id="house_details">
            <CardHeader>
              <CardTitle>House Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">House Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="Enter house name"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">Address</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="Enter house address"
                      rows={2}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">Phone Number</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">House Type</Label>
                    <HouseTypeCombobox
                      value={formData.house_type_id}
                      onChange={(value) => handleFieldChange('house_type_id', value)}
                      canEdit={canEdit}
                      onManageList={() => setShowHouseTypeDialog(true)}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">Capacity</Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value))}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">Current Occupancy</Label>
                    <Input
                      type="number"
                      value={formData.current_occupancy}
                      onChange={(e) => handleFieldChange('current_occupancy', parseInt(e.target.value))}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">House Manager</Label>
                    <Input
                      value={formData.house_manager}
                      onChange={(e) => handleFieldChange('house_manager', e.target.value)}
                      placeholder="Enter manager name"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <Label className="flex w-full max-w-56">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleFieldChange('status', value)} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full">
                  <Label className="mb-2.5 block">Internal Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Enter any additional notes about this house"
                    rows={4}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <HouseManagement
            houseId={id}
            formData={formData}
            onFieldChange={handleFieldChange}
            canEdit={canEditManagement}
          />

          <HouseCalendarEvents
            key={`calendar-${refreshKeys.calendarEvents}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <div id="checklist_comms_section" className="flex flex-col gap-5 lg:gap-7.5">
            <HouseComms
              key={`comms-${refreshKeys.comms}`}
              houseId={id}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />

            <HouseChecklistSetup
              key={`checklists-${refreshKeys.checklists}`}
              houseId={id}
              canAdd={canAdd}
              canDelete={canDelete}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />

            <HouseChecklistHistory
              houseId={id}
            />
          </div>

          <HouseDocuments
            key={`documents-${refreshKeys.documents}`}
            houseId={id}
            houseName={formData?.name}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseResources
            key={`resources-${refreshKeys.resources}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseStaff
            key={`staff-${refreshKeys.staff}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />
      </div>

      <HouseTypeMasterDialog
        open={showHouseTypeDialog}
        onClose={() => setShowHouseTypeDialog(false)}
        onUpdate={() => {}}
      />
    </div>
  );
}
