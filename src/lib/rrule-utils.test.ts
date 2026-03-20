import { describe, it, expect } from 'vitest';
import { expandRRule, parseRRule, generateRRule } from './rrule-utils';
import { parseISO } from 'date-fns';

describe('rrule-utils', () => {
  describe('parseRRule', () => {
    it('should parse a daily rrule string correctly', () => {
      const startDate = parseISO('2026-03-01T00:00:00');
      const rrule = 'FREQ=DAILY;INTERVAL=1';
      const options = parseRRule(rrule, startDate);
      expect(options.freq).toBe('DAILY');
      expect(options.interval).toBe(1);
    });

    it('should parse a weekly rrule with days correctly', () => {
      const startDate = parseISO('2026-03-01T00:00:00');
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const options = parseRRule(rrule, startDate);
      expect(options.freq).toBe('WEEKLY');
      expect(options.byDay).toEqual(['MO', 'WE', 'FR']);
    });
  });

  describe('generateRRule', () => {
    it('should generate a correct daily rrule string', () => {
      const rrule = generateRRule({ freq: 'DAILY', interval: 1 });
      expect(rrule).toBe('FREQ=DAILY');
    });

    it('should generate a correct weekly rrule string with days', () => {
      const rrule = generateRRule({ freq: 'WEEKLY', byDay: ['MO', 'WE'] });
      expect(rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE');
    });
  });

  describe('expandRRule', () => {
    it('should expand daily rule for a given range', () => {
      const startDate = parseISO('2026-03-17T00:00:00'); // A Tuesday
      const rangeStart = parseISO('2026-03-17T00:00:00');
      const rangeEnd = parseISO('2026-03-20T00:00:00');
      
      const dates = expandRRule('FREQ=DAILY', startDate, rangeStart, rangeEnd);
      
      // Expected: 17, 18, 19, 20
      expect(dates).toHaveLength(4);
      expect(dates[0].getDate()).toBe(17);
      expect(dates[3].getDate()).toBe(20);
    });

    it('should expand weekly rule for specific days', () => {
      const startDate = parseISO('2026-03-16T00:00:00'); // Monday
      const rangeStart = parseISO('2026-03-16T00:00:00');
      const rangeEnd = parseISO('2026-03-30T00:00:00'); // 2 weeks later
      
      const dates = expandRRule('FREQ=WEEKLY;BYDAY=MO', startDate, rangeStart, rangeEnd);
      
      // Expected: 16, 23, 30
      expect(dates).toHaveLength(3);
      expect(dates[0].getDate()).toBe(16);
      expect(dates[1].getDate()).toBe(23);
      expect(dates[2].getDate()).toBe(30);
    });

    it('should respect the rangeStart filter', () => {
      const startDate = parseISO('2026-03-01T00:00:00');
      const rangeStart = parseISO('2026-03-20T00:00:00');
      const rangeEnd = parseISO('2026-03-25T00:00:00');
      
      const dates = expandRRule('FREQ=DAILY', startDate, rangeStart, rangeEnd);
      
      // Expected: 20, 21, 22, 23, 24, 25
      expect(dates).toHaveLength(6);
      expect(dates[0].getDate()).toBe(20);
    });
  });
});
