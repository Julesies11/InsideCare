import { format } from 'date-fns';
import { getInitials } from './helpers';

export function generateIncidentReferenceId({
  incidentDate,
  participantName,
  orgPrefix = 'INC'
}: {
  incidentDate: string;
  participantName: string;
  orgPrefix?: string;
}): string {
  const dateObj = new Date(incidentDate);
  if (isNaN(dateObj.getTime())) {
    return `${orgPrefix}-00000000-0000-GEN`;
  }
  
  const formattedDate = format(dateObj, 'yyyyMMdd');
  const formattedTime = format(dateObj, 'HHmm');
  const initials = participantName ? (getInitials(participantName) || 'XX') : 'GEN';
  
  return `${orgPrefix}-${formattedDate}-${formattedTime}-${initials}`;
}
