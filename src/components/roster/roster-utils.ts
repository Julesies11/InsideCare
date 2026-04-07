import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';

export type ViewMode = 'today' | 'week' | 'month';

/**
 * Returns Tailwind classes for shift cards based on the dynamic color_theme from DB
 */
export function getShiftTheme(colorTheme?: string, shiftTemplateName?: string) {
  const theme = (colorTheme || shiftTemplateName || 'other').toLowerCase();

  if (theme.includes('morning') || theme === 'amber') {
    return 'bg-amber-500/10 text-amber-700 border-amber-200';
  }
  if (theme.includes('day') || theme === 'sky' || theme === 'blue') {
    return 'bg-sky-500/10 text-sky-700 border-sky-200';
  }
  if (theme.includes('night') || theme === 'indigo' || theme === 'purple') {
    return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
  }
  if (theme.includes('afternoon') || theme === 'orange') {
    return 'bg-orange-500/10 text-orange-700 border-orange-200';
  }
  if (theme === 'green' || theme === 'community') {
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
  }

  return 'bg-gray-500/10 text-gray-700 border-gray-200';
}

/** @deprecated Use getShiftTheme instead */
export const getShiftTemplateColor = (type: string): string => {
  return getShiftTheme(undefined, type);
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
