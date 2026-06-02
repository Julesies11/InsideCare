import { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Edit, Trash2, Plus, CalendarDays, ChevronLeft, ChevronRight, Loader2, CheckSquare, CalendarCheck } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { HouseChecklistExecution } from './house-checklist-execution';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { STATUS, CHECKLIST_STATUS } from '@/config/enums';
import { BulkDeleteCalendarModal } from './BulkDeleteCalendarModal';
import { ScheduleChecklistsModal } from './ScheduleChecklistsModal';
import { useHouseCalendarEventTypesMaster } from '@/hooks/use-house-calendar-event-types-master';
import { useQueryClient } from '@tanstack/react-query';
import { houseOperationsApi } from '@/api/house-operations.api';
import { checklistsApi } from '@/api/checklists.api';

export interface HouseCalendarEventsProps {
  houseId?: string;
  houseName?: string;
  staffId?: string;
  canEdit: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  onRefreshNeeded?: () => void;
  // refreshKey?: number;
  hideCalendar?: boolean;
  hideCardWrapper?: boolean;
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
  // refreshKey,
  hideCalendar,
  hideCardWrapper = false
}, ref) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventTypeDialog, setShowEventTypeDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showScheduleChecklistsModal, setShowScheduleChecklistsModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Filtering state
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const { data: eventTypesMaster } = useHouseCalendarEventTypesMaster();

  useEffect(() => {
    if (eventTypesMaster) {
      // Initialize with dynamic IDs AND legacy types
      setFilterTypes([
        ...eventTypesMaster.map(type => type.id),
        'meeting', 'appointment', 'clinical', 'other'
      ]);
    }
  }, [eventTypesMaster]);
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
  
  const { startDate, endDate } = useMemo(() => {
    let start, end;
    if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    }
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  }, [currentDate, viewMode]);

  const { houseCalendarEvents, loading, refresh } = useHouseCalendarEvents(houseId, staffId, startDate, endDate);
  const { houseChecklists } = useHouseChecklists(houseId);

  const { deleteSchedule, deleteEvent, loading: deleting } = useChecklistSchedules(houseId);
  const { participants } = useParticipants(0, 1000);
  const { staff: systemStaff } = useStaff(0, 1000, [], { statuses: ['active'] }); // Fetch more staff for general events
  const { assignments: houseStaffAssignments } = useHouseStaffAssignments(houseId);
  const { user, isAdmin = false } = useAuth();
  
  // Refresh when refreshKey changes
  // useEffect(() => {
  //   if (refreshKey) refresh();
  // }, [refreshKey, refresh]);

  const handleBulkDelete = async ({ startDate, endDate, deleteEvents, deleteChecklists }: any) => {
    if (!houseId) return;
    
    try {
      await houseOperationsApi.calendar.bulkDelete({
        houseId,
        startDate,
        endDate,
        deleteChecklists
      });
      
      await queryClient.invalidateQueries({ queryKey: ['house-calendar-events', { houseId }] });
      await queryClient.invalidateQueries({ queryKey: ['house-checklist-history', houseId] });
      refresh();
      
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  };

  const staffList = useMemo(() => {
    return systemStaff.map(s => ({ id: s.id, staff_name: s.staff_name }));
  }, [systemStaff]);

  // Apply filtering
  const filteredEvents = useMemo(() => {
    return houseCalendarEvents.filter(event => {
      // Use event_type_id if available, otherwise fall back to legacy 'type'
      if (event.event_type_id) {
        return filterTypes.includes(event.event_type_id);
      }
      return filterTypes.includes(event.type || 'other');
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
    if (event.is_checklist_event) {
      try {
        // 1. Fetch the House Checklist and its items
        const { data: checklist, error: clError } = await supabase
          .from(TABLES.HOUSE_CHECKLISTS)
          .select(`*, items:${TABLES.HOUSE_CHECKLIST_ITEMS}(*)`)
          .eq('id', event.house_checklist_id)
          .maybeSingle();

        if (clError) throw clError;
        if (!checklist) throw new Error("You do not have permission to perform this action");

        // 2. Check if a submission already exists for this calendar event
        let existingSubmission = event.submissions?.[0];
        
        if (!existingSubmission) {
          const { data: directSubs } = await supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSIONS)
            .select('id, status, updated_at, scheduled_date')
            .eq('checklist_id', event.house_checklist_id)
            .eq('calendar_event_id', event.id)
            .eq('status', CHECKLIST_STATUS.in_progress)
            .order('updated_at', { ascending: false })
            .limit(1);
            
          if (directSubs && directSubs.length > 0) {
            existingSubmission = directSubs[0];
          }
        }
        
        if (existingSubmission) {
          const { data: subItems } = await supabase
            .from(TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS)
            .select(`
              *,
              completed_by_staff:${TABLES.STAFF}!house_checklist_submission_items_completed_by_fkey(id, staff_name)
            `)
            .eq('submission_id', existingSubmission.id);

          const completedItems: Record<string, boolean> = {};
          const itemNotes: Record<string, string> = {};
          const completedBy: Record<string, { id: string; name: string }> = {};

          subItems?.forEach(si => {
            const isDone = si.status === CHECKLIST_STATUS.COMPLETED || si.is_completed;
            completedItems[si.item_id] = isDone;
            itemNotes[si.item_id] = si.note || '';
            if (isDone && si.completed_by_staff) {
              completedBy[si.item_id] = {
                id: si.completed_by_staff.id,
                name: si.completed_by_staff.staff_name
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

  const persistChecklistExecution = async (results: any, status: string) => {
    if (!selectedEvent || !houseId) return;

    const staffId = (user as any)?.staff_id;

    return await checklistsApi.persistExecution({
      checklistId: executingChecklist.id,
      houseId: houseId,
      calendarEventId: selectedEvent.id,
      scheduledDate: selectedEvent.event_date,
      status,
      staffId,
      submissionId: activeSubmission?.id,
      results
    });
  };

  const handleSaveChecklistProgress = async (results: any) => {
    try {
      const id = await persistChecklistExecution(results, CHECKLIST_STATUS.in_progress);
      const completedItems: Record<string, boolean> = {};
      const itemNotes: Record<string, string> = {};
      const completedBy: Record<string, { id: string; name: string }> = {};
      
      results.items.forEach((item: any) => {
        completedItems[item.item_id] = item.is_completed;
        itemNotes[item.item_id] = item.note || '';
        
        if (item.is_completed && item.completed_by) {
          const name = item.completed_by === user?.staff_id 
            ? (user?.staff_name || user?.fullname || user?.email || 'Me')
            : 'Other Staff';
            
          completedBy[item.item_id] = {
            id: item.completed_by,
            name: name
          };
        }
      });

      setActiveSubmission({ 
        id, 
        completedItems, 
        itemNotes,
        completedBy,
        attachments: activeSubmission?.attachments || {}
      });
      refresh();
      if (onRefreshNeeded) onRefreshNeeded();
      toast.success('Progress saved successfully');
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
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        status: formData.status || 'scheduled',
        location: formData.location || null,
        is_checklist_event: !!formData.house_checklist_id,
        house_checklist_id: formData.house_checklist_id || null,
        created_by: user?.staff_id || null,
      };

      if (selectedEvent) {
        if (selectedEvent.tempId) {
          const newPending = {
            ...pendingChanges,
            calendarEvents: {
              ...pendingChanges.calendarEvents,
              toAdd: pendingChanges.calendarEvents.toAdd.map(event =>
                event.tempId === selectedEvent.tempId ? { ...event, ...eventData, participant_ids: formData.participant_ids, assigned_staff_ids: formData.assigned_staff_ids } : event
              ),
            },
          };
          onPendingChangesChange(newPending);
          setShowEventDialog(false);
          await refresh();
        } else {
          // It's an existing event being updated
          toast.loading('Saving event updates...');
          await houseOperationsApi.calendar.updateWithRelations(
            selectedEvent.id, 
            eventData, 
            formData.toDeleteAttachments, 
            formData.queuedAttachments?.map(qa => ({ file: qa.file })),
            user?.id
          );
          toast.dismiss();
          toast.success('Event updated successfully');
          setShowEventDialog(false);
          await refresh();
        }
      } else {
        if (formData.queuedAttachments.length > 0) {
          toast.loading('Creating event and uploading attachments...');
          
          await houseOperationsApi.calendar.createWithRelations(
            { ...eventData, house_id: houseId }, 
            formData.participant_ids || [], 
            formData.assigned_staff_ids || [], 
            formData.queuedAttachments?.map(qa => ({ file: qa.file })), 
            user?.id
          );
          
          toast.dismiss();
          toast.success('Event saved with attachments');
          setShowEventDialog(false);
          await refresh();
        } else {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const newPending = {
            ...pendingChanges,
            calendarEvents: {
              ...pendingChanges.calendarEvents,
              toAdd: [
                ...pendingChanges.calendarEvents.toAdd,
                { tempId, house_id: houseId, ...eventData, participant_ids: formData.participant_ids, assigned_staff_ids: formData.assigned_staff_ids },
              ],
            },
          };
          onPendingChangesChange(newPending);
          setShowEventDialog(false);
        }
      }
    } catch (error: any) {
      console.error('Error saving event attachments:', error);
      toast.error('Failed to save event: ' + error.message);
    }
  };

  const handleDeleteEvent = (event: any) => {
    if (event.tempId) {
      handleCancelPendingAdd(event.tempId);
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

  const getParticipantName = (event: any) => {
    if (event.event_participants?.length > 0) {
      const names = event.event_participants.map((ep: any) => ep.participant?.participant_name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return null;
  };

  const getStaffName = (event: any) => {
    if (event.event_staff?.length > 0) {
      const names = event.event_staff.map((es: any) => es.staff?.staff_name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return null;
  };

  const getStatusColor = (event: any) => {
    const now = new Date();
    const eventDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
    if (eventDate > now) return 'blue';
    return 'green';
  };

  const getStatusText = (event: any) => {
    if (event.is_checklist_event) {
      const submission = event.submissions?.[0];
      if (submission?.status === CHECKLIST_STATUS.completed) return CHECKLIST_STATUS.COMPLETED;
      if (submission?.status === CHECKLIST_STATUS.in_progress) return 'In Progress';
      const eventDate = startOfDay(new Date(event.event_date));
      const today = startOfDay(new Date());
      if (isBefore(eventDate, today)) return 'Overdue';
      return 'Scheduled';
    }
    const now = new Date();
    const eventDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
    return eventDate > now ? 'Upcoming' : 'Past';
  };

  const getTypeColor = (event: any) => {
    if (event.is_checklist_event) return 'amber';
    if (event.event_type_info?.color) return event.event_type_info.color;
    const type = (event.type || '').toLowerCase();
    if (type.includes('meeting') || type.includes('visit')) return 'purple';
    if (type.includes('appointment')) return 'orange';
    if (type.includes('activity') || type.includes('event')) return 'green';
    if (type.includes('community')) return 'blue';
    if (type.includes('maintenance')) return 'red';
    return 'gray';
  };

  const eventTypeColors: Record<string, string> = {
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  const getButtonClass = (color: string, isActive: boolean) => {
    if (!isActive) return "text-gray-500 hover:text-gray-700";
    return `${eventTypeColors[color] || 'bg-gray-500'} text-white shadow-sm`;
  };

  useImperativeHandle(ref, () => ({
    handleEditEvent,
    refresh
  }));

  const calendarContent = (
    <div className="relative" id={hideCardWrapper ? "calendar_events" : undefined}>
      {loading && getEventsForPeriod.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Loading calendar events...</p>
        </div>
      ) : (
        <div className="space-y-6 transition-opacity opacity-100">
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
                            return (
                              <div
                                key={event.id || event.tempId}
                                onClick={() => handleEditEvent(event)}
                                className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                                  event.tempId ? 'bg-primary/5 border-primary/20' :
                                  pendingChanges?.calendarEvents.toDelete.includes(event.id) ? 'opacity-40 bg-destructive/5' :
                                  'bg-white border-gray-100'
                                }`}
                              >                                    <div className="flex flex-col gap-1">
                                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                    {event.is_checklist_event && <CheckSquare className={`size-2.5 text-${getTypeColor(event)}-600`} />}
                                    {event.is_checklist_event ? 'CHECKLIST' : (event.event_type_info?.event_type_name || event.type)}
                                  </div>
                                  
                                  <div className="flex items-start gap-1.5">
                                    <div className={`size-1.5 rounded-full bg-${getTypeColor(event)}-500 mt-1 shrink-0`} />
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                      <span className="text-[10px] font-bold text-gray-900 leading-tight whitespace-normal break-words">{event.title}</span>
                                      
                                      {(event.start_time || event.end_time) && (
                                        <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                                          <Clock className="size-2.5" />
                                          {event.start_time || '??'} {event.end_time && `- ${event.end_time}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
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
                                {(event.event_type_info?.event_type_name || event.type)}
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
                            const Icon = event.is_checklist_event ? CheckSquare : null;

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
                                    {event.is_checklist_event ? 'CHECKLIST' : (event.event_type_info?.event_type_name || event.type)}
                                  </span>
                                  <span className={cn(
                                    "size-1.5 rounded-full shrink-0",
                                    `bg-${getTypeColor(event)}-500`
                                  )} />
                                </div>                                    <div className="font-bold text-gray-900 leading-tight whitespace-normal break-words">
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
    </div>
  );

  return (
    <>
      {hideCardWrapper ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <Label className="text-sm font-bold flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" />
              House Calendar
            </Label>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {eventTypesMaster?.map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleFilter(type.id)}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded-md transition-all",
                      getButtonClass(type.color, filterTypes.includes(type.id))
                    )}
                  >
                    {type.event_type_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-20 h-7 text-[9px] font-bold uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => navigatePeriod('prev')}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold uppercase px-2" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => navigatePeriod('next')}>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-700">
              {getPeriodLabel()}
            </span>
          </div>

          {calendarContent}
        </div>
      ) : (
        !hideCalendar && (
          <Card className="pb-2.5" id="calendar_events">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-5">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-primary" />
                  House Calendar
                </CardTitle>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                    {eventTypesMaster?.map(type => (
                      <button
                        key={type.id}
                        onClick={() => toggleFilter(type.id)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                          getButtonClass(type.color, filterTypes.includes(type.id))
                        )}
                      >
                        {type.event_type_name}
                      </button>
                    ))}
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
            </CardHeader>
            <CardContent>
              {calendarContent}
            </CardContent>
          </Card>
        )
      )}

      <BulkDeleteCalendarModal
        open={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        houseName={houseName || 'Selected House'}
      />

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
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
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
                  {participants.filter(p => p.status === STATUS.active || formData.participant_ids?.includes(p.id)).map(participant => (
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
                      <span className="text-sm">{participant.participant_name}</span>
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
                    const isStatusActive = (s as any).status?.toLowerCase() === STATUS.active || formData.assigned_staff_ids?.includes(s.id);
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
                          <AvatarFallback className="text-[8px]">{staffMember.staff_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{staffMember.staff_name}</span>
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
                  {executingChecklist?.house_checklist_name}
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
                key={activeSubmission?.id || 'new'}
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
                  completedBy: activeSubmission.completedBy,
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
