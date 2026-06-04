import { describe, it, expect } from 'vitest';
import { getRowStatus, isPast, isCurrent } from '../../pages/participants/shift-notes/utils/status-utils';
import { ShiftNoteTask } from '../../hooks/use-shift-notes';

describe('Shift Notes Status Logic', () => {
  const mockNow = new Date('2026-06-04T12:00:00');
  
  const baseTask: ShiftNoteTask = {
    id: 'task-1',
    shift_id: 'shift-1',
    participant_id: 'p-1',
    participant_name: 'John Doe',
    staff_id: 's-1',
    staff_name: 'Staff Member',
    house_id: 'h-1',
    house_name: 'House 1',
    start_date: '2026-06-04',
    start_time: '09:00:00',
    end_time: '17:00:00',
    shift_template: 'Day Shift'
  };

  describe('isPast', () => {
    it('returns true for shifts that ended in the past', () => {
      const pastTask = { ...baseTask, start_date: '2026-06-03' };
      expect(isPast(pastTask.start_date, pastTask.end_date, pastTask.end_time, mockNow)).toBe(true);
    });

    it('returns false for shifts that end in the future', () => {
      const futureTask = { ...baseTask, start_date: '2026-06-05' };
      expect(isPast(futureTask.start_date, futureTask.end_date, futureTask.end_time, mockNow)).toBe(false);
    });
  });

  describe('isCurrent', () => {
    it('returns true for shifts currently in progress', () => {
      expect(isCurrent(baseTask.start_date, baseTask.end_date, baseTask.start_time, baseTask.end_time, mockNow)).toBe(true);
    });

    it('returns false for shifts that have not started yet', () => {
      const futureTask = { ...baseTask, start_time: '13:00:00' };
      expect(isCurrent(futureTask.start_date, futureTask.end_date, futureTask.start_time, futureTask.end_time, mockNow)).toBe(false);
    });
  });

  describe('getRowStatus', () => {
    it('returns "Note Submitted" if note_id exists and status is active', () => {
      const task = { ...baseTask, note_id: 'n-1', note_status: 'active' };
      expect(getRowStatus(task, mockNow)).toBe('Note Submitted');
    });

    it('returns "Draft Note" if note_id exists and status is draft', () => {
      const task = { ...baseTask, note_id: 'n-1', note_status: 'draft' };
      expect(getRowStatus(task, mockNow)).toBe('Draft Note');
    });

    it('returns "Missing" if shift is past and no note_id', () => {
      const task = { ...baseTask, start_date: '2026-06-03' };
      expect(getRowStatus(task, mockNow)).toBe('Missing');
    });

    it('returns "Current Shift" if shift is current and no note_id', () => {
      expect(getRowStatus(baseTask, mockNow)).toBe('Current Shift');
    });

    it('returns "Upcoming" if shift is in the future and no note_id', () => {
      const task = { ...baseTask, start_date: '2026-06-05' };
      expect(getRowStatus(task, mockNow)).toBe('Upcoming');
    });
  });
});
