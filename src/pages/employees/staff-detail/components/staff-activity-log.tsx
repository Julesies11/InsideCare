import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityLog } from '@/hooks/use-activity-log';
import { ActivityLogItem } from '@/components/activities/activity-log-item';
import { Button } from '@/components/ui/button';

interface StaffActivityLogProps {
  staffId?: string;
  refreshTrigger?: number;
}

export function StaffActivityLog({ staffId, refreshTrigger }: StaffActivityLogProps) {
  const [showAll, setShowAll] = useState(false);
  const limit = showAll ? 100 : 10;
  
  const { activities, loading, error, refetch } = useActivityLog({
    entityId: staffId,
    limit,
  });

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <Card className="pb-2.5" id="staff_activity_log">
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading activity log...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activity recorded yet</div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <ActivityLogItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
      {activities.length > 0 && (
        <CardFooter className="justify-center">
          <Button mode="link" underlined="dashed" onClick={handleToggleShowAll}>
            {showAll ? 'Show Recent Activities' : 'All-time Activities'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
