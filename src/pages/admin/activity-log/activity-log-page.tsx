import { Container } from '@/components/common/container';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function ActivityLogPage() {
  return (
    <Container className="py-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold leading-none text-gray-900">
            System Activity Log
          </h1>
          <p className="text-sm text-gray-500">
            Audit trail of all system changes and user actions.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 py-5 border-b mb-4">
            <Activity className="size-5 text-gray-500" />
            <CardTitle className="text-lg font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityLog />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
