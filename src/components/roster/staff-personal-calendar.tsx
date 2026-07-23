import { LeaveBlock } from '@/pages/roster-board/components/staff-roster-calendar';
import { format, isSameDay, isSameMonth } from 'date-fns';
import {
  Calendar as CalendarIcon,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Plus,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { generateMonthDays, generateWeekDays, ViewMode } from './roster-utils';
import { ShiftCard, ShiftCardData } from './shift-card';

export interface StaffPersonalCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  shifts: ShiftCardData[];
  loading: boolean;
  canEdit: boolean;
  leaveBlocks?: LeaveBlock[];
  availabilityBlocks?: any[];
  onAddShift: (date: Date, houseId?: string) => void;
  onEditShift: (shift: ShiftCardData) => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
  staffList?: Array<{ id: string; name: string }>;
  onEditLeave?: (leave: LeaveBlock) => void;
}

function LeaveBlockBadge({
  leave,
  onClick,
}: {
  leave: LeaveBlock;
  onClick?: () => void;
}) {
  const isPending = leave.status === 'pending';
  const reason = leave.reason;
  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium line-clamp-3 whitespace-normal break-words transition-all ${
        onClick ? 'cursor-pointer hover:brightness-95' : ''
      } ${
        isPending
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          : 'bg-gray-100 text-gray-600 border border-gray-300'
      }`}
      title={`${leave.leave_type_name} (${leave.status})${leave.reason ? `: ${leave.reason}` : ''}`}
    >
      {isPending ? '⏳' : '🏖'} {leave.leave_type_name}
      {reason ? ` - ${reason}` : ''}
    </div>
  );
}

function AvailabilityBlockBadge({ block }: { block: any }) {
  const isAvailable = block.is_available;
  const startClean = (block.start_time || '00:00').substring(0, 5);
  const endClean = (block.end_time || '23:59').substring(0, 5);
  const timeLabel =
    startClean === '00:00' && endClean === '23:59'
      ? 'All Day'
      : `${startClean} - ${endClean}`;

  return (
    <div
      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight flex items-start gap-1.5 border leading-tight ${
        isAvailable
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50/50 text-rose-800 border-rose-200'
      }`}
      title={`${isAvailable ? 'Preferred Hours' : 'Unavailable'}${block.notes ? `: ${block.notes}` : ''}`}
    >
      <span className="shrink-0 select-none pt-[1px]">{isAvailable ? '🟢' : '🔴'}</span>
      <span className="whitespace-normal break-words w-full">
        {isAvailable ? 'Preferred' : 'Unavailable'} ({timeLabel})
        {block.notes ? ` - ${block.notes}` : ''}
      </span>
    </div>
  );
}

export function StaffPersonalCalendar({
  staffId,
  viewMode,
  currentDate,
  shifts,
  loading,
  canEdit,
  leaveBlocks = [],
  availabilityBlocks = [],
  onAddShift,
  onEditShift,
  onWriteNote,
  onNotesClick,
  staffList,
  onEditLeave,
}: StaffPersonalCalendarProps) {
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
    const dateStr = format(date, 'yyyy-MM-dd');
    const filtered = shifts.filter(
      (shift) => shift.start_date && shift.start_date === dateStr,
    );
    return sortShifts(filtered);
  };

  const getLeaveForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const filtered = leaveBlocks.filter((leave) => {
      return dateStr >= leave.start_date && dateStr <= leave.end_date;
    });

    // Deduplicate by ID
    const uniqueLeave = Array.from(
      new Map(filtered.map((l) => [l.id, l])).values(),
    );
    return uniqueLeave;
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    const staffBlocks = availabilityBlocks.filter((b) => b.is_active !== false);

    const dateSpecific = staffBlocks.filter(
      (b) =>
        b.type === 'date_specific' &&
        b.start_date &&
        b.end_date &&
        dateStr >= b.start_date &&
        dateStr <= b.end_date,
    );
    if (dateSpecific.length > 0) return dateSpecific;

    // 2. Weekly recurring blocks
    return staffBlocks.filter(
      (b) => b.type === 'recurring' && b.day_of_week === dayOfWeek,
    );
  };

  const getConflictingShifts = (
    staffIdParam: string,
    date: Date,
    excludeShiftId?: string,
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(
      (shift) =>
        shift.staff_id === staffIdParam &&
        shift.start_date &&
        shift.start_date === dateStr &&
        shift.id !== excludeShiftId,
    );
  };

  const renderShiftCardWithWarning = (
    shift: ShiftCardData,
    date: Date,
    compact: boolean = true,
    showHouseName: boolean = true,
  ) => {
    const conflictingShifts = shift.staff_id
      ? getConflictingShifts(shift.staff_id, date, shift.id)
      : [];

    const hasDoubleBooking = conflictingShifts.length > 0;

    return (
      <div key={shift.id} className={hasDoubleBooking ? 'relative' : ''}>
        {hasDoubleBooking && (
          <div className="absolute -top-1 -right-1 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`bg-red-500 text-white text-[10px] rounded-full font-bold flex items-center justify-center cursor-help shadow-sm ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                  >
                    !
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-[250px] p-3 shadow-xl border-red-100"
                >
                  <div className="space-y-2">
                    <p className="font-bold text-red-600 text-xs flex items-center gap-1.5">
                      <span className="bg-red-100 text-red-600 size-4 rounded-full flex items-center justify-center text-[10px]">
                        !
                      </span>
                      Double Booking Warning
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Other shifts rostered on this day:
                    </p>
                    <ul className="space-y-2 pt-1 border-t border-red-50 mt-1">
                      {conflictingShifts.map((conf) => (
                        <li
                          key={conf.id}
                          className="text-[10px] leading-tight flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900">
                              {conf.title || conf.shift_template}
                            </span>
                            <span className="text-gray-500 font-medium">
                              {(conf.start_time || '').slice(0, 5)} -{' '}
                              {(conf.end_time || '').slice(0, 5)}
                            </span>
                          </div>
                          <div className="text-gray-600 italic">
                            {conf.entry_type === 'event'
                              ? conf.location || 'No location'
                              : `at ${conf.house?.house_name || 'Unknown House'}`}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <ShiftCard
          shift={shift}
          compact={compact}
          showStaffName={false}
          showHouseName={showHouseName}
          showChecklists={true}
          onClick={() => onEditShift(shift)}
          onWriteNote={onWriteNote}
          onNotesClick={onNotesClick}
          staffList={staffList}
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
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-sm p-2 uppercase tracking-tighter text-muted-foreground/60"
            >
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
                onClick={() => {
                  if (canEdit && isCurrentMonth) {
                    onAddShift(day);
                  }
                }}
                className={`min-h-[120px] p-2 border rounded-xl group relative transition-all cursor-pointer ${
                  !isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-card'
                } ${isToday ? 'ring-2 ring-primary border-primary/20 shadow-lg shadow-primary/5' : 'hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`text-xs font-black ${!isCurrentMonth ? 'text-muted-foreground' : isToday ? 'text-primary' : 'text-gray-500'}`}
                  >
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
                <div className="space-y-2">
                  {getLeaveForDate(day).map((leave) => (
                    <LeaveBlockBadge
                      key={leave.id}
                      leave={leave}
                      onClick={
                        onEditLeave ? () => onEditLeave(leave) : undefined
                      }
                    />
                  ))}

                  {getAvailabilityForDate(day).map((block) => (
                    <AvailabilityBlockBadge
                      key={block.id || `${block.day_of_week}-${block.start_time}`}
                      block={block}
                    />
                  ))}

                  {dayShifts.map((shift) => (
                    <div key={shift.id} onClick={(e) => e.stopPropagation()}>
                      {renderShiftCardWithWarning(shift, day, true, true)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = (days: Date[]) => {
    return (
      <div
        className={cn(
          'grid gap-4',
          days.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-7',
        )}
      >
        {days.map((day, index) => {
          const dayShifts = getShiftsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={index} className="space-y-3">
              <div
                onClick={() => canEdit && onAddShift(day)}
                className={`text-center p-3 rounded-xl group relative border transition-all cursor-pointer ${isToday ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/30 border-gray-100'}`}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                >
                  {format(day, 'EEE')}
                </p>
                <p className="text-xl font-black">{format(day, 'd')}</p>
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

              <div
                className="space-y-2 min-h-[100px] cursor-pointer"
                onClick={() => canEdit && onAddShift(day)}
              >
                {getLeaveForDate(day).map((leave) => (
                  <LeaveBlockBadge
                    key={leave.id}
                    leave={leave}
                    onClick={onEditLeave ? () => onEditLeave(leave) : undefined}
                  />
                ))}
                {getAvailabilityForDate(day).map((block) => (
                  <AvailabilityBlockBadge
                    key={block.id || `${block.day_of_week}-${block.start_time}`}
                    block={block}
                  />
                ))}
                {dayShifts.map((shift) => (
                  <div key={shift.id} onClick={(e) => e.stopPropagation()}>
                    {renderShiftCardWithWarning(shift, day, false, true)}
                  </div>
                ))}
                {dayShifts.length === 0 &&
                  getLeaveForDate(day).length === 0 && (
                    <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                      <span className="text-[10px] font-medium text-muted-foreground italic uppercase tracking-widest opacity-40">
                        No shifts
                      </span>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
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
      {viewMode === 'today'
        ? renderWeekView([currentDate])
        : viewMode === 'week'
          ? renderWeekView(generateWeekDays(currentDate))
          : renderMonthView()}
    </div>
  );
}
