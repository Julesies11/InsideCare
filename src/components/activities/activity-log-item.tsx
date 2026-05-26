import { ActivityLog, ActivityType } from '@/models/activity-log';
import { TimelineItem } from './timeline-item';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LucideIcon } from 'lucide-react';

interface ActivityLogItemProps {
  activity: ActivityLog;
  isLast: boolean;
}

const activityTypeIcons: Record<ActivityType, LucideIcon> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
};

export function ActivityLogItem({ activity, isLast }: ActivityLogItemProps) {
  const Icon = activityTypeIcons[activity.activity_type] || FileText;
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  // Format description by stripping redundant context (since we are on the entity's own page)
  const formatDescription = () => {
    let desc = activity.description || '';

    // 1. Extract granular changes from [...] block if present
    const summaryMatch = desc.match(/\[(.*?)\]/);
    if (summaryMatch) {
      return summaryMatch[1];
    }

    // 2. Strip "to/from Participant: Name" suffixes for child records
    desc = desc.replace(/ (to|from|for) (Participant|Staff|House):.*$/, '');
    
    // 3. Simplify main record creates/updates
    if (desc.startsWith('Created ') || desc.startsWith('Updated ')) {
      const parts = desc.split(' "');
      if (parts.length > 0) {
        // e.g., "Updated Staff"
        return parts[0];
      }
    }

    return desc;
  };

  return (
    <TimelineItem icon={Icon} line={!isLast}>
      <div className="flex flex-col">
        <div className="text-sm text-foreground">
          {formatDescription()}
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary-foreground mt-1">
          <span>{timeAgo}</span>
          {activity.user_name && (
            <>
              <span>•</span>
              <span>by {activity.user_name}</span>
            </>
          )}
        </div>
      </div>
    </TimelineItem>
  );
}
