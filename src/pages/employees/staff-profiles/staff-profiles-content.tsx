import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StaffTable } from './components';

export function StaffProfilesContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Staff Profiles
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Manage staff member information and profiles
          </p>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
              <Users className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-purple-900 dark:text-purple-100">
                Empowering Our Team
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Our staff members are the backbone of exceptional service delivery. Their dedication, expertise, 
                and compassion ensure every participant receives the highest quality support and care.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <StaffTable />
    </div>
  );
}
