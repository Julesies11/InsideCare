import { Activity } from 'lucide-react';
import { Container } from '@/components/common/container';
import { ActivityLogTable } from './components/activity-log-table';

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

        <ActivityLogTable />
      </div>
    </Container>
  );
}
