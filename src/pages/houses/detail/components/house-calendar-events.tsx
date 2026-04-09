import { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Edit, Trash2, Plus, CalendarDays, ChevronLeft, ChevronRight, Loader2, CheckSquare, Zap, CalendarCheck } from 'lucide-react';
import { format, addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isBefore, startOfDay, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useHouseCalendarEvents } from '@/hooks/useHouseCalendarEvents';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/use-staff';
import { useHouseStaffAssignments } from '@/hooks/use-house-staff-assignments';
import { useAuth } from '@/auth/context/auth-context';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useChecklistSchedules } from '@/hooks/useChecklistSchedules';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { HouseCalendarEventTypeCombobox } from './house-calendar-event-type-components/HouseCalendarEventTypeCombobox';
import { HouseCalendarEventTypeMasterDialog } from './house-calendar-event-type-components/HouseCalendarEventTypeMasterDialog';
import { HouseCalendarEventAttachments, QueuedAttachment } from './HouseCalendarEventAttachments';
import { cn, getPeriodTheme } from '@/lib/utils';
import { HouseChecklistExecution } from './house-checklist-execution';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
// Shift Dialog imports
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { ShiftCard, ShiftCardData } from '@/components/roster/shift-card';
import { useRosterData } from '@/components/roster/use-roster-data';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { PopulateRosterModal } from './PopulateRosterModal';
import { ScheduleChecklistsModal } from './ScheduleChecklistsModal';
import { BulkDeleteCalendarModal } from './BulkDeleteCalendarModal';
import { useQueryClient } from '@tanstack/react-query';

export interface HouseCalendarEventsProps {
  houseId?: string;
  houseName?: string;
  staffId?: string;
  canEdit: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  onRefreshNeeded?: () => void;
  refreshKey?: number;
}

type ViewMode = 'month' | 'week';

export const HouseCalendarEvents = forwardRef<any, HouseCalendarEventsProps>(({ 
  houseId, 
  houseName,
  staffId,
  canEdit,
  canDelete,
  pendingChanges,
  onPendingChangesChange,
  onRefreshNeeded,
  refreshKey
}, ref) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventTypeDialog, setShowEventTypeDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [showScheduleChecklistsModal, setShowScheduleChecklistsModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Filtering state
  const [filterTypes, setFilterTypes] = useState<string[]>(['shift', 'checklist', 'meeting', 'appointment', 'clinical', 'other']);
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
  const [eventToDeleteInstance, setEventToDeleteInstance] = useState<any>(null);
  const [executingChecklist, setExecutingChecklist] = useState<any>(null);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    event_type_id: '',
    description: '',
    event_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    participant_ids: [] as string[],
    assigned_staff_ids: [] as string[],
    status: 'scheduled',
    location: '',
    house_checklist_id: '',
    existingAttachments: [] as any[],
    queuedAttachments: [] as QueuedAttachment[],
    toDeleteAttachments: [] as string[],
  });

  const queryClient = useQueryClient();
  const { houseCalendarEvents, loading, refresh } = useHouseCalendarEvents(houseId, staffId);
  const { houseChecklists } = useHouseChecklists(houseId);
  const { deleteSchedule, deleteEvent, loading: deleting } = useChecklistSchedules(houseId);
  const { participants } = useParticipants();
  const { staff: systemStaff } = useStaff(0, 1000, [], { statuses: ['active'] }); // Fetch more staff for general events
  const { assignments: houseStaffAssignments } = useHouseStaffAssignments(houseId);
  const { user } = useAuth();
  
  // Shift Dialog hooks
  const { createShift, updateShift, deleteShift, staff: allRosterStaff } = useRosterData();
  const { shiftTemplates } = useHouseShiftTemplates(houseId);
  
  // Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey) refresh();
  }, [refreshKey, refresh]);

  const handleBulkDelete = async ({ startDate, endDate, deleteShifts, deleteEvents, deleteChecklists }: any) => {
    if (!houseId) return;
    
    try {
      const promises = [];
      
      if (deleteShifts) {
        promises.push(
          supabase.from('staff_shifts')
            .delete()
            .eq('house_id', houseId)
            .gte('start_date', startDate)
            .lte('start_date', endDate)
        );
      }
      
      if (deleteEvents) {
        promises.push(
          supabase.from('house_calendar_events')
            .delete()
            .eq('house_id', houseId)
            .gte('event_date', startDate)
            .lte('event_date', endDate)
        );
      }
      
      if (deleteChecklists) {
        promises.push(
          supabase.from('house_checklist_submissions')
            .delete()
            .eq('house_id', houseId)
            .gte('created_at', `${startDate}T00:00:00.000Z`)
            .lte('created_at', `${endDate}T23:59:59.999Z`)
        );
      }
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['house-calendar-events', { houseId }] });
      await queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['house-checklist-history', houseId] });
      refresh();
      
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  };

  // Shift Dialog state
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftPreSelectedDate, setShiftPreSelectedDate] = useState<Date>();
  const [savingShift, setSavingShift] = useState(false);

  const handleQuickAssign = useCallback(async (shiftId: string, staffId: string) => {
    try {
      await updateShift(shiftId, { staff_id: staffId });
      toast.success('Staff assigned successfully');
      refresh();
    } catch (error: any) {
      toast.error('Failed to assign staff: ' + error.message);
    }
  }, [updateShift, refresh]);

  const staffList = useMemo(() => {
    if (!allRosterStaff || !houseId) return [];
    
    const targetHouseId = houseId.toLowerCase();
    
    return allRosterStaff.filter(s => {
      const assignments = (s as any).house_assignments || [];
      return assignments.some((a: any) => {
        const assignmentHouseId = (a.house_id || a.house?.id || '').toLowerCase();
        return assignmentHouseId === targetHouseId;
      });
    }).map(s => ({ id: s.id, name: s.name }));
  }, [allRosterStaff, houseId]);

  // Helper to convert calendar event to ShiftCardData
  const mapEventToShiftCardData = (event: any): ShiftCardData => ({
    id: event.id.replace('shift-', ''),
    start_date: event.event_date,
    end_date: event.end_date,
    start_time: event.start_time,
    end_time: event.end_time,
    shift_template: event.shift_template,
    color_theme: event.type_details?.color_theme,
    icon_name: event.type_details?.icon_name,
    staff_name: event.event_staff?.[0]?.staff?.name,
    staff_id: event.event_staff?.[0]?.staff?.id,
    participants: event.event_participants?.map((p: any) => ({ id: p.participant.id, name: p.participant.name })) || event.participants,
    assigned_checklists: event.assigned_checklists?.map((ac: any) => ({
      id: ac.id,
      checklist_id: ac.checklist_id,
      assignment_title: ac.assignment_title,
      is_completed: ac.submissions?.some((s: any) => s.status === 'completed')
    })),
    notesCount: event.notes_count || 0
  });

  // Apply filtering
  const filteredEvents = useMemo(() => {
    return houseCalendarEvents.filter(event => {
      const type = (event.type || 'other').toLowerCase();
      if (event.is_checklist_event) return filterTypes.includes('checklist');
      return filterTypes.includes(type);
    });
  }, [houseCalendarEvents, filterTypes]);

  const toggleFilter = (type: string) => {
    setFilterTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Combine existing events with pending adds, filter out pending deletes
  const visibleEvents = useMemo(() => {
    const existingEvents = filteredEvents.filter(event => !pendingChanges?.calendarEvents.toDelete.includes(event.id));
    const pendingAdds = pendingChanges?.calendarEvents.toAdd || [];
    return [...existingEvents, ...pendingAdds];
  }, [filteredEvents, pendingChanges]);

  // Get events for the current view period
  const getEventsForPeriod = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'month') {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    } else if (viewMode === 'week') {
      startDate = startOfWeek(currentDate);
      endDate = endOfWeek(currentDate);
    } else {
      startDate = currentDate;
      endDate = currentDate;
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    return visibleEvents.filter(event => {
      const eventDate = event.event_date; // This is already yyyy-MM-dd
      return eventDate >= startStr && eventDate <= endStr;
    }).sort((a, b) => {
      const startA = a.start_time || '00:00';
      const startB = b.start_time || '00:00';
      if (startA !== startB) return startA.localeCompare(startB);
      
      const endA = a.end_time || '00:00';
      const endB = b.end_time || '00:00';
      return endA.localeCompare(endB);
    });
  }, [visibleEvents, currentDate, viewMode]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedEvent(null);
    const dateStr = format(date, 'yyyy-MM-dd');
    setFormData({
      title: '',
      event_type_id: '',
      description: '',
      event_date: dateStr,
      end_date: dateStr,
      start_time: '',
      end_time: '',
      participant_ids: [],
      assigned_staff_ids: [],
      status: 'scheduled',
      location: '',
      house_checklist_id: '',
      existingAttachments: [],
      queuedAttachments: [],
      toDeleteAttachments: [],
    });
    setShowEventDialog(true);
  };

  const handleEditEvent = async (event: any) => {
    // Handle shift events
    if (event.type === 'shift') {
      try {
        // Extract shift ID from synthetic ID format (shift-{id})
        const shiftId = event.id.replace('shift-', '');
        
        // Fetch full shift data with participants and checklists
        const { data: shift, error: shiftError } = await supabase
          .from('staff_shifts')
          .select(`
            *,
            participants:shift_participants(participant:participants(id, name)),
            assigned_checklists:shift_assigned_checklists(id, checklist_id, assignment_title)
          `)
          .eq('id', shiftId)
          .single();
        
        if (shiftError) throw shiftError;
        
        // Convert participants array to participant_ids
        const participant_ids = shift.participants?.map((p: any) => p.participant.id) || [];
        
        // Set shift data for editing
        setSelectedShift({
          ...shift,
          participant_ids,
          assigned_checklists: shift.assigned_checklists || []
        });
        setShowShiftDialog(true);
      } catch (err) {
        console.error('Error loading shift:', err);
        toast.error('Failed to load shift details.');
      }
      return;
    }
    
    if (event.is_checklist_event) {
      try {
        // 1. Fetch the House Checklist and its items
        const { data: checklist, error: clError } = await supabase
          .from('house_checklists')
          .select('*, items:house_checklist_items(*)')
          .eq('id', event.house_checklist_id)
          .single();

        if (clError) throw clError;

        // 2. Check if a submission already exists for this calendar event
        const existingSubmission = event.submissions?.[0];
        
        if (existingSubmission) {
          // Fetch existing submission items to resume, including staff names
          const { data: subItems } = await supabase
            .from('house_checklist_submission_items')
            .select(`
              *,
              completed_by_staff:staff!completed_by(id, name)
            `)
            .eq('submission_id', existingSubmission.id);

          const completedItems: Record<string, boolean> = {};
          const itemNotes: Record<string, string> = {};
          const completedBy: Record<string, { id: string; name: string }> = {};

          subItems?.forEach(si => {
            const isDone = si.status === 'Completed';
            completedItems[si.item_id] = isDone;
            itemNotes[si.item_id] = si.notes || '';
            if (isDone && si.completed_by_staff) {
              completedBy[si.item_id] = {
                id: si.completed_by_staff.id,
                name: si.completed_by_staff.name
              };
            }
          });

          setActiveSubmission({
            id: existingSubmission.id,
            completedItems,
            itemNotes,
            completedBy
          });
        } else {
          setActiveSubmission(null);
        }

        setExecutingChecklist(checklist);
        setSelectedEvent(event);
        setShowChecklistDialog(true);
      } catch (err) {
        console.error('Error loading checklist:', err);
        toast.error('Failed to load checklist details.');
      }
      return;
    }

    setSelectedEvent(event);
    setFormData({
      title: event.title,
      event_type_id: event.event_type_id || '',
      description: event.description || '',
      event_date: event.event_date,
      end_date: event.end_date || event.event_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      participant_ids: event.event_participants?.map((p: any) => p.participant.id) || [],
      assigned_staff_ids: event.event_staff?.map((s: any) => s.staff.id) || [],
      status: event.status || 'scheduled',
      location: event.location || '',
      house_checklist_id: event.house_checklist_id || '',
      existingAttachments: event.attachments || [],
      queuedAttachments: [],
      toDeleteAttachments: [],
    });
    setShowEventDialog(true);
  };

  const persistChecklistExecution = async (results: any, status: 'in_progress' | 'completed') => {
    if (!selectedEvent || !houseId) return;

    const staffId = (user as any)?.staff_id;
    let submissionId = activeSubmission?.id;

    if (!submissionId) {
      // Create new submission linked to calendar event OR shift
      const isShiftRoutine = selectedEvent.is_shift_routine;
      
      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .insert({
          checklist_id: executingChecklist.id,
          house_id: houseId,
          calendar_event_id: isShiftRoutine ? null : selectedEvent.id,
          shift_id: isShiftRoutine ? selectedEvent.shift_id : null,
          shift_template_id: isShiftRoutine ? selectedEvent.shift_template_id : null,
          scheduled_date: selectedEvent.event_date,
          status: status,
          submitted_by: staffId || null,
          started_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      submissionId = data.id;
    } else {
      // Update existing submission
      const { error } = await supabase
        .from('house_checklist_submissions')
        .update({
          status: status,
          submitted_by: staffId || null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
    }

    // Upsert items
    const submissionItems = results.items.map((item: any) => ({
      submission_id: submissionId,
      item_id: item.item_id,
      status: item.is_completed ? 'Completed' : 'Pending',
      notes: item.note,
      completed_by: item.completed_by,
      completed_at: item.is_completed ? new Date().toISOString() : null
    }));

    const { error: itemsError } = await supabase
      .from('house_checklist_submission_items')
      .upsert(submissionItems, { onConflict: 'submission_id,item_id' });

    if (itemsError) throw itemsError;

    // Handle attachments (simplified for now, following house-checklists pattern)
    if (results.queuedAttachments) {
      for (const itemId in results.queuedAttachments) {
        for (const queued of results.queuedAttachments[itemId]) {
          const file = queued.file;
          const filePath = `${submissionId}/${itemId}/${Date.now()}-${file.name}`;
          await supabase.storage.from('checklist-attachments').upload(filePath, file);
          await supabase.from('house_checklist_item_attachments').insert({
            submission_id: submissionId,
            item_id: itemId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: staffId || null
          });
        }
      }
    }

    return submissionId;
  };

  const handleSaveChecklistProgress = async (results: any) => {
    try {
      const id = await persistChecklistExecution(results, 'in_progress');
      const completedItems: Record<string, boolean> = {};
      const itemNotes: Record<string, string> = {};
      results.items.forEach((item: any) => {
        completedItems[item.item_id] = item.is_completed;
        itemNotes[item.item_id] = item.note || '';
      });
      setActiveSubmission(prev => ({ 
        ...prev, 
        id, 
        completedItems, 
        itemNotes 
      }));
      refresh();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress.');
    }
  };

  const handleCompleteChecklist = async (results: any) => {
    try {
      await persistChecklistExecution(results, 'completed');
      setShowChecklistDialog(false);
      setExecutingChecklist(null);
      setActiveSubmission(null);
      refresh();
      if (onRefreshNeeded) onRefreshNeeded();
      toast.success('Checklist completed successfully!');
    } catch (error) {
      console.error('Error completing checklist:', error);
      toast.error('Failed to complete checklist.');
    }
  };

  const handleMarkAttachmentForDeletion = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      toDeleteAttachments: [...prev.toDeleteAttachments, attachmentId]
    }));
  };

  const handleAddQueuedFile = (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setFormData(prev => ({
      ...prev,
      queuedAttachments: [...prev.queuedAttachments, { file, tempId }]
    }));
  };

  const handleRemoveQueuedFile = (tempId: string) => {
    setFormData(prev => ({
      ...prev,
      queuedAttachments: prev.queuedAttachments.filter(f => f.tempId !== tempId)
    }));
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.event_date) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    try {
      const eventData = {
        title: formData.title,
        event_type_id: formData.event_type_id || null,
        description: formData.description || null,
        event_date: formData.event_date,
        end_date: formData.end_date || formData.event_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        participant_ids: formData.participant_ids || [],
        assigned_staff_ids: formData.assigned_staff_ids || [],
        status: formData.status || 'scheduled',
        location: formData.location || null,
        created_by: user?.id,
        is_checklist_event: !!formData.house_checklist_id,
        house_checklist_id: formData.house_checklist_id || null,
      };

      let finalEventId: string | null = null;

      if (selectedEvent) {
        // Update existing event
        if (selectedEvent.tempId) {
          // Update pending add
          const newPending = {
            ...pendingChanges,
            calendarEvents: {
              ...pendingChanges.calendarEvents,
              toAdd: pendingChanges.calendarEvents.toAdd.map(event =>
                event.tempId === selectedEvent.tempId ? { ...event, ...eventData } : event
              ),
            },
          };
          onPendingChangesChange(newPending);
          // For temp events, we still can't upload attachments until real ID exists
        } else {
          finalEventId = selectedEvent.id;
          // Add to pending updates
          const newPending = {
            ...pendingChanges,
            calendarEvents: {
              ...pendingChanges.calendarEvents,
              toUpdate: [
                ...pendingChanges.calendarEvents.toUpdate.filter(e => e.id !== selectedEvent.id),
                { id: selectedEvent.id, ...eventData },
              ],
            },
          };
          onPendingChangesChange(newPending);
        }
      } else {
        // Add new event - since user wants to upload NOW, we must CREATE the event now to get an ID
        // instead of putting it in "pendingChanges"
        if (formData.queuedAttachments.length > 0) {
          toast.loading('Creating event and uploading attachments...');
          
          // Exclude junction fields for direct table insert
          const { participant_ids, assigned_staff_ids, ...directTableData } = eventData;

          const { data: newEvent, error: insertError } = await supabase
            .from('house_calendar_events')
            .insert({
              ...directTableData,
              house_id: houseId,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          finalEventId = newEvent.id;

          // Also handle immediate junction inserts
          if (participant_ids?.length > 0) {
            await supabase
              .from('house_calendar_event_participants')
              .insert(participant_ids.map(id => ({ event_id: finalEventId, participant_id: id })));
          }
          if (assigned_staff_ids?.length > 0) {
            await supabase
              .from('house_calendar_event_staff')
              .insert(assigned_staff_ids.map(id => ({ event_id: finalEventId, staff_id: id })));
          }

          toast.dismiss();
        } else {
          // Normal flow for events without attachments (keep them pending)
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const newPending = {
            ...pendingChanges,
            calendarEvents: {
              ...pendingChanges.calendarEvents,
              toAdd: [
                ...pendingChanges.calendarEvents.toAdd,
                { tempId, house_id: houseId, ...eventData },
              ],
            },
          };
          onPendingChangesChange(newPending);
        }
      }

      // Handle attachments if we have a real database ID
      if (finalEventId) {
        // 1. Delete marked attachments
        if (formData.toDeleteAttachments.length > 0) {
          for (const attId of formData.toDeleteAttachments) {
            const att = formData.existingAttachments.find(a => a.id === attId);
            if (att?.file_path) await supabase.storage.from('house-documents').remove([att.file_path]);
            await supabase.from('house_calendar_event_attachments').delete().eq('id', attId);
          }
        }

        // 2. Upload queued attachments
        if (formData.queuedAttachments.length > 0) {
          for (const queued of formData.queuedAttachments) {
            const ext = queued.file.name.split('.').pop();
            const filePath = `calendar-events/${finalEventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from('house-documents')
              .upload(filePath, queued.file);
            
            if (uploadError) throw uploadError;

            await supabase.from('house_calendar_event_attachments').insert({
              event_id: finalEventId,
              file_name: queued.file.name,
              file_path: filePath,
              file_size: queued.file.size,
              mime_type: queued.file.type,
              uploaded_by: user?.id,
            });
          }
        }
        
        if (formData.toDeleteAttachments.length > 0 || formData.queuedAttachments.length > 0) {
          toast.success('Event saved with attachments');
        }
      }

      setShowEventDialog(false);
    } catch (error: any) {
      console.error('Error saving event attachments:', error);
      toast.error('Failed to process attachments: ' + error.message);
    }
  };

  const handleDeleteEvent = (event: any) => {
    if (event.tempId) {
      handleCancelPendingAdd(event.tempId);
      return;
    }

    // Handle shift deletion
    if (event.type === 'shift') {
      const shiftId = event.id.replace('shift-', '');
      handleDeleteShift(shiftId);
      return;
    }

    if (event.is_checklist_event && event.checklist_schedule_id) {
      setEventToDeleteInstance(event);
      setShowDeleteChoice(true);
      return;
    }

    if (!pendingChanges || !onPendingChangesChange) return;

    if (confirm('Mark this event for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        calendarEvents: {
          ...pendingChanges.calendarEvents,
          toDelete: [...pendingChanges.calendarEvents.toDelete, event.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!eventToDeleteInstance) return;
    await deleteEvent(eventToDeleteInstance.id);
    setShowDeleteChoice(false);
    setEventToDeleteInstance(null);
    refresh();
  };

  const handleConfirmDeleteSeries = async () => {
    if (!eventToDeleteInstance?.checklist_schedule_id) return;
    await deleteSchedule(eventToDeleteInstance.checklist_schedule_id);
    setShowDeleteChoice(false);
    setEventToDeleteInstance(null);
    refresh();
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      calendarEvents: {
        ...pendingChanges.calendarEvents,
        toAdd: pendingChanges.calendarEvents.toAdd.filter(event => event.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      calendarEvents: {
        ...pendingChanges.calendarEvents,
        toUpdate: pendingChanges.calendarEvents.toUpdate.filter(event => event.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      calendarEvents: {
        ...pendingChanges.calendarEvents,
        toDelete: pendingChanges.calendarEvents.toDelete.filter(eventId => eventId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Shift Dialog handlers
  const handleSaveShift = async (formData: ShiftFormData) => {
    setSavingShift(true);
    try {
      if (selectedShift) {
        // Update existing shift
        await updateShift(selectedShift.id, formData);
        toast.success('Shift updated successfully');
      } else {
        // Create new shift - ensure house_id is set
        const shiftData = {
          ...formData,
          house_id: houseId,
        };
        await createShift(shiftData);
        toast.success('Shift created successfully');
      }
      setShowShiftDialog(false);
      refresh(); // Refresh calendar events to show new shift
    } catch (error: any) {
      console.error('Error saving shift:', error);
      toast.error('Failed to save shift: ' + error.message);
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      setShowShiftDialog(false);
      refresh();
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift: ' + error.message);
    }
  };

  // Helper function to get participant name
  const getParticipantName = (event: any) => {
    if (event.event_participants?.length > 0) {
      const names = event.event_participants.map((ep: any) => ep.participant?.name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return null;
  };

  // Helper function to get staff name
  const getStaffName = (event: any) => {
    if (event.event_staff?.length > 0) {
      const names = event.event_staff.map((es: any) => es.staff?.name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return null;
  };

  // Get status color based on date/time calculation
  const getStatusColor = (event: any) => {
    const now = new Date();
    const eventDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
    
    if (eventDate > now) return 'blue'; // Upcoming
    return 'green'; // Past
  };

  const getStatusText = (event: any) => {
    if (event.type === 'shift') return 'Rostered';
    if (event.is_checklist_event) {
      const submission = event.submissions?.[0];
      if (submission?.status === 'completed') return 'Completed';
      if (submission?.status === 'in_progress') return 'In Progress';
      
      const eventDate = startOfDay(new Date(event.event_date));
      const today = startOfDay(new Date());
      if (isBefore(eventDate, today)) return 'Overdue';
      return 'Scheduled';
    }

    const now = new Date();
    const eventDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
    
    return eventDate > now ? 'Upcoming' : 'Past';
  };

  // Get type color
  const getTypeColor = (event: any) => {
    // Priority 1: Shift-specific color
    if (event.type === 'shift') {
      return getPeriodTheme(event.shift_template, event.type_details?.color_theme).color || 'blue';
    }

    // Priority 2: Checklist (Dynamic Period Theme)
    if (event.is_checklist_event) return getPeriodTheme(event.target_shift).color;
    // Priority 3: Explicit Event Type Color from DB
    if (event.event_type_info?.color) return event.event_type_info.color;

    // Priority 4: Fallback string matching
    const type = event.type || '';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('meeting') || lowerType.includes('visit')) return 'purple';
    if (lowerType.includes('appointment')) return 'orange';
    if (lowerType.includes('activity') || lowerType.includes('event')) return 'green';
    if (lowerType.includes('community')) return 'blue';
    if (lowerType.includes('maintenance')) return 'red';
    return 'gray';
  };

  useImperativeHandle(ref, () => ({
    handleEditEvent,
    refresh
  }));

  return (
    <>
      <Card className="pb-2.5" id="calendar_events">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-5">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              House Calendar
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                {[
                  { id: 'shift', label: 'Shifts', color: 'blue' },
                  { id: 'checklist', label: 'Checklists', color: 'amber' },
                  { id: 'meeting', label: 'Meetings', color: 'purple' },
                  { id: 'appointment', label: 'Appts', color: 'orange' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                      filterTypes.includes(filter.id)
                        ? `bg-${filter.color}-500 text-white shadow-sm`
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPopulateModal(true)}
                  className="gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Zap className="size-4 fill-primary" />
                  Build Roster
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleChecklistsModal(true)}
                  className="gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5"
                >
                  <CalendarCheck className="size-4 text-primary" />
                  Schedule Checklists
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="gap-2 font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm bg-white"
                >
                  <Trash2 className="size-4" />
                  Bulk Delete
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg mt-2">
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-24 h-8 text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => navigatePeriod('prev')}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold uppercase" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => navigatePeriod('next')}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {getPeriodLabel()}
            </span>
          </div>
        </CardHeader>        <CardContent className="relative">
          {loading && getEventsForPeriod.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Loading calendar events...</p>
            </div>
          ) : (
            <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {/* Visual Calendar View */}
              <div className="border rounded-xl overflow-hidden bg-background">
                {viewMode === 'week' ? (
                  <div className="grid grid-cols-1 md:grid-cols-7 divide-x divide-gray-100">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = addDays(startOfWeek(currentDate), i);
                      const dayEvents = getEventsForPeriod.filter(e => isSameDay(new Date(e.event_date), day));
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div key={i} className={`min-h-[200px] flex flex-col group/day ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                          <div 
                            className={`p-2 border-b border-gray-100 transition-colors ${isToday ? 'bg-primary/5' : 'bg-gray-50/50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="text-center flex-1">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{format(day, 'EEE')}</div>
                                <div className={`size-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold mt-0.5 ${isToday ? 'bg-primary text-white' : 'text-gray-900'}`}>
                                  {format(day, 'd')}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 opacity-0 group-hover/day:opacity-100 transition-opacity -mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddEvent(day);
                                }}
                              >
                                <Plus className="size-5 text-primary" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[400px]">
                            {dayEvents.length === 0 ? (
                              <div className="h-full min-h-[100px] flex items-center justify-center italic text-[10px] text-muted-foreground/30">
                                No events
                              </div>
                            ) : (
                              dayEvents.map(event => {
                                if (event.type === 'shift') {
                                  return (
                                    <ShiftCard
                                      key={event.id}
                                      shift={mapEventToShiftCardData(event)}
                                      compact={true}
                                      showStaffName={true}
                                      showHouseName={false}
                                      onClick={(e?: React.MouseEvent) => {
                                        e?.stopPropagation();
                                        handleEditEvent(event);
                                      }}
                                      staffList={staffList}
                                      onQuickAssign={handleQuickAssign}
                                    />
                                  );
                                }
                                
                                return (
                                  <div
                                    key={event.id || event.tempId}
                                    onClick={() => handleEditEvent(event)}
                                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                                      event.tempId ? 'bg-primary/5 border-primary/20' :
                                      pendingChanges?.calendarEvents.toDelete.includes(event.id) ? 'opacity-40 bg-destructive/5' :
                                      'bg-white border-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className={`size-1.5 rounded-full bg-${getTypeColor(event)}-500`} />
                                      {event.is_checklist_event && <CheckSquare className={`size-2.5 text-${getTypeColor(event)}-600`} />}
                                      <span className="text-[10px] font-bold text-gray-900 truncate leading-none">{event.title}</span>
                                    </div>                                  <div className="flex flex-col gap-0.5">
                                      <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                                        {(event.event_type_info?.name || event.type)}
                                      </div>
                                      {(event.start_time || event.end_time) && (
                                        <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                                          <Clock className="size-2.5" />
                                          {event.start_time || '??'} {event.end_time && `- ${event.end_time}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : viewMode === 'day' ? (
                  <div className="p-4 flex flex-col gap-4 min-h-[300px]">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-lg">{format(currentDate, 'EEEE, MMMM d')}</h3>
                    </div>
                    <div className="space-y-3">
                      {getEventsForPeriod.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground italic">No events for this day</div>
                      ) : (
                        getEventsForPeriod.map(event => {
                          if (event.type === 'shift') {
                            return (
                              <ShiftCard
                                key={event.id}
                                shift={mapEventToShiftCardData(event)}
                                compact={false}
                                showStaffName={true}
                                showHouseName={false}
                                onClick={(e?: React.MouseEvent) => {
                                  e?.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                staffList={staffList}
                                onQuickAssign={handleQuickAssign}
                              />                            );
                          }

                          return (
                            <div 
                              key={event.id || event.tempId}
                              onClick={() => handleEditEvent(event)}
                              className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all group"
                            >
                              <div className={`w-1 self-stretch rounded-full bg-${getTypeColor(event)}-500`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {event.is_checklist_event && <CheckSquare className={`size-4 text-${getTypeColor(event)}-600`} />}
                                  <h4 className="font-bold text-gray-900">{event.title}</h4>                                <Badge variant="outline" className={`text-[10px] border-${getTypeColor(event)}-200 text-${getTypeColor(event)}-700 bg-${getTypeColor(event)}-50 uppercase font-bold`}>
                                    {(event.event_type_info?.name || event.type)}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {(event.start_time || event.end_time) && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="size-3.5" />
                                      {event.start_time || '??'} {event.end_time && `- ${event.end_time}`}
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="size-3.5" />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                                {event.description && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{event.description}</p>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canDelete && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="size-8 text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event);
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="size-8">
                                  <Edit className="size-4" />
                                </Button>
                                </div>
                                </div>
                          );
                        })
                      )}                    </div>
                  </div>
                ) : viewMode === 'month' ? (
                  <div className="p-0 border-t">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b bg-gray-50/50">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 border-l border-t border-gray-100">
                      {eachDayOfInterval({
                        start: startOfWeek(startOfMonth(currentDate)),
                        end: endOfWeek(endOfMonth(currentDate))
                      }).map((day, idx) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const dayEvents = visibleEvents.filter(e => e.event_date === dayStr);
                        const isToday = isSameDay(day, new Date());
                        const isInMonth = isSameMonth(day, currentDate);

                        return (
                          <div 
                            key={idx} 
                            className={`min-h-[120px] p-2 border-r border-b border-gray-100 flex flex-col gap-1 transition-colors hover:bg-gray-50/50 ${
                              !isInMonth ? 'bg-gray-50/30' : ''
                            }`}
                            onClick={() => handleAddEvent(day)}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-bold ${
                                isToday ? 'bg-primary text-white size-6 rounded-full flex items-center justify-center' : 
                                !isInMonth ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {format(day, 'd')}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                              {dayEvents.map(event => {
                                const isShift = event.type === 'shift';
                                
                                if (isShift) {
                                  return (
                                    <ShiftCard
                                      key={event.id}
                                      shift={mapEventToShiftCardData(event)}
                                      compact={true}
                                      showStaffName={true}
                                      showHouseName={false}
                                      onClick={(e?: React.MouseEvent) => {
                                        e?.stopPropagation();
                                        handleEditEvent(event);
                                      }}
                                      staffList={staffList}
                                      onQuickAssign={handleQuickAssign}
                                    />
                                  );
                                }

                                const theme = event.is_checklist_event
                                  ? getPeriodTheme(event.target_shift)
                                  : null;
                                
                                const Icon = event.is_checklist_event ? theme?.icon || CheckSquare : null;

                                return (
                                  <div
                                    key={event.id || event.tempId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEvent(event);
                                    }}
                                    className={cn(
                                      "px-1.5 py-1 rounded text-[9px] font-medium flex flex-col gap-0.5 border transition-all hover:scale-[1.02]",
                                      event.is_checklist_event 
                                        ? `bg-${getTypeColor(event)}-50 text-${getTypeColor(event)}-700 border-${getTypeColor(event)}-200`
                                        : `bg-white text-gray-700 border-gray-200`
                                    )}
                                    title={`${event.title} (${getStatusText(event)})`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="uppercase font-bold text-[8px] opacity-70 truncate flex items-center gap-1">
                                        {Icon && <Icon className="size-2 shrink-0" />}
                                        {(event.event_type_info?.name || event.type)}
                                      </span>
                                      <span className={cn(
                                        "size-1.5 rounded-full shrink-0",
                                        event.is_checklist_event ? getPeriodTheme(event.target_shift).dot : 
                                        `bg-${getTypeColor(event)}-500`
                                      )} />
                                    </div>
                                    <div className="font-bold truncate text-gray-900 leading-tight">
                                      {event.title}
                                    </div>
                                    
                                    <div className={cn(
                                      "text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1",
                                      `text-${getTypeColor(event)}-600`
                                    )}>
                                      {getStatusText(event)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Placeholder for any other view modes
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Unsupported View Mode</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BulkDeleteCalendarModal
        open={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        houseName={houseName || 'Selected House'}
      />

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {selectedEvent
                ? 'Update event details'
                : 'Create a new calendar event'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Type</Label>
                <HouseCalendarEventTypeCombobox
                  value={formData.event_type_id || ''}
                  onChange={(value) => setFormData({ ...formData, event_type_id: value })}
                  onManageList={() => setShowEventTypeDialog(true)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Start Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      event_date: newStart,
                      end_date: prev.end_date < newStart ? newStart : prev.end_date,
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  min={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Participants</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50/50">
                  {participants.filter(p => p.status === 'active' || formData.participant_ids?.includes(p.id)).map(participant => (
                    <label key={participant.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white rounded">
                      <Checkbox 
                        checked={formData.participant_ids?.includes(participant.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            participant_ids: checked 
                              ? [...(prev.participant_ids || []), participant.id]
                              : (prev.participant_ids || []).filter(id => id !== participant.id)
                          }));
                        }}
                      />
                      <span className="text-sm">{participant.name}</span>
                    </label>
                  ))}
                  {participants.length === 0 && (
                    <span className="text-xs text-muted-foreground italic px-2">No active participants found</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned Staff</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50/50">
                  {systemStaff.filter(s => {
                    const isStatusActive = (s as any).status?.toLowerCase() === 'active' || formData.assigned_staff_ids?.includes(s.id);
                    if (!isStatusActive) return false;
                    const today = new Date().toISOString().split('T')[0];
                    const assignments = (s as any).house_assignments || [];
                    const hasActiveAssignment = assignments.some((a: any) => {
                      const assignmentHouseId = (a.house_id || a.house?.id || '').toLowerCase();
                      const targetHouseId = (houseId || '').toLowerCase();
                      const isTargetHouse = assignmentHouseId === targetHouseId;
                      const isCurrent = !a.end_date || a.end_date >= today;
                      return isTargetHouse && isCurrent;
                    });
                    return hasActiveAssignment || formData.assigned_staff_ids?.includes(s.id);
                  }).map(staffMember => (
                    <label key={staffMember.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white rounded">
                      <Checkbox 
                        checked={formData.assigned_staff_ids?.includes(staffMember.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            assigned_staff_ids: checked 
                              ? [...(prev.assigned_staff_ids || []), staffMember.id]
                              : (prev.assigned_staff_ids || []).filter(id => id !== staffMember.id)
                          }));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage src={(staffMember as any).photo_url} />
                          <AvatarFallback className="text-[8px]">{staffMember.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{staffMember.name}</span>
                      </div>
                    </label>
                  ))}
                  {systemStaff.length === 0 && (
                    <span className="text-xs text-muted-foreground italic px-2">No assigned staff found</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <HouseCalendarEventAttachments
              existingAttachments={formData.existingAttachments}
              queuedAttachments={formData.queuedAttachments}
              toDeleteAttachments={formData.toDeleteAttachments}
              onAddQueuedFile={handleAddQueuedFile}
              onRemoveQueuedFile={handleRemoveQueuedFile}
              onMarkForDeletion={handleMarkAttachmentForDeletion}
              canEdit={true}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HouseCalendarEventTypeMasterDialog
        open={showEventTypeDialog}
        onClose={() => setShowEventTypeDialog(false)}
        onUpdate={() => {}}
      />

      {/* Checklist Execution Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl min-h-[500px] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between w-full pr-6">
              <div className="flex flex-col gap-1">
                <DialogTitle className="flex items-center gap-2">
                  <CheckSquare className="size-5 text-primary" />
                  {executingChecklist?.name}
                </DialogTitle>
                <DialogDescription>
                  Date: {selectedEvent && format(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}
                </DialogDescription>
              </div>
              
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 -mt-2"
                  title="Delete this event/series"
                  onClick={() => {
                    setShowChecklistDialog(false);
                    handleDeleteEvent(selectedEvent);
                  }}
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 py-4 overflow-hidden">
            {executingChecklist && (
              <HouseChecklistExecution 
                checklist={executingChecklist}
                onComplete={handleCompleteChecklist}
                onSave={handleSaveChecklistProgress}
                onCancel={() => {
                  setShowChecklistDialog(false);
                  setExecutingChecklist(null);
                  setActiveSubmission(null);
                }}
                initialData={activeSubmission ? {
                  completedItems: activeSubmission.completedItems,
                  itemNotes: activeSubmission.itemNotes,
                  attachments: activeSubmission.attachments
                } : undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Delete Choice Dialog */}
      <Dialog open={showDeleteChoice} onOpenChange={setShowDeleteChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete recurring event?</DialogTitle>
            <DialogDescription>
              This is a recurring checklist event. Do you want to delete only this instance or the entire series?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 px-4" 
              onClick={handleConfirmDeleteSingle}
              disabled={deleting}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold">This event</span>
                <span className="text-xs text-muted-foreground font-normal text-left">Only removes the checklist for this specific day.</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 px-4 border-destructive/20 hover:bg-destructive/5 hover:border-destructive/30 group" 
              onClick={handleConfirmDeleteSeries}
              disabled={deleting}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold group-hover:text-destructive transition-colors">All events</span>
                <span className="text-xs text-muted-foreground font-normal text-left">Removes the entire schedule and all future/past instances.</span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteChoice(false)} disabled={deleting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      {houseId && (
        <ShiftDialog
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
          shift={selectedShift}
          staffId={staffId}
          preSelectedDate={shiftPreSelectedDate}
          preSelectedHouseId={houseId}
          staffList={allRosterStaff || []}
          houses={[{ id: houseId, name: 'Current House' }]}
          participants={participants.filter(p => p.house_id === houseId)}
          checklists={houseChecklists}
          shiftTemplates={shiftTemplates}
          onSave={handleSaveShift}
          onDelete={selectedShift ? handleDeleteShift : undefined}
          staffSelectionDisabled={false}
          readOnly={!canDelete}
        />
      )}

      <PopulateRosterModal 
        open={showPopulateModal}
        onOpenChange={setShowPopulateModal}
        houseId={houseId!}
        houseName={houseName || ''}
        onSuccess={refresh}
      />

      <ScheduleChecklistsModal
        open={showScheduleChecklistsModal}
        onOpenChange={setShowScheduleChecklistsModal}
        houseId={houseId!}
        houseName={houseName || ''}
        onSuccess={refresh}
      />
    </>
  );
});
