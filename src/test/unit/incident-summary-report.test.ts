import { describe, expect, it } from 'vitest';
import { getPreviousPeriod } from '../../pages/admin/reporting/incident-summary-report-page';

describe('Incident Summary Report Date Helpers', () => {
  describe('getPreviousPeriod', () => {
    it('returns the previous month for monthly periodType', () => {
      const from = new Date(2026, 5, 1); // June 1st, 2026
      const to = new Date(2026, 5, 30); // June 30th, 2026
      const prev = getPreviousPeriod(from, to, 'monthly');

      expect(prev.from.getFullYear()).toBe(2026);
      expect(prev.from.getMonth()).toBe(4); // May (0-indexed, so 4 is May)
      expect(prev.to.getMonth()).toBe(4); // May
    });

    it('returns the previous quarter for quarterly periodType', () => {
      const from = new Date(2026, 3, 1); // Q2: April 1st, 2026
      const to = new Date(2026, 5, 30); // Q2: June 30th, 2026
      const prev = getPreviousPeriod(from, to, 'quarterly');

      expect(prev.from.getFullYear()).toBe(2026);
      expect(prev.from.getMonth()).toBe(0); // Q1: January
      expect(prev.to.getMonth()).toBe(2); // Q1: March
    });

    it('returns the previous year for calendar-year periodType', () => {
      const from = new Date(2026, 0, 1); // Jan 1st, 2026
      const to = new Date(2026, 11, 31); // Dec 31st, 2026
      const prev = getPreviousPeriod(from, to, 'calendar-year');

      expect(prev.from.getFullYear()).toBe(2025);
      expect(prev.to.getFullYear()).toBe(2025);
    });

    it('returns the previous year for financial-year periodType', () => {
      const from = new Date(2026, 6, 1); // FY2026-2027 Start: July 1st, 2026
      const to = new Date(2027, 5, 30); // FY2026-2027 End: June 30th, 2027
      const prev = getPreviousPeriod(from, to, 'financial-year');

      expect(prev.from.getFullYear()).toBe(2025);
      expect(prev.from.getMonth()).toBe(6); // July
      expect(prev.to.getFullYear()).toBe(2026);
      expect(prev.to.getMonth()).toBe(5); // June
    });

    it('returns previous matching range of days for custom periodType', () => {
      const from = new Date(2026, 5, 10); // June 10th, 2026
      const to = new Date(2026, 5, 19); // June 19th, 2026 (10 days duration)
      const prev = getPreviousPeriod(from, to, 'custom');

      // Previous range should be May 31st to June 9th
      expect(prev.from.getFullYear()).toBe(2026);
      expect(prev.from.getMonth()).toBe(4); // May
      expect(prev.from.getDate()).toBe(31);

      expect(prev.to.getFullYear()).toBe(2026);
      expect(prev.to.getMonth()).toBe(5); // June
      expect(prev.to.getDate()).toBe(9);
    });
  });
});
