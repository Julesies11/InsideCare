import { ActivityLog, ActivityType } from '@/models/activity-log';
import { TimelineItem } from './timeline-item';
import { Plus, Edit, Trash2, FileText, Users, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
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

const entityTypeIcons: Record<string, LucideIcon> = {
  participant: Users,
  staff: Users,
  incident: AlertCircle,
  compliance: CheckCircle,
  shift_note: FileText,
  branch: Building2,
};

const activityTypeColors: Record<ActivityType, string> = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
};

export function ActivityLogItem({ activity, isLast }: ActivityLogItemProps) {
  const Icon = activityTypeIcons[activity.activity_type] || FileText;
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  // Just return the description as-is (no entity name on entity's own page)
  const formatDescription = () => {
    return activity.description;
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
