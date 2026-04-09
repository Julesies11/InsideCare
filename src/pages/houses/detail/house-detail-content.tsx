import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Scrollspy } from '@/components/ui/scrollspy';
import { useSettings } from '@/providers/settings-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { cn } from '@/lib/utils';
import { HouseDetailSidebar } from './house-detail-sidebar';
import { HouseStaff } from './components/house-staff';
import { HouseCalendarEvents } from './components/house-calendar-events';
import { HouseChecklistSetup } from './components/house-checklist-setup';
import { HouseResources } from './components/house-resources';
import { HouseComms } from './components/house-comms';
import { HouseShiftSetup } from './components/house-shift-setup';
import { HouseManagement } from './components/house-management';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { useAuth } from '@/auth/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { handleSupabaseError } from '@/errors/error-handler';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { logActivity, detectChanges } from '@/lib/activity-logger';

interface HouseDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onHouseChange?: (house: any) => void;
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  canEdit: boolean;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function HouseDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onHouseChange,
  pendingChanges,
  onPendingChangesChange,
  canEdit,
  onSavingChange,
  saveHandlerRef,
}: HouseDetailContentProps) {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<any>(null);
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  const [formData, setFormData] = useState<any>({
    name: '',
    address: '',
    phone: '',
    house_type_id: '',
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
  const [originalData, setOriginalData] = useState<any>(null);

  // Keep track of the latest props/state via refs to avoid closure staleness in handleSave
  const latestPendingChanges = useRef(pendingChanges);
  const latestFormData = useRef(formData);
  const latestOriginalData = useRef(originalData);

  useEffect(() => {
    latestPendingChanges.current = pendingChanges;
    latestFormData.current = formData;
    latestOriginalData.current = originalData;
  }, [pendingChanges, formData, originalData]);

  const [refreshKeys, setRefreshKeys] = useState({
    staff: 0,
    participants: 0,
    calendarEvents: 0,
    documents: 0,
    checklists: 0,
    forms: 0,
    resources: 0,
    comms: 0,
    shiftTemplates: 0,
    activityLog: 0,
  });

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('houses')
          .select('id, name, branch_id, address, phone, house_type_id, capacity, current_occupancy, house_manager, status, notes, individuals_breakdown, participant_dynamics, observations, general_house_details, is_configured, setup_step, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) throw error;
        setHouse(data);
        setOriginalData(data);
        setFormData(data);
        onHouseChange?.(data);
        onOriginalDataChange?.(data);
        onFormDataChange?.(data);
      } catch (err) {
        console.error('Error fetching house:', err);
        toast.error('Failed to load house details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHouse();
  }, [id, onHouseChange, onOriginalDataChange, onFormDataChange]);


  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onFormDataChange?.(newData);
  };

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    const currentOriginalData = latestOriginalData.current;
    const userName = user?.fullname || user?.email || 'Unknown User';

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

      // Log basic detail changes
      const detailChanges = detectChanges(currentOriginalData, currentFormData);
      if (Object.keys(detailChanges).length > 0) {
        await logActivity({
          activityType: 'update',
          entityType: 'house',
          entityId: id!,
          entityName: currentFormData.name,
          changes: detailChanges,
          userName,
        });
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
      if (currentPending.participants.toAdd.length > 0) {
        const ids = currentPending.participants.toAdd.map(p => p.participant_id);
        const { error } = await supabase
          .from('participants')
          .update({ house_id: id, status: 'active' })
          .in('id', ids);
        if (error) throw new Error(`Failed to link participants: ${error.message}`);

        for (const p of currentPending.participants.toAdd) {
          await logActivity({
            activityType: 'update',
            entityType: 'house',
            entityId: id!,
            entityName: currentFormData.name,
            userName,
            customDescription: `Linked participant "${p.name || p.participant_id}" to house`,
          });
        }
      }

      if (currentPending.participants.toUpdate.length > 0) {
        for (const p of currentPending.participants.toUpdate) {
          const updates: any = {};
          if (p.move_in_date !== undefined) updates.move_in_date = p.move_in_date;
          if (p.is_active !== undefined) updates.status = p.is_active ? 'active' : 'inactive';

          const { error } = await supabase
            .from('participants')
            .update(updates)
            .eq('id', p.id);
          if (error) throw new Error(`Failed to update participant: ${error.message}`);

          await logActivity({
            activityType: 'update',
            entityType: 'house',
            entityId: id!,
            entityName: currentFormData.name,
            userName,
            customDescription: `Updated participant "${p.name || p.id}" house settings`,
          });
        }
      }

      if (currentPending.participants.toDelete.length > 0) {
        // Fetch participant names before unlinking for the activity log
        const { data: participantsToDelete } = await supabase
          .from('participants')
          .select('id, name')
          .in('id', currentPending.participants.toDelete);

        const { error } = await supabase
          .from('participants')
          .update({ house_id: null })
          .in('id', currentPending.participants.toDelete);
        if (error) throw new Error(`Failed to unlink participants: ${error.message}`);

        for (const pid of currentPending.participants.toDelete) {
          const participantName = participantsToDelete?.find(p => p.id === pid)?.name || pid;
          await logActivity({
            activityType: 'update',
            entityType: 'house',
            entityId: id!,
            entityName: currentFormData.name,
            userName,
            customDescription: `Unlinked participant "${participantName}" from house`,
          });
        }
      }

      // Step 3: Process pending staff assignments
      if (currentPending.staff.toAdd.length > 0) {
        const toInsert = currentPending.staff.toAdd.map(s => ({
          house_id: id,
          staff_id: s.staff_id,
          is_primary: s.is_primary,
          start_date: s.start_date || null,
          end_date: s.end_date || null,
          notes: s.notes || null,
        }));
        const { error } = await supabase.from('house_staff_assignments').insert(toInsert);
        if (error) throw new Error(`Failed to add staff assignments: ${error.message}`);

        for (const _s of currentPending.staff.toAdd) {
          await logActivity({
            activityType: 'update',
            entityType: 'house',
            entityId: id!,
            entityName: currentFormData.name,
            userName,
            customDescription: `Assigned staff member "${_s.staff_name || _s.staff_id}" to house`,
          });
        }
      }

      if (currentPending.staff.toUpdate.length > 0) {
        for (const s of currentPending.staff.toUpdate) {
          const { error } = await supabase
            .from('house_staff_assignments')
            .update({
              staff_id: s.staff_id,
              is_primary: s.is_primary,
              start_date: s.start_date || null,
              end_date: s.end_date || null,
              notes: s.notes || null,
            })
            .eq('id', s.id);
          if (error) throw new Error(`Failed to update staff assignment: ${error.message}`);
        }
      }

      if (currentPending.staff.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_staff_assignments')
          .delete()
          .in('id', currentPending.staff.toDelete);
        if (error) throw new Error(`Failed to delete staff assignments: ${error.message}`);
      }

      // Step 4: Process pending calendar events
      if (currentPending.calendarEvents.toAdd.length > 0) {
        for (const event of currentPending.calendarEvents.toAdd) {
          const { data: newEvent, error: eventError } = await supabase
            .from('house_calendar_events')
            .insert({
              house_id: id,
              title: event.title,
              event_type_id: event.event_type_id || null,
              description: event.description || null,
              event_date: event.event_date,
              start_time: event.start_time || null,
              end_time: event.end_time || null,
              status: event.status || 'scheduled',
              location: event.location || null,
              created_by: currentStaffId,
            })
            .select('id')
            .single();

          if (eventError) throw new Error(`Failed to add calendar event: ${eventError.message}`);

          // Insert into junction tables
          if (event.participant_ids?.length > 0) {
            const { error: pError } = await supabase
              .from('house_calendar_event_participants')
              .insert(event.participant_ids.map((pId: string) => ({ event_id: newEvent.id, participant_id: pId })));
            if (pError) throw new Error(`Failed to link participants: ${pError.message}`);
          }

          if (event.assigned_staff_ids?.length > 0) {
            const { error: sError } = await supabase
              .from('house_calendar_event_staff')
              .insert(event.assigned_staff_ids.map((sId: string) => ({ event_id: newEvent.id, staff_id: sId })));
            if (sError) throw new Error(`Failed to link staff: ${sError.message}`);
          }
        }
      }

      if (currentPending.calendarEvents.toUpdate.length > 0) {
        for (const event of currentPending.calendarEvents.toUpdate) {
          const { error: eventError } = await supabase
            .from('house_calendar_events')
            .update({
              title: event.title,
              event_type_id: event.event_type_id || null,
              description: event.description || null,
              event_date: event.event_date,
              start_time: event.start_time || null,
              end_time: event.end_time || null,
              status: event.status || 'scheduled',
              location: event.location || null,
            })
            .eq('id', event.id);

          if (eventError) throw new Error(`Failed to update calendar event: ${eventError.message}`);

          // Sync junction tables: delete all and re-insert
          await supabase.from('house_calendar_event_participants').delete().eq('event_id', event.id);
          if (event.participant_ids?.length > 0) {
            const { error: pError } = await supabase
              .from('house_calendar_event_participants')
              .insert(event.participant_ids.map((pId: string) => ({ event_id: event.id, participant_id: pId })));
            if (pError) throw new Error(`Failed to link participants: ${pError.message}`);
          }

          await supabase.from('house_calendar_event_staff').delete().eq('event_id', event.id);
          if (event.assigned_staff_ids?.length > 0) {
            const { error: sError } = await supabase
              .from('house_calendar_event_staff')
              .insert(event.assigned_staff_ids.map((sId: string) => ({ event_id: event.id, staff_id: sId })));
            if (sError) throw new Error(`Failed to link staff: ${sError.message}`);
          }
        }
      }

      if (currentPending.calendarEvents.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_calendar_events')
          .delete()
          .in('id', currentPending.calendarEvents.toDelete);
        if (error) throw new Error(`Failed to delete calendar events: ${error.message}`);
      }

      // Step 5: Process pending documents
      if (currentPending.documents.toAdd.length) {
        for (const doc of currentPending.documents.toAdd) {
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `house-documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('house-documents')
            .upload(filePath, doc.file);

          if (uploadError) throw new Error(`Failed to upload document: ${uploadError.message}`);

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

          if (error) throw new Error(`Failed to save document record: ${error.message}`);
        }
      }

      if (currentPending.documents.toDelete.length > 0) {
        const filePaths = currentPending.documents.toDelete.map(doc => doc.filePath);
        const recordIds = currentPending.documents.toDelete.map(doc => doc.id);

        const { error: storageError } = await supabase.storage
          .from('house-documents')
          .remove(filePaths);

        if (storageError) console.warn('Failed to delete files from storage:', storageError);

        const { error } = await supabase
          .from('house_files')
          .delete()
          .in('id', recordIds);
        if (error) throw new Error(`Failed to delete document records: ${error.message}`);
      }

      // Step 6: Process pending checklists
      if (currentPending.checklists.toAdd.length > 0) {
        for (const checklist of currentPending.checklists.toAdd) {
          const { data: checklistData, error: checklistError } = await supabase
            .from('house_checklists')
            .insert({
              house_id: id,
              name: checklist.name,
              days_of_week: checklist.days_of_week || null,
              description: checklist.description || null,
              master_id: checklist.master_id || null,
            })
            .select()
            .single();

          if (checklistError) throw new Error(`Failed to add checklist: ${checklistError.message}`);

          if (checklist.items && checklist.items.length > 0) {
            const itemsToInsert = checklist.items.map((item: any) => ({
              checklist_id: checklistData.id,
              title: item.title,
              instructions: item.instructions || null,
              group_title: item.group_title || 'Morning',
              priority: item.priority || 'medium',
              is_required: !!item.is_required,
              sort_order: item.sort_order || 0,
              master_item_id: item.master_item_id || null,
            }));

            const { error: itemsError } = await supabase.from('house_checklist_items').insert(itemsToInsert);
            if (itemsError) throw new Error(`Failed to add checklist items: ${itemsError.message}`);
          }
        }
      }

      if (currentPending.checklists.toUpdate.length > 0) {
        for (const checklist of currentPending.checklists.toUpdate) {
          if (!checklist.id) continue;
          const { error } = await supabase
            .from('house_checklists')
            .update({
              name: checklist.name,
              days_of_week: checklist.days_of_week || null,
              description: checklist.description || null,
            })
            .eq('id', checklist.id);
          if (error) throw new Error(`Failed to update checklist: ${error.message}`);
        }
      }

      if (currentPending.checklists.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_checklists')
          .delete()
          .in('id', currentPending.checklists.toDelete.filter(Boolean));
        if (error) throw new Error(`Failed to delete checklists: ${error.message}`);
      }

      // Step 7: Process pending checklist items
      if (currentPending.checklists.checklistItems.toAdd.length > 0) {
        const itemsToInsert = currentPending.checklists.checklistItems.toAdd.map(item => ({
          checklist_id: item.checklist_id,
          title: item.title,
          instructions: item.instructions || null,
          group_title: item.group_title || 'Morning',
          priority: item.priority || 'medium',
          is_required: !!item.is_required,
          sort_order: item.sort_order || 0,
          master_item_id: item.master_item_id || null,
        }));
        const { error } = await supabase.from('house_checklist_items').insert(itemsToInsert);
        if (error) throw new Error(`Failed to add checklist items: ${error.message}`);
      }

      if (currentPending.checklists.checklistItems.toUpdate.length > 0) {
        for (const item of currentPending.checklists.checklistItems.toUpdate) {
          const { error } = await supabase
            .from('house_checklist_items')
            .update({
              title: item.title,
              instructions: item.instructions || null,
              group_title: item.group_title || 'Morning',
              priority: item.priority || 'medium',
              is_required: !!item.is_required,
              sort_order: item.sort_order || 0,
              master_item_id: item.master_item_id || null,
            })
            .eq('id', item.id);
          if (error) throw new Error(`Failed to update checklist item: ${error.message}`);
        }
      }

      if (currentPending.checklists.checklistItems.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_checklist_items')
          .delete()
          .in('id', currentPending.checklists.checklistItems.toDelete);
        if (error) throw new Error(`Failed to delete checklist items: ${error.message}`);
      }

      // Step 8: Process pending forms
      if (currentPending.forms.toAdd.length > 0) {
        const toInsert = currentPending.forms.toAdd.map(form => ({
          house_id: id,
          name: form.name,
          type: form.type,
          description: form.description || null,
          frequency: form.frequency,
          status: form.status || 'active',
          created_by: currentStaffId,
        }));
        const { error } = await supabase.from('house_forms').insert(toInsert);
        if (error) throw new Error(`Failed to add forms: ${error.message}`);
      }

      if (currentPending.forms.toUpdate.length > 0) {
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
          if (error) throw new Error(`Failed to update form: ${error.message}`);
        }
      }

      if (currentPending.forms.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_forms')
          .delete()
          .in('id', currentPending.forms.toDelete);
        if (error) throw new Error(`Failed to delete forms: ${error.message}`);
      }

      // Step 9: Process pending form assignments
      if (currentPending.formAssignments.toAdd.length > 0) {
        const toInsert = currentPending.formAssignments.toAdd.map(assignment => ({
          form_id: assignment.form_id,
          participant_id: assignment.participant_id || null,
          staff_id: assignment.staff_id || null,
          due_date: assignment.due_date || null,
          status: assignment.status || 'pending',
          notes: assignment.notes || null,
          assigned_by: currentStaffId,
        }));
        const { error } = await supabase.from('house_form_assignments').insert(toInsert);
        if (error) throw new Error(`Failed to add form assignments: ${error.message}`);
      }

      if (currentPending.formAssignments.toUpdate.length > 0) {
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
          if (error) throw new Error(`Failed to update form assignment: ${error.message}`);
        }
      }

      if (currentPending.formAssignments.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_form_assignments')
          .delete()
          .in('id', currentPending.formAssignments.toDelete);
        if (error) throw new Error(`Failed to delete form assignments: ${error.message}`);
      }

      // Step 10: Process pending resources
      if (currentPending.resources.toAdd.length > 0) {
        const toInsert = currentPending.resources.toAdd.map(resource => ({
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
        }));
        const { error } = await supabase.from('house_resources').insert(toInsert);
        if (error) throw new Error(`Failed to add resources: ${error.message}`);
      }

      if (currentPending.resources.toUpdate.length > 0) {
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
          if (error) throw new Error(`Failed to update resource: ${error.message}`);
        }
      }

      if (currentPending.resources.toDelete.length > 0) {
        const { error } = await supabase
          .from('house_resources')
          .delete()
          .in('id', currentPending.resources.toDelete);
        if (error) throw new Error(`Failed to delete resources: ${error.message}`);
      }

      // Step 11: Process pending comms
      if (currentPending.comms.toAdd.length > 0) {
        const toInsert = currentPending.comms.toAdd.map(entry => ({
          house_id: id,
          entry_date: entry.entry_date,
          content: entry.content,
          created_by: currentStaffId || entry.created_by,
        }));
        const { error } = await supabase.from('house_comms').insert(toInsert);
        if (error) throw new Error(`Failed to add communication entries: ${error.message}`);
      }

      // Step 12: Process pending Shift Templates (Models)
      if (currentPending.shiftTemplates.toAdd.length || currentPending.shiftTemplates.toUpdate.length || currentPending.shiftTemplates.toDelete.length) {
        const currentTypes = queryClient.getQueryData<any[]>(['house-shift-templates', id]) || [];
        let updatedTypes = [...currentTypes];

        if (currentPending.shiftTemplates.toAdd.length > 0) {
          for (const st of currentPending.shiftTemplates.toAdd) {
            const { data: newType, error: typeError } = await supabase
              .from('house_shift_templates')
              .insert({
                house_id: id,
                name: st.name,
                short_name: st.short_name || null,
                icon_name: st.icon_name || null,
                color_theme: st.color_theme || null,
                default_start_time: st.default_start_time || null,
                default_end_time: st.default_end_time || null,
                sort_order: st.sort_order || 0,
                is_active: st.is_active ?? true,
              })
              .select()
              .single();

            if (typeError) throw new Error(`Failed to add shift template: ${typeError.message}`);
            updatedTypes.push(newType);

            if (st.default_checklists && st.default_checklists.length > 0) {
              const toInsert = st.default_checklists.map(clId => ({
                shift_template_id: newType.id,
                checklist_id: clId
              }));
              await supabase.from('shift_template_default_checklists').insert(toInsert);
            }
          }
        }

        if (currentPending.shiftTemplates.toUpdate.length > 0) {
          for (const st of currentPending.shiftTemplates.toUpdate) {
            const { data: updatedType, error: typeError } = await supabase
              .from('house_shift_templates')
              .update({
                name: st.name,
                short_name: st.short_name,
                icon_name: st.icon_name,
                color_theme: st.color_theme,
                default_start_time: st.default_start_time,
                default_end_time: st.default_end_time,
                sort_order: st.sort_order,
                is_active: st.is_active,
              })
              .eq('id', st.id)
              .select()
              .maybeSingle();

            if (typeError) throw new Error(`Failed to update shift template: ${typeError.message}`);
            if (updatedType) updatedTypes = updatedTypes.map(t => t.id === st.id ? updatedType : t);

            if (st.default_checklists !== undefined) {
              await supabase.from('shift_template_default_checklists').delete().eq('shift_template_id', st.id);
              if (st.default_checklists.length > 0) {
                const toInsert = st.default_checklists.map(clId => ({
                  shift_template_id: st.id,
                  checklist_id: clId
                }));
                await supabase.from('shift_template_default_checklists').insert(toInsert);
              }
            }
          }
        }

        if (currentPending.shiftTemplates.toDelete.length > 0) {
          const { error } = await supabase.from('house_shift_templates').delete().in('id', currentPending.shiftTemplates.toDelete);
          if (error) throw new Error(`Failed to delete shift templates: ${error.message}`);
          updatedTypes = updatedTypes.filter(t => !currentPending.shiftTemplates.toDelete.includes(t.id));
        }

        queryClient.setQueryData(['house-shift-templates', id], updatedTypes.sort((a, b) => ((a?.sort_order || 0) - (b?.sort_order || 0))));
      }

      // Final Step: Refresh local state
      setHouse(houseData as any);
      setOriginalData(currentFormData);
      if (onOriginalDataChange) onOriginalDataChange(currentFormData);
      if (onFormDataChange) onFormDataChange(currentFormData);

      // Invalidate queries to ensure child components fetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['houses'] });
      await queryClient.invalidateQueries({ queryKey: ['house-staff-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['participants'] });
      await queryClient.invalidateQueries({ queryKey: ['house-calendar-events', { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: ['house-documents', id] });
      await queryClient.invalidateQueries({ queryKey: ['house-checklists', id] });
      await queryClient.invalidateQueries({ queryKey: ['house-forms', id] });
      await queryClient.invalidateQueries({ queryKey: ['house-resources', id] });
      await queryClient.invalidateQueries({ queryKey: ['house_comms', { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: ['house-shift-templates', id] });
      await queryClient.invalidateQueries({ queryKey: ['shift-template-defaults', id] });

      toast.success('All changes saved successfully');

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
        shiftTemplates: (currentPending.shiftTemplates.toAdd.length || 0) > 0 || (currentPending.shiftTemplates.toUpdate.length || 0) > 0 || (currentPending.shiftTemplates.toDelete.length || 0) > 0 ? prev.shiftTemplates + 1 : prev.shiftTemplates,
        activityLog: prev.activityLog + 1,
      }));

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
  }, [id, queryClient, user?.fullname, user?.email, user?.id, onOriginalDataChange, onFormDataChange, onSavingChange, onPendingChangesChange]);

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [saveHandlerRef, handleSave]);

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

      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
          <Card id="house_details">
            <CardHeader className="flex flex-row items-center justify-between">
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
              </div>
            </CardContent>
          </Card>

          <HouseManagement
            houseId={id}
            formData={formData}
            onFieldChange={handleFieldChange}
            canEdit={canEdit}
          />

          <HouseCalendarEvents 
            houseId={id!} 
            houseName={formData.name}
            events={formData.calendarEvents || []}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
            canEdit={canEdit}
            refreshKey={refreshKeys.calendarEvents}
          />

          <div id="shift_templates">
            <HouseShiftSetup
              houseId={id!}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
              canEdit={canEdit}
              refreshKey={refreshKeys.shiftTemplates}
              />          </div>

          <div id="checklist_comms_section" className="flex flex-col gap-5 lg:gap-7.5">
            <HouseComms 
              houseId={id!} 
              comms={formData.comms || []}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
              canEdit={canEdit}
              refreshKey={refreshKeys.comms}
            />

            <HouseChecklistSetup 
              houseId={id!} 
              canAdd={canEdit}
              canDelete={canEdit}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['house-checklists', id] })}
            />
          </div>

          <HouseResources 
            houseId={id!} 
            resources={formData.resources || []}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
            canEdit={canEdit}
            refreshKey={refreshKeys.resources}
          />

          <HouseStaff 
            houseId={id!} 
            canAdd={true}
            canDelete={true}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
          />

          <ActivityLog 
            entityId={id} 
            entityType="house" 
            refreshTrigger={refreshKeys.activityLog}
          />
      </div>

    </div>
  );
}

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
