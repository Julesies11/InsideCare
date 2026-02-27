import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { useAuth } from '@/auth/context/auth-context';
import { Scrollspy } from '@/components/ui/scrollspy';
import { HouseDetailSidebar } from './house-detail-sidebar';
import { HouseParticipants } from './components/house-participants';
import { HouseStaff } from './components/house-staff';
import { HouseCalendarEvents } from './components/house-calendar-events';
import { HouseDocuments } from './components/house-documents';
import { HouseChecklists } from './components/house-checklists';
import { HouseForms } from './components/house-forms';
import { HouseResources } from './components/house-resources';
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
import { Badge } from '@/components/ui/badge';

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
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  updateHouse?: (id: string, updates: Partial<House>) => Promise<{ data: any; error: string | null }>;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
  updateHouse,
  pendingChanges,
  onPendingChangesChange,
}: HouseDetailContentProps) {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const [house, setHouse] = useState<House | undefined>();
  const [loading, setLoading] = useState(true);
  
  const canEdit = true;
  const canAdd = true;
  const canDelete = true;

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  const [formData, setFormData] = useState<any>({
    name: '',
    address: '',
    phone: '',
    capacity: 0,
    current_occupancy: 0,
    house_manager: '',
    status: 'active',
    notes: '',
  });

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

  useEffect(() => {
    if (!id) return;

    const fetchHouse = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('houses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setHouse(data);
        const houseData = {
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          capacity: data.capacity || 0,
          current_occupancy: data.current_occupancy || 0,
          house_manager: data.house_manager || '',
          status: data.status || 'active',
          notes: data.notes || '',
        };
        setFormData(houseData);
        if (onOriginalDataChange) onOriginalDataChange(houseData);
        if (onFormDataChange) onFormDataChange(houseData);
      } catch (error: any) {
        console.error('Error fetching house:', error);
        toast.error('Failed to load house details', { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchHouse();
  }, [id]);

  const [refreshKeys, setRefreshKeys] = useState({
    staff: 0,
    calendarEvents: 0,
    documents: 0,
    checklists: 0,
    forms: 0,
    resources: 0,
    participants: 0,
  });

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (onFormDataChange) onFormDataChange(updatedData);
  };

  const handleSave = async () => {
    if (!house || !id) return;

    try {
      if (onSavingChange) onSavingChange(true);

      // Step 1: Save basic house details
      const { data: houseData, error: houseError } = await supabase
        .from('houses')
        .update(formData)
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

      // Step 2: Process pending staff assignments
      if (pendingChanges?.staff.toAdd.length) {
        for (const staffAssignment of pendingChanges.staff.toAdd) {
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

      if (pendingChanges?.staff.toUpdate.length) {
        for (const staffAssignment of pendingChanges.staff.toUpdate) {
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

      if (pendingChanges?.staff.toDelete.length) {
        for (const staffAssignmentId of pendingChanges.staff.toDelete) {
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
      if (pendingChanges?.calendarEvents.toAdd.length) {
        for (const event of pendingChanges.calendarEvents.toAdd) {
          const { error } = await supabase
            .from('house_calendar_events')
            .insert({
              house_id: id,
              title: event.title,
              type: event.type,
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

      if (pendingChanges?.calendarEvents.toUpdate.length) {
        for (const event of pendingChanges.calendarEvents.toUpdate) {
          const { error } = await supabase
            .from('house_calendar_events')
            .update({
              title: event.title,
              type: event.type,
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

      if (pendingChanges?.calendarEvents.toDelete.length) {
        for (const eventId of pendingChanges.calendarEvents.toDelete) {
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
      if (pendingChanges?.documents.toAdd.length) {
        for (const doc of pendingChanges.documents.toAdd) {
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

      if (pendingChanges?.documents.toDelete.length) {
        for (const doc of pendingChanges.documents.toDelete) {
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
      if (pendingChanges?.checklists.toAdd.length) {
        for (const checklist of pendingChanges.checklists.toAdd) {
          // Insert checklist
          const { data: checklistData, error: checklistError } = await supabase
            .from('house_checklists')
            .insert({
              house_id: id,
              name: checklist.name,
              frequency: checklist.frequency,
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

      if (pendingChanges?.checklists.toUpdate.length) {
        for (const checklist of pendingChanges.checklists.toUpdate) {
          if (!checklist.id) continue;
          const { error } = await supabase
            .from('house_checklists')
            .update({
              name: checklist.name,
              frequency: checklist.frequency,
              description: checklist.description || null,
            })
            .eq('id', checklist.id);

          if (error) {
            throw new Error(`Failed to update checklist: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.checklists.toDelete.length) {
        for (const checklistId of pendingChanges.checklists.toDelete) {
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
      if (pendingChanges?.checklists.checklistItems.toAdd.length) {
        for (const item of pendingChanges.checklists.checklistItems.toAdd) {
          const { error } = await supabase
            .from('house_checklist_items')
            .insert({
              checklist_id: item.checklist_id,
              title: item.title,
              instructions: item.instructions || null,
              priority: item.priority,
              is_required: item.is_required,
              sort_order: item.sort_order,
            });

          if (error) {
            throw new Error(`Failed to add checklist item: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.checklists.checklistItems.toUpdate.length) {
        for (const item of pendingChanges.checklists.checklistItems.toUpdate) {
          const { error } = await supabase
            .from('house_checklist_items')
            .update({
              title: item.title,
              instructions: item.instructions || null,
              priority: item.priority,
              is_required: item.is_required,
              sort_order: item.sort_order,
            })
            .eq('id', item.id);

          if (error) {
            throw new Error(`Failed to update checklist item: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.checklists.checklistItems.toDelete.length) {
        for (const itemId of pendingChanges.checklists.checklistItems.toDelete) {
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
      if (pendingChanges?.forms.toAdd.length) {
        for (const form of pendingChanges.forms.toAdd) {
          const { data: formData, error: formError } = await supabase
            .from('house_forms')
            .insert({
              house_id: id,
              name: form.name,
              type: form.type,
              description: form.description || null,
              frequency: form.frequency,
              is_global: form.is_global,
              status: form.status,
              created_by: user?.id || null,
            })
            .select()
            .single();

          if (formError) {
            throw new Error(`Failed to add form: ${formError.message}`);
          }

          // If there are form assignments for this form, add them
          const assignments = pendingChanges?.formAssignments.toAdd.filter(
            assignment => assignment.form_id === form.tempId
          );

          if (assignments.length > 0) {
            const assignmentsToInsert = assignments.map(assignment => ({
              form_id: formData.id,
              participant_id: assignment.participant_id || null,
              staff_id: assignment.staff_id || null,
              due_date: assignment.due_date || null,
              status: assignment.status,
              notes: assignment.notes || null,
              assigned_by: user?.id || null,
            }));

            const { error: assignmentError } = await supabase
              .from('house_form_assignments')
              .insert(assignmentsToInsert);

            if (assignmentError) {
              throw new Error(`Failed to add form assignments: ${assignmentError.message}`);
            }
          }
        }
      }

      if (pendingChanges?.forms.toUpdate.length) {
        for (const form of pendingChanges.forms.toUpdate) {
          const { error } = await supabase
            .from('house_forms')
            .update({
              name: form.name,
              type: form.type,
              description: form.description || null,
              frequency: form.frequency,
              is_global: form.is_global,
              status: form.status,
            })
            .eq('id', form.id);

          if (error) {
            throw new Error(`Failed to update form: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.forms.toDelete.length) {
        for (const formId of pendingChanges.forms.toDelete) {
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
      if (pendingChanges?.formAssignments.toAdd.length) {
        // Filter out assignments that were already processed with form creation
        const remainingAssignments = pendingChanges.formAssignments.toAdd.filter(
          assignment => !pendingChanges.forms.toAdd.some(form => form.tempId === assignment.form_id)
        );

        for (const assignment of remainingAssignments) {
          const { error } = await supabase
            .from('house_form_assignments')
            .insert({
              form_id: assignment.form_id,
              participant_id: assignment.participant_id || null,
              staff_id: assignment.staff_id || null,
              due_date: assignment.due_date || null,
              status: assignment.status,
              notes: assignment.notes || null,
              assigned_by: user?.id || null,
            });

          if (error) {
            throw new Error(`Failed to add form assignment: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.formAssignments.toUpdate.length) {
        for (const assignment of pendingChanges.formAssignments.toUpdate) {
          const { error } = await supabase
            .from('house_form_assignments')
            .update({
              participant_id: assignment.participant_id || null,
              staff_id: assignment.staff_id || null,
              due_date: assignment.due_date || null,
              status: assignment.status,
              notes: assignment.notes || null,
            })
            .eq('id', assignment.id);

          if (error) {
            throw new Error(`Failed to update form assignment: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.formAssignments.toDelete.length) {
        for (const assignmentId of pendingChanges.formAssignments.toDelete) {
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
      if (pendingChanges?.resources.toAdd.length) {
        for (const resource of pendingChanges.resources.toAdd) {
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
              created_by: user?.id || null,
            });

          if (error) {
            throw new Error(`Failed to add resource: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.resources.toUpdate.length) {
        for (const resource of pendingChanges.resources.toUpdate) {
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

      if (pendingChanges?.resources.toDelete.length) {
        for (const resourceId of pendingChanges.resources.toDelete) {
          const { error } = await supabase
            .from('house_resources')
            .delete()
            .eq('id', resourceId);

          if (error) {
            throw new Error(`Failed to delete resource: ${error.message}`);
          }
        }
      }

      // Step 10: Process pending participants
      if (pendingChanges?.participants.toAdd.length) {
        for (const participant of pendingChanges.participants.toAdd) {
          const { error } = await supabase
            .from('participants')
            .update({
              house_id: id,
              move_in_date: participant.move_in_date || null,
              status: participant.is_active ? 'active' : 'inactive',
            })
            .eq('id', participant.participant_id);

          if (error) {
            throw new Error(`Failed to assign participant to house: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.participants.toUpdate.length) {
        for (const participant of pendingChanges.participants.toUpdate) {
          const { error } = await supabase
            .from('participants')
            .update({
              house_id: id,
              move_in_date: participant.move_in_date || null,
              status: participant.is_active ? 'active' : 'inactive',
            })
            .eq('id', participant.participant_id);

          if (error) {
            throw new Error(`Failed to update participant assignment: ${error.message}`);
          }
        }
      }

      if (pendingChanges?.participants.toDelete.length) {
        for (const participantId of pendingChanges.participants.toDelete) {
          const { error } = await supabase
            .from('participants')
            .update({
              house_id: null,
              status: 'inactive',
            })
            .eq('id', participantId);

          if (error) {
            throw new Error(`Failed to remove participant from house: ${error.message}`);
          }
        }
      }

      // Log activity for house changes
      const changedFields = detectChanges(house, houseData);
      if (changedFields.length > 0) {
        await logActivity({
          activityType: 'update',
          entityType: 'house',
          entityId: id,
          entityName: houseData.name,
          userName: user?.email || 'Unknown user',
          changedFields,
        });
      }

      toast.success('House saved successfully');
      
      setHouse(houseData);
      const updatedHouseData = {
        name: houseData.name || '',
        address: houseData.address || '',
        phone: houseData.phone || '',
        capacity: houseData.capacity || 0,
        current_occupancy: houseData.current_occupancy || 0,
        house_manager: houseData.house_manager || '',
        status: houseData.status || 'active',
        notes: houseData.notes || '',
      };
      setFormData(updatedHouseData);
      if (onOriginalDataChange) onOriginalDataChange(updatedHouseData);
      if (onFormDataChange) onFormDataChange(updatedHouseData);
      
      // Trigger refresh of child components that had changes
      setRefreshKeys(prev => ({
        staff: (pendingChanges?.staff.toAdd.length || 0) > 0 || (pendingChanges?.staff.toUpdate.length || 0) > 0 || (pendingChanges?.staff.toDelete.length || 0) > 0 ? prev.staff + 1 : prev.staff,
        calendarEvents: (pendingChanges?.calendarEvents.toAdd.length || 0) > 0 || (pendingChanges?.calendarEvents.toUpdate.length || 0) > 0 || (pendingChanges?.calendarEvents.toDelete.length || 0) > 0 ? prev.calendarEvents + 1 : prev.calendarEvents,
        documents: (pendingChanges?.documents.toAdd.length || 0) > 0 || (pendingChanges?.documents.toDelete.length || 0) > 0 ? prev.documents + 1 : prev.documents,
        checklists: (pendingChanges?.checklists.toAdd.length || 0) > 0 || (pendingChanges?.checklists.toUpdate.length || 0) > 0 || (pendingChanges?.checklists.toDelete.length || 0) > 0 || (pendingChanges?.checklists.checklistItems.toAdd.length || 0) > 0 || (pendingChanges?.checklists.checklistItems.toUpdate.length || 0) > 0 || (pendingChanges?.checklists.checklistItems.toDelete.length || 0) > 0 ? prev.checklists + 1 : prev.checklists,
        forms: (pendingChanges?.forms.toAdd.length || 0) > 0 || (pendingChanges?.forms.toUpdate.length || 0) > 0 || (pendingChanges?.forms.toDelete.length || 0) > 0 || (pendingChanges?.formAssignments.toAdd.length || 0) > 0 || (pendingChanges?.formAssignments.toUpdate.length || 0) > 0 || (pendingChanges?.formAssignments.toDelete.length || 0) > 0 ? prev.forms + 1 : prev.forms,
        resources: (pendingChanges?.resources.toAdd.length || 0) > 0 || (pendingChanges?.resources.toUpdate.length || 0) > 0 || (pendingChanges?.resources.toDelete.length || 0) > 0 ? prev.resources + 1 : prev.resources,
        participants: (pendingChanges?.participants.toAdd.length || 0) > 0 || (pendingChanges?.participants.toUpdate.length || 0) > 0 || (pendingChanges?.participants.toDelete.length || 0) > 0 ? prev.participants + 1 : prev.participants,
      }));

      // Clear pending changes after successful save
      if (onPendingChangesChange) {
        onPendingChangesChange(emptyHousePendingChanges);
      }
    } catch (error: any) {
      handleSupabaseError(error, 'Error saving house details');
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  };

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [handleSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Loading house details...</div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">House not found</div>
      </div>
    );
  }

  const stickyClass = stickySidebarClasses[settings.layout] || 'top-[3rem]';

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
            <Scrollspy key={id} offset={100} targetRef={parentRef}>
              <HouseDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}
      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5" id="scrollable_content">
        <Card id="house_details">
            <CardHeader>
              <CardTitle>House Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="name" className="form-label required">House Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter house name"
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="status" className="form-label required">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="address" className="form-label">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="Enter full address"
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="phone" className="form-label">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="capacity" className="form-label">Maximum Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value) || 0)}
                  placeholder="Enter maximum capacity"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="house_manager" className="form-label">House Manager</Label>
                <Input
                  id="house_manager"
                  value={formData.house_manager}
                  onChange={(e) => handleFieldChange('house_manager', e.target.value)}
                  placeholder="Enter house manager name"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="notes" className="form-label">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Enter any additional notes about this house"
                  rows={4}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <HouseStaff
            key={`staff-${refreshKeys.staff}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseCalendarEvents
            key={`calendar-${refreshKeys.calendarEvents}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseDocuments
            key={`documents-${refreshKeys.documents}`}
            houseId={id}
            houseName={formData?.name}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseChecklists
            key={`checklists-${refreshKeys.checklists}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseForms
            key={`forms-${refreshKeys.forms}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseResources
            key={`resources-${refreshKeys.resources}`}
            houseId={id}
            houseName={formData?.name}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <HouseParticipants
            key={`participants-${refreshKeys.participants}`}
            houseId={id}
            canAdd={canAdd}
            canDelete={canDelete}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />
      </div>
    </div>
  );
}
