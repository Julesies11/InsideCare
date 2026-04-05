import { ActivityLog as CommonActivityLog } from '@/components/activities/ActivityLog';

interface ActivityLogProps {
  participantId?: string;
  refreshTrigger?: number;
}

/**
 * @deprecated Use ActivityLog from @/components/activities/ActivityLog instead
 */
export function ActivityLog({ participantId, refreshTrigger }: ActivityLogProps) {
  return (
    <CommonActivityLog 
      entityId={participantId} 
      entityType="participant" 
      refreshTrigger={refreshTrigger} 
    />
  );
}
