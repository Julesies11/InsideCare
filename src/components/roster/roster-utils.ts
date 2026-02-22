import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';

export type ViewMode = 'today' | 'week' | 'month';

export const getShiftTypeColor = (type: string): string => {
  switch (type) {
    case 'SIL':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'Community':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'Admin':
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'No Show':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const formatTime = (time: string): string => {
  return time.substring(0, 5);
};

export const formatDuration = (hours: number): string => {
  return hours % 1 === 0 ? `${hours}h` : `${hours}h`;
};

export const calculateDuration = (startTime: string, endTime: string, startDate?: string, endDate?: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  let durationMinutes = endMinutes - startMinutes;

  // If dates are provided, use them to calculate cross-day difference
  if (startDate && endDate && startDate !== endDate) {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    durationMinutes = (end.getTime() - start.getTime()) / 60000;
  } else if (durationMinutes < 0) {
    // No dates but end time is before start time — assume next day
    durationMinutes += 24 * 60;
  }

  return Math.round((durationMinutes / 60) * 100) / 100;
};

export const generateMonthDays = (currentDate: Date): Date[] => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;

  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return days;
};

export const generateWeekDays = (currentDate: Date): Date[] => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
};

export const getDateRange = (currentDate: Date, viewMode: ViewMode): { startDate: string; endDate: string } => {
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
