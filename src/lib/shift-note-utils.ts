import { getInitials } from './helpers';

interface ReferenceIdParams {
  startDate: string | null | undefined;
  shiftTime: string | null | undefined;
  staffName?: string | null | undefined;
  participantName?: string | null | undefined;
  orgPrefix?: string;
}

export function generateShiftNoteReferenceId({
  startDate,
  shiftTime,
  participantName,
  orgPrefix = 'SC',
}: ReferenceIdParams): string {
  // Normalize date to YYYYMMDD
  const cleanDate = (startDate || '').trim().replace(/-/g, '');
  const formattedDate = cleanDate.length === 8 ? cleanDate : '00000000';

  // Normalize time to HHMM
  let formattedTime = '0000';
  const cleanTime = (shiftTime || '').trim().replace(/:/g, '');
  const digitsOnly = cleanTime.match(/\d+/)?.[0] || '';
  if (digitsOnly.length === 3) {
    formattedTime = '0' + digitsOnly;
  } else if (digitsOnly.length >= 4) {
    formattedTime = digitsOnly.substring(0, 4);
  } else if (digitsOnly.length > 0) {
    formattedTime = digitsOnly.padEnd(4, '0');
  }

  const partInitials = participantName
    ? getInitials(participantName) || 'XX'
    : 'GH';

  return `${orgPrefix}-${formattedDate}-${formattedTime}-${partInitials}`;
}
