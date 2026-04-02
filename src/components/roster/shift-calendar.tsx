import { Button } from '@/components/ui/button';
import { Plus, Zap, Trash2 } from 'lucide-react';
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
  staffList?: Array<{ id: string; name: string }>;
  onQuickAssign?: (shiftId: string, staffId: string) => void;
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
  staffList,
  onQuickAssign,
}: ShiftCalendarProps) {
  const sortShifts = (shiftsToSort: ShiftCardData[]) => {
    return [...shiftsToSort].sort((a, b) => {
      const startA = a.start_time || '00:00';
      const startB = b.start_time || '00:00';
      if (startA !== startB) return startA.localeCompare(startB);
      
      const endA = a.end_time || '00:00';
      const endB = b.end_time || '00:00';
      return endA.localeCompare(endB);
    });
  };

  const getShiftsForDate = (date: Date) => {
    const filtered = shifts.filter(shift =>
      shift.start_date && isSameDay(parseISO(shift.start_date), date)
    );
    return sortShifts(filtered);
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
    const filtered = shifts.filter(shift =>
      shift.house?.id === houseId && shift.start_date && isSameDay(parseISO(shift.start_date), date)
    );
    return sortShifts(filtered);
  };

  const checkForDoubleBookings = (staffId: string, date: Date, excludeShiftId?: string) => {
    const staffShifts = shifts.filter(shift => 
      shift.staff_id === staffId && 
      shift.start_date && isSameDay(parseISO(shift.start_date), date) &&
      shift.id !== excludeShiftId
    );
    return staffShifts.length > 0;
  };

  const renderShiftCardWithWarning = (
    shift: ShiftCardData, 
    date: Date, 
    compact: boolean = true, 
    showHouseName: boolean = true,
    customStaffList?: Array<{ id: string; name: string }>
  ) => {
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
          showHouseName={showHouseName}
          onClick={() => onEditShift(shift)}
          onWriteNote={onWriteNote}
          onNotesClick={onNotesClick}
          staffList={customStaffList !== undefined ? customStaffList : staffList}
          onQuickAssign={onQuickAssign}
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
            <div key={day} className="text-center font-medium text-sm p-2 uppercase tracking-tighter text-muted-foreground/60">
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
                className={`min-h-[120px] p-2 border rounded-xl group relative transition-all ${
                  !isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-card'
                } ${isToday ? 'ring-2 ring-primary border-primary/20 shadow-lg shadow-primary/5' : 'hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs font-black ${!isCurrentMonth ? 'text-muted-foreground' : (isToday ? 'text-primary' : 'text-gray-500')}`}>
                    {format(day, 'd')}
                  </div>
                  {canEdit && isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 text-primary hover:bg-primary/10"
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
                  {dayShifts.map(shift => renderShiftCardWithWarning(shift, day, true, !groupByHouse))}
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
            <div key={index} className="space-y-3">
              <div className={`text-center p-3 rounded-xl group relative border transition-all ${isToday ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/30 border-gray-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE')}
                </p>
                <p className="text-xl font-black">
                  {format(day, 'd')}
                </p>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/5 text-primary'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddShift(day);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {getLeaveForDate(day).map(leave => (
                  <LeaveBlockBadge key={leave.id} leave={leave} />
                ))}
                {dayShifts.map(shift => renderShiftCardWithWarning(shift, day, false, !groupByHouse))}
                {dayShifts.length === 0 && getLeaveForDate(day).length === 0 && (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                    <span className="text-[10px] font-medium text-muted-foreground italic uppercase tracking-widest opacity-40">No shifts</span>
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
      <div className="space-y-2 overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 border-b border-gray-100 pb-3 mb-2 px-1">
            <div className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 self-end pb-1">Location</div>
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={index} className={cn(
                  "text-center font-medium p-2 rounded-xl transition-all",
                  isToday ? "bg-primary/5 border border-primary/10 shadow-sm" : ""
                )}>
                  <div className={cn(
                    "text-[10px] uppercase font-black tracking-widest mb-1",
                    isToday ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {weekDays[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div className={cn(
                    "text-xl font-black leading-none",
                    isToday ? "text-primary" : "text-gray-900"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2">
            {allHouses.map((house) => {
              // Filter staff assigned to this house (active assignment = no end_date)
              const houseStaffList = house.id.toLowerCase() === 'unassigned' 
                ? staffList 
                : staffList?.filter(s => (s as any).house_assignments?.some((a: any) => 
                    a.house_id.toLowerCase() === house.id.toLowerCase() && !a.end_date
                  )) || [];

              return (
                <div key={house.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 border-b border-gray-50 hover:bg-gray-50/30 transition-all rounded-xl p-1 group/row">
                  <div className="font-black text-xs p-4 bg-muted/20 flex flex-col gap-3 justify-center rounded-xl border border-transparent group-hover/row:border-gray-100 transition-all">
                    <span className="truncate text-gray-900 uppercase tracking-tight">{house.name}</span>
                    <div className="flex flex-col gap-1.5">
                      {canEdit && house.id !== 'unassigned' && onPopulateRoster && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[9px] font-black px-2 gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white bg-white shadow-sm w-full justify-start transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPopulateRoster(house.id);
                          }}
                        >
                          <Zap className="size-3 fill-primary/20 group-hover:fill-white/20" />
                          POPULATE
                        </Button>
                      )}
                      {canEdit && house.id !== 'unassigned' && onBulkAction && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[9px] font-black px-2 gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white bg-white shadow-sm w-full justify-start transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBulkAction(house.id);
                          }}
                        >
                          <Trash2 className="size-3" />
                          DELETE
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {days.map((day, dayIndex) => {
                    const houseShifts = house.id === 'unassigned' 
                      ? sortShifts(shifts.filter(shift => shift.start_date && !shift.house && isSameDay(parseISO(shift.start_date), day)))
                      : getShiftsForHouseAndDate(house.id, day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "min-h-[100px] p-2 border border-transparent rounded-xl group/cell relative transition-all",
                          isToday ? "bg-primary/[0.02] ring-1 ring-primary/10" : "hover:bg-white hover:shadow-sm hover:border-gray-100"
                        )}
                      >
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover/cell:opacity-100 transition-opacity absolute top-1.5 right-1.5 bg-primary/5 text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddShift(day, house.id === 'unassigned' ? undefined : house.id);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        
                        <div className="space-y-1.5">
                          {houseShifts.map(shift => renderShiftCardWithWarning(shift, day, true, false, houseStaffList))}
                          {houseShifts.length === 0 && (
                            <div className="text-center py-6 opacity-0 group-hover/cell:opacity-20 transition-opacity">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Empty</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
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
