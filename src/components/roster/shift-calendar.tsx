import { Button } from '@/components/ui/button';
import { Plus, Zap, Settings2 } from 'lucide-react';
import { format, isSameDay, isSameMonth, parseISO, isWithinInterval } from 'date-fns';
import { ShiftCard, ShiftCardData } from './shift-card';
import { generateMonthDays, generateWeekDays, ViewMode } from './roster-utils';
import { LeaveBlock } from '@/pages/roster-board/components/staff-roster-calendar';
import { cn } from '@/lib/utils';

export interface ShiftCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  shifts: ShiftCardData[];
  loading: boolean;
  canEdit: boolean;
  leaveBlocks?: LeaveBlock[];
  onAddShift: (date: Date, houseId?: string) => void;
  onEditShift: (shift: ShiftCardData) => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
  onBulkAction?: (houseId: string) => void;
  onPopulateRoster?: (houseId: string) => void;
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
  onBulkAction,
  onPopulateRoster,
  groupByHouse = false,
  houses = [],
}: ShiftCalendarProps) {
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift =>
      shift.start_date && isSameDay(parseISO(shift.start_date), date)
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
      shift.house?.id === houseId && shift.start_date && isSameDay(parseISO(shift.start_date), date)
    );
  };

  const checkForDoubleBookings = (staffId: string, date: Date, excludeShiftId?: string) => {
    const staffShifts = shifts.filter(shift => 
      shift.staff_id === staffId && 
      shift.start_date && isSameDay(parseISO(shift.start_date), date) &&
      shift.id !== excludeShiftId &&
      shift.status !== 'Cancelled'
    );
    return staffShifts.length > 0;
  };

  const renderShiftCardWithWarning = (shift: ShiftCardData, date: Date, compact: boolean = true) => {
    const hasDoubleBooking = shift.staff_id ? 
      checkForDoubleBookings(shift.staff_id, date, shift.id) : false;
    
    return (
      <div key={shift.id} className={hasDoubleBooking ? 'relative' : ''}>
        {hasDoubleBooking && (
          <div className="absolute -top-1 -right-1 z-10">
            <div 
              className={`bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} 
              title="Double booking detected!"
            >
              !
            </div>
          </div>
        )}
        <ShiftCard
          shift={shift}
          compact={compact}
          showStaffName={staffId === 'all' || groupByHouse}
          onClick={() => onEditShift(shift)}
          onWriteNote={onWriteNote}
          onNotesClick={onNotesClick}
        />
      </div>
    );
  };

  const renderMonthView = () => {
    const days = generateMonthDays(currentDate);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
                <div className="space-y-1">
                  {getLeaveForDate(day).map(leave => (
                    <LeaveBlockBadge key={leave.id} leave={leave} />
                  ))}
                  {dayShifts.map(shift => renderShiftCardWithWarning(shift, day))}
                </div>
              </div>
            );
          })}
        </div>
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
                {dayShifts.map(shift => renderShiftCardWithWarning(shift, day, false))}
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
    const allHouses = [...houses];
    if (shifts.some(shift => !shift.house)) {
      allHouses.push({ id: 'unassigned', name: 'Unassigned' });
    }
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-8 gap-1 border-b pb-2">
          <div className="font-medium text-sm p-2 uppercase tracking-widest text-muted-foreground">House</div>
          {days.map((day, index) => (
            <div key={index} className="text-center font-medium text-sm p-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">{weekDays[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
              <div className="text-lg font-black">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        
        {allHouses.map((house) => (
          <div key={house.id} className="grid grid-cols-8 gap-1 border-b hover:bg-gray-50/50 transition-colors">
            <div className="font-bold text-xs p-3 bg-muted/30 flex flex-col gap-2 justify-center rounded-l min-w-[120px]">
              <span className="truncate">{house.name}</span>
              <div className="flex flex-col gap-1.5 mt-1">
                {canEdit && house.id !== 'unassigned' && onPopulateRoster && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-[9px] font-bold px-2 gap-1 border-primary/20 text-primary hover:bg-primary/5 bg-white shadow-sm w-full justify-start"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPopulateRoster(house.id);
                    }}
                  >
                    <Zap className="size-2.5 fill-primary/20" />
                    POPULATE
                  </Button>
                )}
                {canEdit && house.id !== 'unassigned' && onBulkAction && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-[9px] font-bold px-2 gap-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-white shadow-sm w-full justify-start"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBulkAction(house.id);
                    }}
                  >
                    <Settings2 className="size-2.5" />
                    BULK
                  </Button>
                )}
              </div>
            </div>
            
            {days.map((day, dayIndex) => {
              const houseShifts = house.id === 'unassigned' 
                ? shifts.filter(shift => shift.start_date && !shift.house && isSameDay(parseISO(shift.start_date), day))
                : getShiftsForHouseAndDate(house.id, day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "min-h-[80px] p-1 border border-transparent rounded group relative",
                    isToday ? "bg-primary/5 ring-1 ring-primary/20" : "bg-white"
                  )}
                >
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddShift(day, house.id === 'unassigned' ? undefined : house.id);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <div className="space-y-1">
                    {houseShifts.map(shift => renderShiftCardWithWarning(shift, day, true))}
                    {houseShifts.length === 0 && (
                      <div className="text-center py-4 opacity-0 group-hover:opacity-50">
                        <span className="text-[9px] text-muted-foreground italic">Empty</span>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === 'today' ? (
        <div className="grid grid-cols-1 gap-4">
          {getShiftsForDate(currentDate).map(shift => renderShiftCardWithWarning(shift, currentDate, false))}
        </div>
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderMonthView()
      )}
    </div>
  );
}
