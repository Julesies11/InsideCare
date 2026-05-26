import { Settings2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ShiftTemplatesTable } from './components';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';

export function ShiftTemplatesContent() {
  const { hasAccess } = useRBAC();
  
  const canView = hasAccess({ 
    resource: RBAC_MODULES.ROSTER_BOARD, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Settings2 className="size-12 mx-auto text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm">
            You do not have the required permissions to manage shift templates. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Shift Templates" />
          <ToolbarDescription>
            Manage shift routines and templates across all houses
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Clock className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Optimizing Roster efficiency
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Shift templates allow you to define standardized work periods and routines. 
                Applying these templates ensures consistency in care delivery across every house.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Houses Table */}
      <ShiftTemplatesTable />
    </div>
  );
}
