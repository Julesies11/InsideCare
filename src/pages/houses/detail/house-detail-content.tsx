import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
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
import { HouseChecklistHistory } from './components/house-checklist-history';
import { HouseManagement } from './components/house-management';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { useAuth } from '@/auth/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { handleSupabaseError } from '@/errors/error-handler';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { syncUserPermissionsByStaffId } from '@/lib/rbac-sync';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

interface HouseDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onHouseChange?: (house: any) => void;
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  canEdit: boolean; // Base canEdit from parent
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function HouseDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onHouseChange,
  pendingChanges,
  onPendingChangesChange,
  canEdit: _canEditBase,
  onSavingChange,
  saveHandlerRef,
}: HouseDetailContentProps) {
  const { id } = useParams();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<any>(null);
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Permissions
  const canViewBasics = hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditBasics = hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewManagement = hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditManagement = hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewOperations = hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditOperations = hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewChecklistSetup = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditChecklistSetup = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewChecklistHistory = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLIST_HISTORY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });

  const canViewResources = hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditResources = hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewStaff = hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditStaff = hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewActivityLog = hasAccess({ resource: RBAC_MODULES.HOUSE_ACTIVITY_LOG, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });

  const [formData, setFormData] = useState<any>({
    house_name: '',
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
    risk_management: '',
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
          .from(TABLES.HOUSES)
          .select('id, house_name, branch_id, address, phone, house_type_id, capacity, current_occupancy, house_manager, status, notes, individuals_breakdown, participant_dynamics, observations, general_house_details, risk_management, is_configured, setup_step, created_at, updated_at')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("You do not have permission to perform this action");
        
        setHouse(data);
        setOriginalData(data);
        setFormData(data);
      } catch (err) {
        console.error('Error fetching house:', err);
        toast.error('Failed to load house details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHouse();
  }, [id]);

  // Sync state to parent on mount or when data is fully loaded/updated
  useEffect(() => {
    if (!loading && house) {
      onHouseChange?.(house);
      onOriginalDataChange?.(originalData);
    }
  }, [loading, house, originalData, onHouseChange, onOriginalDataChange]);

  useEffect(() => {
    if (!loading && formData) {
      latestFormData.current = formData;
      onFormDataChange?.(formData);
    }
  }, [loading, formData, onFormDataChange]);


  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;
    const currentOriginalData = latestOriginalData.current;
    const userName = user?.fullname || user?.email || 'Unknown User';

    try {
      if (onSavingChange) onSavingChange(true);

      // Step 1: Save basic house details (Only if canEditBasics or canEditManagement)
      // Since these are on the same table, we check if they have at least one.
      // In a more complex scenario, we might want to only send the fields they can edit.
      if (canEditBasics || canEditManagement) {
        const updates: any = {};
        if (canEditBasics) {
          updates.house_name = currentFormData.house_name;
          updates.address = currentFormData.address || null;
          updates.phone = currentFormData.phone || null;
          updates.house_type_id = currentFormData.house_type_id || null;
          updates.capacity = currentFormData.capacity || 0;
          updates.current_occupancy = currentFormData.current_occupancy || 0;
          updates.house_manager = currentFormData.house_manager || null;
          updates.status = currentFormData.status;
          updates.notes = currentFormData.notes || null;
        }
        if (canEditManagement) {
          updates.individuals_breakdown = currentFormData.individuals_breakdown || null;
          updates.participant_dynamics = currentFormData.participant_dynamics || null;
          updates.observations = currentFormData.observations || null;
          updates.general_house_details = currentFormData.general_house_details || null;
          updates.risk_management = currentFormData.risk_management || null;
        }

        const { data: houseData, error: houseError } = await supabase
          .from(TABLES.HOUSES)
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (houseError) {
          handleSupabaseError(houseError, 'Failed to save house details');
          return;
        }
        if (!houseData) throw new Error("You do not have permission to perform this action");
        setHouse(houseData as any);
      }

      // Step 2: Process pending participants (Part of Management)
      if (canEditManagement) {
        if (currentPending.participants.toAdd.length > 0) {
          const ids = currentPending.participants.toAdd.map(p => p.participant_id);
          const { error } = await supabase
            .from(TABLES.PARTICIPANTS)
            .update({ house_id: id, status: 'active' })
            .in('id', ids);
          if (error) throw new Error(`Failed to link participants: ${error.message}`);
        }

        if (currentPending.participants.toUpdate.length > 0) {
          for (const p of currentPending.participants.toUpdate) {
            const updates: any = {};
            if (p.move_in_date !== undefined) updates.move_in_date = p.move_in_date;
            if (p.is_active !== undefined) updates.status = p.is_active ? 'active' : 'inactive';

            const { error } = await supabase
              .from(TABLES.PARTICIPANTS)
              .update(updates)
              .eq('id', p.id);
            if (error) throw new Error(`Failed to update participant: ${error.message}`);
          }
        }

        if (currentPending.participants.toDelete.length > 0) {
          const { error } = await supabase
            .from(TABLES.PARTICIPANTS)
            .update({ house_id: null })
            .in('id', currentPending.participants.toDelete);
          if (error) throw new Error(`Failed to unlink participants: ${error.message}`);
        }
      }

      // Step 3: Process pending staff assignments
      if (canEditStaff) {
        if (currentPending.staff.toAdd.length > 0) {
          const toInsert = currentPending.staff.toAdd.map(s => ({
            house_id: id,
            staff_id: s.staff_id,
            is_primary: s.is_primary,
            start_date: s.start_date || null,
            end_date: s.end_date || null,
            notes: s.notes || null,
          }));
          const { error: dbError } = await supabase.from(TABLES.HOUSE_STAFF_ASSIGNMENTS).insert(toInsert);
          if (dbError) throw new Error(`Failed to add staff assignments: ${dbError.message}`);
        }

        if (currentPending.staff.toUpdate.length > 0) {
          for (const s of currentPending.staff.toUpdate) {
            const { error } = await supabase
              .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
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
            .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
            .delete()
            .in('id', currentPending.staff.toDelete);
          if (error) throw new Error(`Failed to delete staff assignments: ${error.message}`);
        }
      }

      // Step 4: Process pending calendar events (Part of Operations)
      if (canEditOperations) {
        if (currentPending.calendarEvents.toAdd.length > 0) {
          for (const event of currentPending.calendarEvents.toAdd) {
            const { data: newEvent, error: eventError } = await supabase
              .from(TABLES.HOUSE_CALENDAR_EVENTS)
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
                is_checklist_event: !!event.is_checklist_event,
                house_checklist_id: event.house_checklist_id || null,
                checklist_schedule_id: event.checklist_schedule_id || null,
              })
              .select('id')
              .maybeSingle();

            if (eventError) throw new Error(`Failed to add calendar event: ${eventError.message}`);
            if (!newEvent) throw new Error("You do not have permission to perform this action");

            // Insert into junction tables
            if (event.participant_ids?.length > 0) {
              const { error: pError } = await supabase
                .from(TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS)
                .insert(event.participant_ids.map((pId: string) => ({ event_id: newEvent.id, participant_id: pId })));
              if (pError) throw new Error(`Failed to link participants: ${pError.message}`);
            }

            if (event.assigned_staff_ids?.length > 0) {
              const { error: sError } = await supabase
                .from(TABLES.HOUSE_CALENDAR_EVENT_STAFF)
                .insert(event.assigned_staff_ids.map((sId: string) => ({ event_id: newEvent.id, staff_id: sId })));
              if (sError) throw new Error(`Failed to link staff: ${sError.message}`);
            }
          }
        }

        if (currentPending.calendarEvents.toUpdate.length > 0) {
          for (const event of currentPending.calendarEvents.toUpdate) {
            const { error: eventError } = await supabase
              .from(TABLES.HOUSE_CALENDAR_EVENTS)
              .update({
                title: event.title,
                event_type_id: event.event_type_id || null,
                description: event.description || null,
                event_date: event.event_date,
                start_time: event.start_time || null,
                end_time: event.end_time || null,
                status: event.status || 'scheduled',
                location: event.location || null,
                is_checklist_event: !!event.is_checklist_event,
                house_checklist_id: event.house_checklist_id || null,
                checklist_schedule_id: event.checklist_schedule_id || null,
              })
              .eq('id', event.id);

            if (eventError) throw new Error(`Failed to update calendar event: ${eventError.message}`);

            // Sync junction tables: delete all and re-insert
            await supabase.from(TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS).delete().eq('event_id', event.id);
            if (event.participant_ids?.length > 0) {
              const { error: pError } = await supabase
                .from(TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS)
                .insert(event.participant_ids.map((pId: string) => ({ event_id: event.id, participant_id: pId })));
              if (pError) throw new Error(`Failed to link participants: ${pError.message}`);
            }

            await supabase.from(TABLES.HOUSE_CALENDAR_EVENT_STAFF).delete().eq('event_id', event.id);
            if (event.assigned_staff_ids?.length > 0) {
              const { error: sError } = await supabase
                .from(TABLES.HOUSE_CALENDAR_EVENT_STAFF)
                .insert(event.assigned_staff_ids.map((sId: string) => ({ event_id: event.id, staff_id: sId })));
              if (sError) throw new Error(`Failed to link staff: ${sError.message}`);
            }
          }
        }

        if (currentPending.calendarEvents.toDelete.length > 0) {
          const { error } = await supabase
            .from(TABLES.HOUSE_CALENDAR_EVENTS)
            .delete()
            .in('id', currentPending.calendarEvents.toDelete);
          if (error) throw new Error(`Failed to delete calendar events: ${error.message}`);
        }
      }

      // Step 5: Process pending documents (Part of Resources)
      if (canEditResources) {
        if (currentPending.documents.toAdd.length) {
          for (const doc of currentPending.documents.toAdd) {
            const fileExt = doc.file.name.split('.').pop();
            const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
              .upload(filePath, doc.file);


            if (uploadError) throw new Error(`Failed to upload document: ${uploadError.message}`);

            const { error } = await supabase
              .from(TABLES.HOUSE_FILES)
              .insert({
                house_id: id,
                file_name: doc.fileName,
                file_path: filePath,
                file_size: doc.file.size,
                file_type: doc.file.type,
              });

            if (error) throw new Error(`Failed to save document record: ${error.message}`);
          }
        }

        if (currentPending.documents.toDelete.length > 0) {
          const filePaths = currentPending.documents.toDelete.map(doc => doc.filePath);
          const recordIds = currentPending.documents.toDelete.map(doc => doc.id);

          const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)          .remove(filePaths);

          if (storageError) console.warn('Failed to delete files from storage:', storageError);

          const { error } = await supabase
            .from(TABLES.HOUSE_FILES)
            .delete()
            .in('id', recordIds);
          if (error) throw new Error(`Failed to delete document records: ${error.message}`);
        }
      }

      // Step 6: Process pending checklists
      if (canEditChecklistSetup) {
        if (currentPending.checklists.toAdd.length > 0) {
          for (const checklist of currentPending.checklists.toAdd) {
            const { data: checklistData, error: checklistError } = await supabase
              .from(TABLES.HOUSE_CHECKLISTS)
              .insert({
                house_id: id,
                house_checklist_name: checklist.house_checklist_name,
                days_of_week: checklist.days_of_week || null,
                description: checklist.description || null,
                master_id: checklist.master_id || null,
                sort_order: checklist.sort_order || 0,
              })
              .select()
              .maybeSingle();

            if (checklistError) throw new Error(`Failed to add checklist: ${checklistError.message}`);
            if (!checklistData) throw new Error("You do not have permission to perform this action");

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

              const { error: itemsError } = await supabase.from(TABLES.HOUSE_CHECKLIST_ITEMS).insert(itemsToInsert);
              if (itemsError) throw new Error(`Failed to add checklist items: ${itemsError.message}`);
            }
          }
        }

        if (currentPending.checklists.toUpdate.length > 0) {
          for (const checklist of currentPending.checklists.toUpdate) {
            if (!checklist.id) continue;
            const { error } = await supabase
              .from(TABLES.HOUSE_CHECKLISTS)
              .update({
                house_checklist_name: checklist.house_checklist_name,
                days_of_week: checklist.days_of_week || null,
                description: checklist.description || null,
                sort_order: checklist.sort_order,
              })
              .eq('id', checklist.id);
            if (error) throw new Error(`Failed to update checklist: ${error.message}`);
          }
        }

        if (currentPending.checklists.toDelete.length > 0) {
          const { error } = await supabase
            .from(TABLES.HOUSE_CHECKLISTS)
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
          const { error } = await supabase.from(TABLES.HOUSE_CHECKLIST_ITEMS).insert(itemsToInsert);
          if (error) throw new Error(`Failed to add checklist items: ${error.message}`);
        }

        if (currentPending.checklists.checklistItems.toUpdate.length > 0) {
          for (const item of currentPending.checklists.checklistItems.toUpdate) {
            const { error } = await supabase
              .from(TABLES.HOUSE_CHECKLIST_ITEMS)
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
            .from(TABLES.HOUSE_CHECKLIST_ITEMS)
            .delete()
            .in('id', currentPending.checklists.checklistItems.toDelete);
          if (error) throw new Error(`Failed to delete checklist items: ${error.message}`);
        }
      }

      // Step 8: Process pending forms
      if (canEditManagement) {
        if (currentPending.forms.toAdd.length > 0) {
          const toInsert = currentPending.forms.toAdd.map(form => ({
            house_id: id,
            form_name: form.name,
            type: form.type,
            description: form.description || null,
            frequency: form.frequency,
            status: form.status || 'active',
          }));
          const { error } = await supabase.from(TABLES.HOUSE_FORMS).insert(toInsert);
          if (error) throw new Error(`Failed to add forms: ${error.message}`);
        }

        if (currentPending.forms.toUpdate.length > 0) {
          for (const form of currentPending.forms.toUpdate) {
            const { error } = await supabase
              .from(TABLES.HOUSE_FORMS)
              .update({
                form_name: form.name,
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
            .from(TABLES.HOUSE_FORMS)
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
          }));
          const { error } = await supabase.from(TABLES.HOUSE_FORM_ASSIGNMENTS).insert(toInsert);
          if (error) throw new Error(`Failed to add form assignments: ${error.message}`);
        }

        if (currentPending.formAssignments.toUpdate.length > 0) {
          for (const assignment of currentPending.formAssignments.toUpdate) {
            const { error } = await supabase
              .from(TABLES.HOUSE_FORM_ASSIGNMENTS)
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
            .from(TABLES.HOUSE_FORM_ASSIGNMENTS)
            .delete()
            .in('id', currentPending.formAssignments.toDelete);
          if (error) throw new Error(`Failed to delete form assignments: ${error.message}`);
        }
      }

      // Step 10: Process pending resources
      if (canEditResources) {
        if (currentPending.resources.toAdd.length > 0) {
          for (const resource of currentPending.resources.toAdd) {
            let fileUrl = resource.file_url || null;
            let fileName = resource.file_name || null;
            let fileSize = resource.file_size || null;

            if (resource.file) {
              const fileExt = resource.file.name.split('.').pop();
              const uniqueFileName = `res-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `${id}/${uniqueFileName}`;

              const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
                .upload(filePath, resource.file);

              if (uploadError) throw new Error(`Failed to upload resource file: ${uploadError.message}`);
              fileUrl = filePath;
              fileName = resource.file.name;
              fileSize = resource.file.size;
            }

            const { error } = await supabase.from(TABLES.HOUSE_RESOURCES).insert({
              house_id: id,
              title: resource.title,
              category: resource.category,
              type: resource.type,
              description: resource.description || null,
              priority: resource.priority,
              phone: resource.phone || null,
              address: resource.address || null,
              file_url: fileUrl,
              file_name: fileName,
              file_size: fileSize,
              notes: resource.notes || null,
            });

            if (error) throw new Error(`Failed to add resource: ${error.message}`);
          }
        }

        if (currentPending.resources.toUpdate.length > 0) {
          for (const resource of currentPending.resources.toUpdate) {
            let fileUrl = resource.file_url;
            let fileName = resource.file_name;
            let fileSize = resource.file_size;
            let oldFileToDelete: string | null = null;

            if (resource.toDeleteFile) {
              // Mark old file for deletion after DB update
              oldFileToDelete = resource.file_url || null;
              fileUrl = null;
              fileName = null;
              fileSize = null;
            } else if (resource.file) {
              // Safe Swap: Upload new file first
              const fileExt = resource.file.name.split('.').pop();
              const uniqueFileName = `res-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `${id}/${uniqueFileName}`;

              const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
                .upload(filePath, resource.file);

              if (uploadError) throw new Error(`Failed to upload new resource file: ${uploadError.message}`);
              
              // Mark old file for deletion after successful DB update
              oldFileToDelete = resource.file_url || null;
              fileUrl = filePath;
              fileName = resource.file.name;
              fileSize = resource.file.size;
            }

            const { error } = await supabase
              .from(TABLES.HOUSE_RESOURCES)
              .update({
                title: resource.title,
                category: resource.category,
                type: resource.type,
                description: resource.description || null,
                priority: resource.priority,
                phone: resource.phone || null,
                address: resource.address || null,
                file_url: fileUrl === undefined ? undefined : fileUrl,
                file_name: fileName === undefined ? undefined : fileName,
                file_size: fileSize === undefined ? undefined : fileSize,
                notes: resource.notes || null,
              })
              .eq('id', resource.id);

            if (error) throw new Error(`Failed to update resource: ${error.message}`);

            // Clean up old file ONLY after DB update is successful
            if (oldFileToDelete) {
              await supabase.storage
                .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
                .remove([oldFileToDelete]);
            }
          }
        }

        if (currentPending.resources.toDelete.length > 0) {
          const filePaths = currentPending.resources.toDelete
            .filter(r => r.filePath)
            .map(r => r.filePath!);

          if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
              .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
              .remove(filePaths);
            if (storageError) console.warn('Failed to delete resource files from storage:', storageError);
          }

          const { error } = await supabase
            .from(TABLES.HOUSE_RESOURCES)
            .delete()
            .in('id', currentPending.resources.toDelete.map(r => r.id));
          if (error) throw new Error(`Failed to delete resources: ${error.message}`);
        }
      }

      // Step 11: Process pending comms (Part of Operations)
      if (canEditOperations) {
        if (currentPending.comms.toAdd.length > 0) {
          const toInsert = currentPending.comms.toAdd.map(entry => ({
            house_id: id,
            entry_date: entry.entry_date,
            content: entry.content,
          }));
          const { error } = await supabase.from(TABLES.HOUSE_COMMS).insert(toInsert);
          if (error) throw new Error(`Failed to add communication entries: ${error.message}`);
        }
      }

      // Step 12: Process pending Shift Templates (Models) - Part of Checklist Setup
      if (canEditChecklistSetup) {
        if (currentPending.shiftTemplates.toAdd.length || currentPending.shiftTemplates.toUpdate.length || currentPending.shiftTemplates.toDelete.length) {
          const currentTypes = queryClient.getQueryData<any[]>([QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, id]) || [];
          let updatedTypes = [...currentTypes];

          if (currentPending.shiftTemplates.toAdd.length > 0) {
            for (const st of currentPending.shiftTemplates.toAdd) {
              const { data: newType, error: typeError } = await supabase
                .from(TABLES.HOUSE_SHIFT_TEMPLATES)
                .insert({
                  house_id: id,
                  shift_template_name: st.shift_template_name,
                  short_name: st.short_name || null,
                  icon_name: st.icon_name || null,
                  color_theme: st.color_theme || null,
                  default_start_time: st.default_start_time || null,
                  default_end_time: st.default_end_time || null,
                  sort_order: st.sort_order || 0,
                  is_active: st.is_active ?? true,
                })
                .select()
                .maybeSingle();

              if (typeError) throw new Error(`Failed to add shift template: ${typeError.message}`);
              if (!newType) throw new Error("You do not have permission to perform this action");
              updatedTypes.push(newType);

              if (st.default_checklists && st.default_checklists.length > 0) {
                const toInsert = st.default_checklists.map(clId => ({
                  shift_template_id: newType.id,
                  checklist_id: clId
                }));
                await supabase.from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS).insert(toInsert);
              }
            }
          }

          if (currentPending.shiftTemplates.toUpdate.length > 0) {
            for (const st of currentPending.shiftTemplates.toUpdate) {
              const { data: updatedType, error: typeError } = await supabase
                .from(TABLES.HOUSE_SHIFT_TEMPLATES)
                .update({
                  shift_template_name: st.shift_template_name,
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
                await supabase.from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS).delete().eq('shift_template_id', st.id);
                if (st.default_checklists.length > 0) {
                  const toInsert = st.default_checklists.map(clId => ({
                    shift_template_id: st.id,
                    checklist_id: clId
                  }));
                  await supabase.from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS).insert(toInsert);
                }
              }
            }
          }

          if (currentPending.shiftTemplates.toDelete.length > 0) {
            const { error } = await supabase.from(TABLES.HOUSE_SHIFT_TEMPLATES).delete().in('id', currentPending.shiftTemplates.toDelete);
            if (error) throw new Error(`Failed to delete shift templates: ${error.message}`);
            updatedTypes = updatedTypes.filter(t => !currentPending.shiftTemplates.toDelete.includes(t.id));
          }

          queryClient.setQueryData(['house-shift-templates', id], updatedTypes.sort((a, b) => ((a?.sort_order || 0) - (b?.sort_order || 0))));
        }
      }

      // Final Step: Refresh local state
      setOriginalData(currentFormData);
      if (onOriginalDataChange) onOriginalDataChange(currentFormData);
      if (onFormDataChange) onFormDataChange(currentFormData);

      // Invalidate queries to ensure child components fetch fresh data
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_STAFF_ASSIGNMENTS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS, { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_DOCUMENTS, id] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHECKLISTS, id] });
      await queryClient.invalidateQueries({ queryKey: ['house-forms', id] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_RESOURCES, id] });
      await queryClient.invalidateQueries({ queryKey: ['house_comms', { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, id] });
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
        activityLog: prev.activityLog + 1,
      }));

      if (onPendingChangesChange) {
        onPendingChangesChange(emptyHousePendingChanges);
      }

      // Final Step: Sync RBAC for affected staff
      try {
        const staffIdsToSync = new Set<string>();
        currentPending.staff.toAdd.forEach(s => staffIdsToSync.add(s.staff_id));
        currentPending.staff.toUpdate.forEach(s => {
          if (s.staff_id) staffIdsToSync.add(s.staff_id);
        });

        if (currentPending.staff.toDelete.length > 0) {
          const { data: deletedAssignments } = await supabase
            .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
            .select('staff_id')
            .in('id', currentPending.staff.toDelete);
          deletedAssignments?.forEach(a => staffIdsToSync.add(a.staff_id));
        }

        // Sync each staff member (fire and forget to not block UI)
        Array.from(staffIdsToSync).forEach(sId => syncUserPermissionsByStaffId(sId));
      } catch (syncErr) {
        console.error('Non-critical: Failed to collect staff IDs for RBAC sync:', syncErr);
      }

    } catch (error) {
      const err = error as Error;
      console.error('Error saving house changes:', error);
      toast.error('Failed to save some changes', { description: err.message });
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [id, queryClient, user?.fullname, user?.email, user?.id, onOriginalDataChange, onFormDataChange, onSavingChange, onPendingChangesChange, canEditBasics, canEditManagement, canEditOperations, canEditChecklistSetup, canEditResources, canEditStaff]);

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
          {canViewBasics && (
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
                        value={formData.house_name}
                        onChange={(e) => handleFieldChange('house_name', e.target.value)}
                        placeholder="Enter house name"
                        disabled={!canEditBasics}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <Label className="flex w-full max-w-56">Address</Label>
                      <Textarea
                        value={formData.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="Enter house address"
                        disabled={!canEditBasics}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <Label className="flex w-full max-w-56">Phone Number</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        disabled={!canEditBasics}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canViewManagement && (
            <HouseManagement
              houseId={id}
              formData={formData}
              onFieldChange={handleFieldChange}
              canEdit={canEditManagement}
            />
          )}

          {canViewOperations && (
            <div id="daily_operations" className="flex flex-col gap-5 lg:gap-7.5">
              <HouseCalendarEvents 
                houseId={id!} 
                houseName={formData.house_name}
                events={formData.calendarEvents || []}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
                canEdit={canEditOperations}
              />

              <HouseComms 
                houseId={id!} 
                canEdit={canEditOperations}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
              />
            </div>
          )}

          {canViewChecklistSetup && (
            <div id="checklists">
              <HouseChecklistSetup 
                houseId={id!} 
                canAdd={canEditChecklistSetup}
                canDelete={canEditChecklistSetup}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['house-checklists', id] })}
              />
            </div>
          )}

          {canViewChecklistHistory && (
            <HouseChecklistHistory houseId={id!} />
          )}

          {canViewResources && (
            <HouseResources 
              houseId={id!} 
              canAdd={canEditResources}
              canDelete={canEditResources}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />
          )}

          {canViewStaff && (
            <HouseStaff 
              houseId={id!} 
              canAdd={canEditStaff}
              canDelete={canEditStaff}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />
          )}

          {canViewActivityLog && (
            <ActivityLog 
              entityId={id} 
              entityType="house" 
              refreshTrigger={refreshKeys.activityLog}
            />
          )}
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
