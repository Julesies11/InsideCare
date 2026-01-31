import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityLog } from '@/hooks/use-activity-log';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Loader2 } from 'lucide-react';

export function RecentActivity() {
  const { activities, loading, error } = useActivityLog();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-4">
            Failed to load activity logs
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.user_name || 'System'} • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}
