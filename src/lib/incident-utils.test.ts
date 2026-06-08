import { describe, it, expect } from 'vitest';
import { generateIncidentReferenceId } from './incident-utils';

describe('generateIncidentReferenceId', () => {
  it('generates correct Reference ID for a standard incident date and participant', () => {
    const result = generateIncidentReferenceId({
      incidentDate: '2026-06-08T14:22:00.000Z',
      participantName: 'John Doe',
      orgPrefix: 'INC'
    });
    expect(result).toBe('INC-20260608-2222-JD');
  });

  it('generates correct Reference ID when participant initials are unavailable', () => {
    const result = generateIncidentReferenceId({
      incidentDate: '2026-06-08T14:22:00.000Z',
      participantName: '',
      orgPrefix: 'INC'
    });
    expect(result).toBe('INC-20260608-2222-GEN');
  });

  it('handles invalid date string parameters gracefully by generating general prefix', () => {
    const result = generateIncidentReferenceId({
      incidentDate: 'invalid-date',
      participantName: 'John Doe',
      orgPrefix: 'INC'
    });
    expect(result).toBe('INC-00000000-0000-GEN');
  });

  it('supports customized organization prefix codes', () => {
    const result = generateIncidentReferenceId({
      incidentDate: '2026-06-08T10:05:00.000Z',
      participantName: 'Jane Smith',
      orgPrefix: 'TEST'
    });
    expect(result).toBe('TEST-20260608-1805-JS');
  });
});
