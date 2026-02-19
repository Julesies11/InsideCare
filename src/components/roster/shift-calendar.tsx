import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ShiftCard, ShiftCardData } from './shift-card';
import { generateMonthDays, generateWeekDays, ViewMode } from './roster-utils';

interface ShiftCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  shifts: ShiftCardData[];
  loading: boolean;
  canEdit: boolean;
  onAddShift: (date: Date) => void;
  onEditShift: (shift: ShiftCardData) => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
}

export function ShiftCalendar({
  staffId,
  viewMode,
  currentDate,
  shifts,
  loading,
  canEdit,
  onAddShift,
  onEditShift,
  onWriteNote,
  onNotesClick,
}: ShiftCalendarProps) {
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => 
      isSameDay(parseISO(shift.shift_date), date)
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
                  {dayShifts.map(shift => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      compact={true}
                      showStaffName={staffId === 'all'}
                      onClick={() => canEdit && onEditShift(shift)}
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

  const renderWeekView = () => {
    const days = generateWeekDays(currentDate);

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
                {dayShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    compact={false}
                    showStaffName={staffId === 'all'}
                    onClick={() => canEdit && onEditShift(shift)}
                    onWriteNote={onWriteNote}
                    onNotesClick={onNotesClick}
                  />
                ))}
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
              onClick={(e) => {
                e.stopPropagation();
                onAddShift(currentDate);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {todayShifts.length > 0 ? (
          <div className="grid gap-4">
            {todayShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                compact={false}
                showStaffName={staffId === 'all'}
                onClick={() => canEdit && onEditShift(shift)}
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
