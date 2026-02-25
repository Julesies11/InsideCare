import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Plus, CalendarDays } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<ViewMode>('month');
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
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => handleAddEvent(new Date())} disabled={!houseId || !canAdd}>
              <Plus className="size-4 me-1.5" />
              Add Event
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
                ←
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {getPeriodLabel()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading calendar events...</div>
          ) : (
            <div className="space-y-4">
              {/* Calendar View Placeholder */}
              <div 
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleAddEvent(new Date())}
              >
                <div className="text-center text-muted-foreground">
                  <Calendar className="size-12 mx-auto mb-2 opacity-50" />
                  <p>Calendar view will be implemented here</p>
                  <p className="text-sm">Showing {getEventsForPeriod.length} events for {getPeriodLabel()}</p>
                  <p className="text-xs mt-2 text-blue-600">Click here to add an event</p>
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-2">
                {getEventsForPeriod.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <Calendar className="size-7 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">No events scheduled for this period</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click "Add Event" to create a new calendar event.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => handleAddEvent(new Date())} disabled={!houseId || !canAdd}>
                        <Plus className="size-4 me-1.5" />
                        Add Event
                      </Button>
                    </div>
                  </div>
                ) : (
                  getEventsForPeriod.map((event) => {
                    const isPendingAdd = 'tempId' in event;
                    const isPendingUpdate = pendingChanges?.calendarEvents.toUpdate.some(e => e.id === event.id);
                    const isPendingDelete = pendingChanges?.calendarEvents.toDelete.includes(event.id);
                    const participantName = getParticipantName(event);
                    const staffName = getStaffName(event);

                    return (
                      <div
                        key={event.id || event.tempId}
                        className={`border rounded-lg p-3 ${
                          isPendingAdd ? 'bg-primary/5 border-primary/20' :
                          isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                          isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                                {event.title}
                              </h4>
                              <Badge variant="outline" className={`text-xs border-${getTypeColor(event.type)}-500 text-${getTypeColor(event.type)}-700`}>
                                {event.type}
                              </Badge>
                              <Badge variant="outline" className={`text-xs border-${getStatusColor(event.status)}-500 text-${getStatusColor(event.status)}-700`}>
                                {event.status}
                              </Badge>
                              {isPendingAdd && (
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Pending add
                                </span>
                              )}
                              {isPendingUpdate && (
                                <span className="text-xs text-warning flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Pending update
                                </span>
                              )}
                              {isPendingDelete && (
                                <span className="text-xs text-destructive flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Pending deletion
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="size-4" />
                                {format(new Date(event.event_date), 'MMM d, yyyy')}
                                {event.start_time && (
                                  <>
                                    <Clock className="size-4 ml-2" />
                                    {event.start_time}
                                    {event.end_time && ` - ${event.end_time}`}
                                  </>
                                )}
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="size-4" />
                                  {event.location}
                                </div>
                              )}
                              
                              {participantName && (
                                <div className="flex items-center gap-2">
                                  <Users className="size-4" />
                                  Participant: {participantName}
                                </div>
                              )}
                              
                              {staffName && (
                                <div className="flex items-center gap-2">
                                  <Users className="size-4" />
                                  Staff: {staffName}
                                </div>
                              )}
                              
                              {event.description && (
                                <div>{event.description}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            {!isPendingDelete && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                                  <Edit className="size-4" />
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleDeleteEvent(event)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            {isPendingAdd && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelPendingAdd(event.tempId!)}
                              >
                                Remove
                              </Button>
                            )}
                            {isPendingUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelPendingUpdate(event.id)}
                              >
                                Undo
                              </Button>
                            )}
                            {isPendingDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelPendingDelete(event.id)}
                              >
                                Undo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
