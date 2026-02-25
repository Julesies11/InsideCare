import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format, isSameDay, isSameMonth, parseISO, isWithinInterval } from 'date-fns';
import { ShiftCard, ShiftCardData } from './shift-card';
import { generateMonthDays, generateWeekDays, ViewMode } from './roster-utils';
import { LeaveBlock } from '@/pages/roster-board/components/staff-roster-calendar';

interface ShiftCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  shifts: ShiftCardData[];
  loading: boolean;
  canEdit: boolean;
  leaveBlocks?: LeaveBlock[];
  onAddShift: (date: Date) => void;
  onEditShift: (shift: ShiftCardData) => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
  groupByHouse?: boolean;
  houses?: Array<{ id: string; name: string }>;
}

function LeaveBlockBadge({ leave }: { leave: LeaveBlock }) {
  const isPending = leave.status === 'pending';
  return (
    <div
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${
        isPending
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          : 'bg-gray-100 text-gray-600 border border-gray-300'
      }`}
      title={`${leave.leave_type_name} (${leave.status})`}
    >
      {isPending ? '⏳' : '🏖'} {leave.leave_type_name}
    </div>
  );
}

export function ShiftCalendar({
  staffId,
  viewMode,
  currentDate,
  shifts,
  loading,
  canEdit,
  leaveBlocks = [],
  onAddShift,
  onEditShift,
  onWriteNote,
  onNotesClick,
  groupByHouse = false,
  houses = [],
}: ShiftCalendarProps) {
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift =>
      isSameDay(parseISO(shift.shift_date), date)
    );
  };

  const getLeaveForDate = (date: Date) => {
    return leaveBlocks.filter(leave => {
      try {
        return isWithinInterval(date, {
          start: parseISO(leave.start_date),
          end: parseISO(leave.end_date),
        });
      } catch { return false; }
    });
  };

  const getShiftsForHouseAndDate = (houseId: string, date: Date) => {
    return shifts.filter(shift =>
      shift.house?.id === houseId && isSameDay(parseISO(shift.shift_date), date)
    );
  };

  const checkForDoubleBookings = (staffId: string, date: Date, excludeShiftId?: string) => {
    const staffShifts = shifts.filter(shift => 
      shift.staff_id === staffId && 
      isSameDay(parseISO(shift.shift_date), date) &&
      shift.id !== excludeShiftId &&
      shift.status !== 'Cancelled' // Ignore cancelled shifts
    );
    return staffShifts.length > 0;
  };

  const renderMonthView = () => {
    const days = generateMonthDays(currentDate);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (groupByHouse && houses.length > 0) {
      return renderHouseGroupedMonthView(days, weekDays);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-sm p-2">
              {day}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddShift(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {getLeaveForDate(day).map(leave => (
                    <LeaveBlockBadge key={leave.id} leave={leave} />
                  ))}
                  {dayShifts.map(shift => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      compact={true}
                      showStaffName={staffId === 'all'}
                      onClick={() => onEditShift(shift)}
                      onWriteNote={onWriteNote}
                      onNotesClick={onNotesClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHouseGroupedMonthView = (days: Date[], weekDays: string[]) => {
    // Group days by weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    // Add 'Unassigned' house to the list if there are any unassigned shifts
    const allHouses = [...houses];
    const hasUnassignedShifts = shifts.some(shift => !shift.house);
    if (hasUnassignedShifts) {
      allHouses.push({ id: 'unassigned', name: 'Unassigned' });
    }

    return (
      <div className="space-y-2">
        {/* Week headers */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="space-y-1">
            {/* Week day headers */}
            <div className="grid grid-cols-8 gap-1 border-b pb-2">
              <div className="font-medium text-sm p-2">House</div>
              {weekDays.map(day => (
                <div key={day} className="text-center font-medium text-sm p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* House rows for this week */}
            {allHouses.map((house) => (
              <div key={house.id} className="grid grid-cols-8 gap-1 border-b">
                {/* House name column */}
                <div className="font-medium text-sm p-2 bg-muted/50 rounded">
                  {house.name}
                </div>
                
                {/* Day columns for this house */}
                {week.map((day, dayIndex) => {
                  const houseShifts = house.id === 'unassigned' 
                    ? shifts.filter(shift => !shift.house && isSameDay(parseISO(shift.shift_date), day))
                    : getShiftsForHouseAndDate(house.id, day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[80px] p-1 border rounded-lg group relative ${
                        !isCurrentMonth ? 'bg-muted/30' : 'bg-card'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        {canEdit && isCurrentMonth && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-3 w-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddShift(day);
                            }}
                          >
                            <Plus className="h-2 w-2" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {houseShifts.map(shift => {
                          const hasDoubleBooking = shift.staff_id ? 
                            checkForDoubleBookings(shift.staff_id, day, shift.id) : false;
                          
                          return (
                            <div key={shift.id} className={hasDoubleBooking ? 'relative' : ''}>
                              {hasDoubleBooking && (
                                <div className="absolute -top-1 -right-1 z-10">
                                  <div className="bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center" title="Double booking detected!">
                                    !
                                  </div>
                                </div>
                              )}
                              <ShiftCard
                                shift={shift}
                                compact={true}
                                showStaffName={true}
                                onClick={() => onEditShift(shift)}
                                onWriteNote={onWriteNote}
                                onNotesClick={onNotesClick}
                              />
                            </div>
                          );
                        })}
                        
                        {houseShifts.length === 0 && (
                          <div className="text-center py-0 text-muted-foreground text-xs">
                            No shifts
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateWeekDays(currentDate);

    if (groupByHouse && houses.length > 0) {
      return renderHouseGroupedWeekView(days);
    }

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
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddShift(day);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {getLeaveForDate(day).map(leave => (
                  <LeaveBlockBadge key={leave.id} leave={leave} />
                ))}
                {dayShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    compact={false}
                    showStaffName={staffId === 'all'}
                    onClick={() => onEditShift(shift)}
                    onWriteNote={onWriteNote}
                    onNotesClick={onNotesClick}
                  />
                ))}
                {dayShifts.length === 0 && getLeaveForDate(day).length === 0 && (
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

  const renderHouseGroupedWeekView = (days: Date[]) => {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Add 'Unassigned' house to the list if there are any unassigned shifts
    const allHouses = [...houses];
    const hasUnassignedShifts = shifts.some(shift => !shift.house);
    if (hasUnassignedShifts) {
      allHouses.push({ id: 'unassigned', name: 'Unassigned' });
    }
    
    return (
      <div className="space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-8 gap-1 border-b pb-2">
          <div className="font-medium text-sm p-2">House</div>
          {days.map((day, index) => (
            <div key={index} className="text-center font-medium text-sm p-2">
              <div>{weekDays[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        
        {/* House rows */}
        {allHouses.map((house) => (
          <div key={house.id} className="grid grid-cols-8 gap-1 border-b">
            {/* House name column */}
            <div className="font-medium text-sm p-2 bg-muted/50 rounded">
              {house.name}
            </div>
            
            {/* Day columns for this house */}
            {days.map((day, dayIndex) => {
              const houseShifts = house.id === 'unassigned' 
                ? shifts.filter(shift => !shift.house && isSameDay(parseISO(shift.shift_date), day))
                : getShiftsForHouseAndDate(house.id, day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={dayIndex}
                  className={`min-h-[80px] p-1 border rounded-lg group relative ${
                    isToday ? 'ring-2 ring-primary' : 'bg-card'
                  }`}
                >
                  <div className="space-y-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddShift(day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {houseShifts.map(shift => {
                      const hasDoubleBooking = shift.staff_id ? 
                        checkForDoubleBookings(shift.staff_id, day, shift.id) : false;
                      
                      return (
                        <div key={shift.id} className={hasDoubleBooking ? 'relative' : ''}>
                          {hasDoubleBooking && (
                            <div className="absolute -top-1 -right-1 z-10">
                              <div className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title="Double booking detected!">
                                !
                              </div>
                            </div>
                          )}
                          <ShiftCard
                            shift={shift}
                            compact={true}
                            showStaffName={true}
                            onClick={() => onEditShift(shift)}
                            onWriteNote={onWriteNote}
                            onNotesClick={onNotesClick}
                          />
                        </div>
                      );
                    })}
                    
                    {houseShifts.length === 0 && (
                      <div className="text-center py-1 text-muted-foreground text-xs">
                        No shifts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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
              onClick={(e) => {
                e.stopPropagation();
                onAddShift(currentDate);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {getLeaveForDate(currentDate).length > 0 && (
          <div className="space-y-2">
            {getLeaveForDate(currentDate).map(leave => (
              <LeaveBlockBadge key={leave.id} leave={leave} />
            ))}
          </div>
        )}
        {todayShifts.length > 0 ? (
          <div className="grid gap-4">
            {todayShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                compact={false}
                showStaffName={staffId === 'all'}
                onClick={() => onEditShift(shift)}
                onWriteNote={onWriteNote}
                onNotesClick={onNotesClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No shifts scheduled for today
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddShift(currentDate);
                }}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading shifts...</div>
      </div>
    );
  }

  if (viewMode === 'month') {
    return renderMonthView();
  } else if (viewMode === 'week') {
    return renderWeekView();
  } else {
    return renderTodayView();
  }
}
