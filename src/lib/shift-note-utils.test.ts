import { describe, it, expect } from 'vitest';
import { generateShiftNoteReferenceId } from './shift-note-utils';

describe('generateShiftNoteReferenceId', () => {
  it('generates correct Reference ID for a standard note with participant', () => {
    const result = generateShiftNoteReferenceId({
      startDate: '2026-06-07',
      shiftTime: '14:00:00',
      staffName: 'Julian Gibbings',
      participantName: 'John Doe',
      orgPrefix: 'SC'
    });
    expect(result).toBe('SC-20260607-1400-JD');
  });

  it('generates correct Reference ID for a general house note (no participant)', () => {
    const result = generateShiftNoteReferenceId({
      startDate: '2026-06-07',
      shiftTime: '08:30:00',
      staffName: 'Julian Gibbings',
      participantName: null,
      orgPrefix: 'SC'
    });
    expect(result).toBe('SC-20260607-0830-GH');
  });

  it('handles missing or empty names and parameters gracefully', () => {
    const result = generateShiftNoteReferenceId({
      startDate: null,
      shiftTime: null,
      staffName: '',
      participantName: '',
      orgPrefix: 'SC'
    });
    expect(result).toBe('SC-00000000-0000-GH');
  });

  it('handles short or non-standard time and date formats correctly', () => {
    const result = generateShiftNoteReferenceId({
      startDate: ' 2026-6-7 ',
      shiftTime: '8:30 PM',
      staffName: 'Julian Gibbings',
      participantName: 'John Doe',
      orgPrefix: 'SC'
    });
    expect(result).toBe('SC-00000000-0830-JD');
  });

  it('supports custom organization prefixes', () => {
    const result = generateShiftNoteReferenceId({
      startDate: '2026-06-07',
      shiftTime: '22:00:00',
      staffName: 'Julian Gibbings',
      participantName: 'Bob Builder',
      orgPrefix: 'XYZ'
    });
    expect(result).toBe('XYZ-20260607-2200-BB');
  });
});
