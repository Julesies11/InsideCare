import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Plus, User, Users, Trash2 } from 'lucide-react';
import { useStaffShifts, StaffShift } from '@/hooks/useStaffShifts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameDay, isSameMonth, parseISO } from 'date-fns';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

type ViewMode = 'today' | 'week' | 'month';

interface House {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    house_id: '',
    shift_type: 'SIL',
    status: 'Scheduled',
    notes: '',
    participant_ids: [] as string[],
  });

  const { getStaffShifts, createShift, updateShift, deleteShift, addShiftParticipant, removeShiftParticipant, calculateDuration } = useStaffShifts();

  useEffect(() => {
    loadHouses();
    loadParticipants();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [staffId, currentDate, viewMode]);

  const loadHouses = async () => {
    const { data, error } = await supabase
      .from('houses')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setHouses(data);
    }
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setParticipants(data);
    }
  };

  const loadShifts = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const { data, error } = await getStaffShifts(staffId, startDate, endDate);
    
    if (error) {
      toast.error('Failed to load shifts');
      console.error(error);
    } else {
      setShifts(data || []);
    }
    setLoading(false);
  };

  const getDateRange = () => {
    let startDate: string;
    let endDate: string;

    if (viewMode === 'today') {
      startDate = format(currentDate, 'yyyy-MM-dd');
      endDate = format(currentDate, 'yyyy-MM-dd');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      startDate = format(weekStart, 'yyyy-MM-dd');
      endDate = format(weekEnd, 'yyyy-MM-dd');
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      startDate = format(calendarStart, 'yyyy-MM-dd');
      endDate = format(calendarEnd, 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTypeFilter === 'all' || shift.shift_type === shiftTypeFilter;
      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
      return matchesHouse && matchesType && matchesStatus;
    });
  }, [shifts, houseFilter, shiftTypeFilter, statusFilter]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const handleSaveShift = async () => {
    if (!formData.shift_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedShift) {
      const updates = {
        shift_date: formData.shift_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        house_id: formData.house_id || null,
        shift_type: formData.shift_type,
        status: formData.status,
        notes: formData.notes || null,
      };

      const { error } = await updateShift(selectedShift.id, updates);

      if (error) {
        toast.error('Failed to update shift');
        console.error(error);
        return;
      }

      const existingParticipantIds = selectedShift.participants?.map(p => p.id) || [];
      const toAdd = formData.participant_ids.filter(id => !existingParticipantIds.includes(id));
      const toRemove = existingParticipantIds.filter(id => !formData.participant_ids.includes(id));

      for (const participantId of toAdd) {
        await addShiftParticipant(selectedShift.id, participantId);
      }

      for (const participantId of toRemove) {
        await removeShiftParticipant(selectedShift.id, participantId);
      }

      toast.success('Shift updated successfully');
    } else {
      const shiftData = {
        staff_id: staffId,
        shift_date: formData.shift_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        house_id: formData.house_id || null,
        shift_type: formData.shift_type,
        status: formData.status,
        notes: formData.notes || null,
      };

      const { data, error } = await createShift(shiftData);

      if (error) {
        toast.error('Failed to create shift');
        console.error(error);
        return;
      }

      if (data && formData.participant_ids.length > 0) {
        for (const participantId of formData.participant_ids) {
          await addShiftParticipant(data.id, participantId);
        }
      }

      toast.success('Shift created successfully');
    }

    setShowShiftDialog(false);
    setSelectedShift(null);
    setSelectedDate(null);
    resetForm();
    loadShifts();
  };


  const handleDeleteShift = async () => {
    if (!selectedShift) return;

    const { error } = await deleteShift(selectedShift.id);

    if (error) {
      toast.error('Failed to delete shift');
      console.error(error);
      return;
    }

    toast.success('Shift deleted successfully');
    setShowShiftDialog(false);
    setSelectedShift(null);
    setSelectedDate(null);
    resetForm();
    loadShifts();
  };

  const resetForm = () => {
    setFormData({
      shift_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      house_id: '',
      shift_type: 'SIL',
      status: 'Scheduled',
      notes: '',
      participant_ids: [],
    });
  };

  const openEditDialog = (shift: StaffShift, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedShift(shift);
    setFormData({
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      house_id: shift.house_id || '',
      shift_type: shift.shift_type,
      status: shift.status,
      notes: shift.notes || '',
      participant_ids: shift.participants?.map(p => p.id) || [],
    });
    setShowShiftDialog(true);
  };

  const openAddDialog = (date: Date, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedDate(date);
    setSelectedShift(null);
    setFormData({
      shift_date: format(date, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      house_id: '',
      shift_type: 'SIL',
      status: 'Scheduled',
      notes: '',
      participant_ids: [],
    });
    setShowShiftDialog(true);
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'SIL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Community': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Cancelled': return 'destructive';
      case 'No Show': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDuration = (hours: number) => {
    return hours % 1 === 0 ? `${hours}h` : `${hours}h`;
  };

  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  const getShiftsForDate = (date: Date) => {
    return filteredShifts.filter(shift => 
      isSameDay(parseISO(shift.shift_date), date)
    );
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const renderShiftCard = (shift: StaffShift, compact: boolean = false) => {
    const duration = shift.duration_hours || calculateDuration(shift.start_time, shift.end_time);

    if (compact) {
      const participantCount = shift.participants?.length || 0;
      
      return (
        <div
          key={shift.id}
          onClick={(e) => canEdit && openEditDialog(shift, e)}
          className="p-1.5 mb-1 bg-card border rounded cursor-pointer hover:bg-accent/50 transition-colors group"
        >
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-medium truncate">
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </span>
            <Badge className={`${getShiftTypeColor(shift.shift_type)} text-[10px] px-1 py-0`}>
              {shift.shift_type}
            </Badge>
          </div>
          {shift.house && (
            <div className="flex items-center gap-1 mb-0.5">
              <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">{shift.house.name}</span>
            </div>
          )}
          {participantCount > 0 && (
            <div className="flex items-center gap-1 mb-0.5">
              {participantCount === 1 ? (
                <User className="h-2.5 w-2.5 text-muted-foreground" />
              ) : (
                <Users className="h-2.5 w-2.5 text-muted-foreground" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {participantCount} participant{participantCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Badge variant={getStatusVariant(shift.status)} className="text-[10px] px-1 py-0">
            {shift.status}
          </Badge>
        </div>
      );
    }

    return (
      <Card
        key={shift.id}
        onClick={(e) => canEdit && openEditDialog(shift, e)}
        className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatDuration(duration)})
              </span>
            </div>
            <Badge className={getShiftTypeColor(shift.shift_type)} variant="secondary">
              {shift.shift_type}
            </Badge>
          </div>
          
          {shift.house && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{shift.house.name}</span>
            </div>
          )}
          
          {shift.participants && shift.participants.length > 0 && (
            <div className="flex items-center gap-2">
              {shift.participants.length === 1 ? (
                <User className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Users className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs">
                {shift.participants.length} participant{shift.participants.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          <Badge variant={getStatusVariant(shift.status)} className="text-xs">
            {shift.status}
          </Badge>
        </div>
      </Card>
    );
  };

  const renderMonthView = () => {
    const days = generateMonthDays();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center p-2 bg-accent/60 rounded-lg">
              <span className="text-sm font-medium">{day}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayShifts = getShiftsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border rounded-lg group relative ${
                  !isCurrentMonth ? 'bg-muted/30' : 'bg-card'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {canEdit && isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => openAddDialog(day, e)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {dayShifts.map(shift => renderShiftCard(shift, true))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateWeekDays();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day, index) => {
          const dayShifts = getShiftsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded-lg group relative ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm font-medium">
                  {format(day, 'EEE')}
                </p>
                <p className="text-lg">
                  {format(day, 'd')}
                </p>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => openAddDialog(day, e)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {dayShifts.map(shift => renderShiftCard(shift, false))}
                {dayShifts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    No shifts
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTodayView = () => {
    const todayShifts = getShiftsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg group relative">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => openAddDialog(currentDate, e)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {todayShifts.length > 0 ? (
          <div className="grid gap-4">
            {todayShifts.map(shift => renderShiftCard(shift, false))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No shifts scheduled for today
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => openAddDialog(currentDate, e)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderShiftDialog = () => {
    const isEdit = selectedShift !== null;

    return (
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update shift details and assignments.' : 'Create a new shift and assign participants.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shift_date">Date</Label>
                <Input
                  id="shift_date"
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="shift_type">Shift Type</Label>
                <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIL">SIL</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
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
              <div>
                <Label htmlFor="house_id">House</Label>
                <Select value={formData.house_id || 'none'} onValueChange={(value) => setFormData({ ...formData, house_id: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {houses.map(house => (
                      <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="participants">Participants</Label>
              <Select
                value={formData.participant_ids[0] || ''}
                onValueChange={(value) => {
                  const currentIds = formData.participant_ids;
                  if (value && !currentIds.includes(value)) {
                    setFormData({ ...formData, participant_ids: [...currentIds, value] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add participants" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map(participant => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.participant_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.participant_ids.map(id => {
                    const participant = participants.find(p => p.id === id);
                    return participant ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {participant.name}
                        <button
                          onClick={() => setFormData({
                            ...formData,
                            participant_ids: formData.participant_ids.filter(pid => pid !== id)
                          })}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {isEdit && (
              <Button variant="destructive" onClick={handleDeleteShift} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveShift}>
              {isEdit ? 'Update' : 'Create'} Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="pb-2.5" id="staff_roster">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Roster
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode('today')} className={viewMode === 'today' ? 'bg-accent' : ''}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewMode('week')} className={viewMode === 'week' ? 'bg-accent' : ''}>
                Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewMode('month')} className={viewMode === 'month' ? 'bg-accent' : ''}>
                Month
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <h3 className="font-semibold">
                  {viewMode === 'today' && format(currentDate, 'MMMM d, yyyy')}
                  {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
                  {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={houseFilter} onValueChange={setHouseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Houses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                {houses.map(house => (
                  <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SIL">SIL</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="No Show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
          ) : (
            <>
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'today' && renderTodayView()}
            </>
          )}
        </div>
      </CardContent>

      {renderShiftDialog()}
    </Card>
  );
}
