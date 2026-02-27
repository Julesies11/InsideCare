import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Plus, CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { useHouseCalendarEvents } from '@/hooks/useHouseCalendarEvents';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/useStaff';
import { useAuth } from '@/auth/context/auth-context';
import { HousePendingChanges } from '@/models/house-pending-changes';

interface HouseCalendarEventsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export function HouseCalendarEvents({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseCalendarEventsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    participant_id: '',
    assigned_staff_id: '',
    status: 'scheduled',
    location: '',
    notes: '',
  });

  const { houseCalendarEvents, loading } = useHouseCalendarEvents(houseId);
  const { participants } = useParticipants();
  const { staff } = useStaff();
  const { user } = useAuth();

  // Combine existing events with pending adds, filter out pending deletes
  const visibleEvents = useMemo(() => {
    const existingEvents = houseCalendarEvents.filter(event => !pendingChanges?.calendarEvents.toDelete.includes(event.id));
    const pendingAdds = pendingChanges?.calendarEvents.toAdd || [];
    return [...existingEvents, ...pendingAdds];
  }, [houseCalendarEvents, pendingChanges]);

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

    return visibleEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= startDate && eventDate <= endDate;
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
    setSelectedDate(date);
    setSelectedEvent(null);
    setFormData({
      title: '',
      type: 'meeting',
      description: '',
      event_date: format(date, 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      participant_id: '',
      assigned_staff_id: '',
      status: 'scheduled',
      location: '',
      notes: '',
    });
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setFormData({
      title: event.title,
      type: event.type,
      description: event.description || '',
      event_date: event.event_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      participant_id: event.participant_id || '',
      assigned_staff_id: event.assigned_staff_id || '',
      status: event.status || 'scheduled',
      location: event.location || '',
      notes: event.notes || '',
    });
    setShowEventDialog(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title.trim() || !formData.event_date) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    const eventData = {
      ...formData,
      participant_id: formData.participant_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      created_by: user?.id,
    };

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
      } else {
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
      // Add new event
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
    setShowEventDialog(false);
  };

  const handleDeleteEvent = (event: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (event.tempId) {
      handleCancelPendingAdd(event.tempId);
      return;
    }

    // Otherwise, mark existing event for deletion
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

  // Helper function to get participant name
  const getParticipantName = (event: any) => {
    if (event.participant?.name) return event.participant.name;
    if (event.participant_id) {
      const participant = participants.find(p => p.id === event.participant_id);
      return participant?.name || 'Unknown Participant';
    }
    return null;
  };

  // Helper function to get staff name
  const getStaffName = (event: any) => {
    if (event.assigned_staff?.name) return event.assigned_staff.name;
    if (event.assigned_staff_id) {
      const staffMember = staff.find(s => s.id === event.assigned_staff_id);
      return staffMember?.name || 'Unknown Staff';
    }
    return null;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'purple';
      case 'appointment': return 'orange';
      case 'activity': return 'green';
      case 'maintenance': return 'red';
      default: return 'gray';
    }
  };

  return (
    <>
      <Card className="pb-2.5" id="calendar_events">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              Calendar Events
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" className="border border-gray-300 h-9" onClick={() => handleAddEvent(new Date())} disabled={!houseId || !canAdd}>
                <Plus className="size-4 me-1.5" />
                Add Event
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg mt-2">
            <div className="flex items-center gap-1">
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
            <span className="text-sm font-bold text-gray-700">
              {getPeriodLabel()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Loading calendar events...</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                                className="size-6 opacity-0 group-hover/day:opacity-100 transition-opacity -mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddEvent(day);
                                }}
                              >
                                <Plus className="size-3 text-primary" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[400px]">
                            {dayEvents.length === 0 ? (
                              <div className="h-full min-h-[100px] flex items-center justify-center italic text-[10px] text-muted-foreground/30">
                                No events
                              </div>
                            ) : (
                              dayEvents.map(event => (
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
                                    <div className={`size-1.5 rounded-full bg-${getTypeColor(event.type)}-500`} />
                                    <span className="text-[10px] font-bold text-gray-900 truncate leading-none">{event.title}</span>
                                  </div>
                                  {event.start_time && (
                                    <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                                      <Clock className="size-2.5" />
                                      {event.start_time}
                                    </div>
                                  )}
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border-${getStatusColor(event.status)}-200 text-${getStatusColor(event.status)}-700 bg-${getStatusColor(event.status)}-50 uppercase font-bold`}>
                                      {event.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
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
                      <Button variant="outline" size="sm" onClick={() => handleAddEvent(currentDate)}>
                        <Plus className="size-4 me-1.5" />
                        Add Event
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {getEventsForPeriod.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground italic">No events for this day</div>
                      ) : (
                        getEventsForPeriod.map(event => (
                          <div 
                            key={event.id || event.tempId}
                            onClick={() => handleEditEvent(event)}
                            className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all group"
                          >
                            <div className={`w-1 self-stretch rounded-full bg-${getTypeColor(event.type)}-500`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{event.title}</h4>
                                <Badge variant="outline" className={`text-[10px] border-${getStatusColor(event.status)}-200 text-${getStatusColor(event.status)}-700 bg-${getStatusColor(event.status)}-50`}>{event.status}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {event.start_time && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    {event.start_time} {event.end_time && `- ${event.end_time}`}
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
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // Month View - Placeholder for now, but better than before
                  <div className="p-8 text-center text-muted-foreground">
                    <CalendarDays className="size-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Monthly Grid View</p>
                    <p className="text-sm">Currently showing {getEventsForPeriod.length} events in the list below</p>
                  </div>
                )}
              </div>

              {/* Collapsible List of All Events */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Event Details</h3>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                {getEventsForPeriod.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm text-muted-foreground">No events scheduled for this period</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {getEventsForPeriod.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).map((event) => {
                      const isPendingAdd = 'tempId' in event;
                      const isPendingUpdate = pendingChanges?.calendarEvents.toUpdate.some(e => e.id === event.id);
                      const isPendingDelete = pendingChanges?.calendarEvents.toDelete.includes(event.id);
                      const participantName = getParticipantName(event);
                      const staffName = getStaffName(event);

                      return (
                        <div
                          key={event.id || event.tempId}
                          className={`border rounded-xl p-4 transition-all hover:shadow-sm ${
                            isPendingAdd ? 'bg-primary/5 border-primary/20' :
                            isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                            isPendingUpdate ? 'bg-warning/5 border-warning/20' : 'bg-background border-gray-100'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className={`font-bold text-gray-900 ${isPendingDelete ? 'line-through' : ''}`}>
                                  {event.title}
                                </h4>
                                <Badge variant="outline" className={`text-[10px] border-${getTypeColor(event.type)}-200 text-${getTypeColor(event.type)}-700 bg-${getTypeColor(event.type)}-50 uppercase`}>
                                  {event.type}
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] border-${getStatusColor(event.status)}-200 text-${getStatusColor(event.status)}-700 bg-${getStatusColor(event.status)}-50 uppercase`}>
                                  {event.status}
                                </Badge>
                                {isPendingAdd && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">PENDING ADD</Badge>}
                                {isPendingUpdate && <Badge variant="secondary" className="text-[10px] bg-warning/10 text-warning border-0">PENDING UPDATE</Badge>}
                                {isPendingDelete && <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-0">PENDING DELETE</Badge>}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="size-3.5 text-gray-400" />
                                  <span className="font-medium text-gray-700">{format(new Date(event.event_date), 'MMMM d, yyyy')}</span>
                                </div>
                                {event.start_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-700">{event.start_time} {event.end_time && `- ${event.end_time}`}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-gray-400" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                                {participantName && (
                                  <div className="flex items-center gap-2">
                                    <Users className="size-3.5 text-gray-400" />
                                    <span>Participant: <span className="font-medium text-gray-700">{participantName}</span></span>
                                  </div>
                                )}
                              </div>
                              {event.description && <p className="mt-3 text-xs text-gray-600 border-l-2 border-gray-100 pl-3">{event.description}</p>}
                            </div>
                            
                            <div className="flex gap-1 ml-4 shrink-0">
                              {!isPendingDelete && (
                                <>
                                  <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEditEvent(event)}>
                                    <Edit className="size-3.5" />
                                  </Button>
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-destructive"
                                      onClick={() => handleDeleteEvent(event)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {(isPendingAdd || isPendingUpdate || isPendingDelete) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[10px] font-bold"
                                  onClick={() => {
                                    if (isPendingAdd) handleCancelPendingAdd(event.tempId!);
                                    else if (isPendingUpdate) handleCancelPendingUpdate(event.id);
                                    else handleCancelPendingDelete(event.id);
                                  }}
                                >
                                  UNDO
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
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
                <Label htmlFor="participant_id">Participant</Label>
                <Select value={formData.participant_id || "none"} onValueChange={(value) => setFormData({ ...formData, participant_id: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_staff_id">Assigned Staff</Label>
                <Select value={formData.assigned_staff_id || "none"} onValueChange={(value) => setFormData({ ...formData, assigned_staff_id: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
