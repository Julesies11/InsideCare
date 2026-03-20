import { 
  addDays, 
  addWeeks, 
  addMonths, 
  isBefore, 
  isAfter, 
  parseISO, 
  format,
  getDay,
  startOfDay
} from 'date-fns';

/**
 * A simplified RRule expander for the InsideCare app.
 * Focuses on common patterns: Daily, Weekly, Monthly.
 * 
 * RRule Format supported (subset of RFC 5545):
 * - FREQ=DAILY
 * - FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
 * - FREQ=MONTHLY
 */

export interface RRuleOptions {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  byDay?: string[]; // ['MO', 'TU', ...]
  interval?: number;
  startDate: Date;
  endDate?: Date;
  count?: number;
}

const DAY_MAP: Record<string, number> = {
  'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
};

/**
 * Parses a basic RRule string into options.
 */
export function parseRRule(rruleStr: string, startDate: Date): RRuleOptions {
  const parts = Object.fromEntries(
    rruleStr.split(';').map(part => part.split('='))
  );

  return {
    freq: parts.FREQ as any,
    byDay: parts.BYDAY ? parts.BYDAY.split(',') : undefined,
    interval: parts.INTERVAL ? parseInt(parts.INTERVAL) : 1,
    startDate: startDate,
  };
}

/**
 * Expands an RRule into an array of dates within a range.
 */
export function expandRRule(
  rruleStr: string, 
  startDate: Date, 
  rangeStart: Date, 
  rangeEnd: Date,
  maxInstances: number = 100
): Date[] {
  const options = parseRRule(rruleStr, startDate);
  const dates: Date[] = [];
  let current = startOfDay(startDate);
  const end = rangeEnd;

  const rangeStartStr = format(rangeStart, 'yyyy-MM-dd');
  const rangeEndStr = format(rangeEnd, 'yyyy-MM-dd');

  // Safety cap
  let iterations = 0;
  
  while (format(current, 'yyyy-MM-dd') <= rangeEndStr) {
    if (iterations++ > 1000) break;

    const currentStr = format(current, 'yyyy-MM-dd');

    // Only add if it's within our viewing range
    if (currentStr >= rangeStartStr) {
      
      if (options.freq === 'DAILY') {
        dates.push(new Date(current));
      } else if (options.freq === 'WEEKLY') {
        if (!options.byDay || options.byDay.includes(Object.keys(DAY_MAP).find(key => DAY_MAP[key] === getDay(current))!)) {
          dates.push(new Date(current));
        }
      } else if (options.freq === 'MONTHLY') {
        // Simple monthly: same day of month as start date
        if (current.getDate() === startDate.getDate()) {
          dates.push(new Date(current));
        }
      }
    }

    // Increment
    if (options.freq === 'DAILY') {
      current = addDays(current, options.interval || 1);
    } else if (options.freq === 'WEEKLY') {
      current = addDays(current, 1); // Step day by day to check BYDAY
    } else if (options.freq === 'MONTHLY') {
      current = addDays(current, 1); // Step day by day to find the next same-day-of-month
    }

    if (dates.length >= maxInstances) break;
  }

  return dates;
}

/**
 * Generates an RRule string from UI options.
 */
export function generateRRule(options: Partial<RRuleOptions>): string {
  const parts = [`FREQ=${options.freq}`];
  if (options.interval && options.interval > 1) parts.push(`INTERVAL=${options.interval}`);
  if (options.byDay && options.byDay.length > 0) parts.push(`BYDAY=${options.byDay.join(',')}`);
  return parts.join(';');
}
