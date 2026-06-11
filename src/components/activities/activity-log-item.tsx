import { ActivityLog, ActivityType } from '@/models/activity-log';
import { formatDistanceToNow } from 'date-fns';
import { Edit, FileText, LucideIcon, Plus, Trash2 } from 'lucide-react';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { SecureAvatar } from '../ui/secure-avatar';
import { TimelineItem } from './timeline-item';

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
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

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
        <div className="text-sm text-foreground">{formatDescription()}</div>
        <div className="flex items-center gap-2 text-xs text-secondary-foreground mt-1">
          <span>{timeAgo}</span>
          {activity.user_name && (
            <div className="flex items-center gap-1.5 ml-1">
              <span>•</span>
              <SecureAvatar
                src={activity.staff?.photo_url}
                initials={activity.user_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
                className="size-4 shrink-0"
                bucket={STORAGE_BUCKETS.STAFF_PHOTOS}
              />
              <span className="font-medium">by {activity.user_name}</span>
            </div>
          )}
        </div>
      </div>
    </TimelineItem>
  );
}
