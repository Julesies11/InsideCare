import { useAuth } from '@/auth/context/auth-context';
import { ACCESS_LEVEL, AccessLevel, useRBAC } from './useRBAC';

export type PermissionModule =
  // Personal (Staff Portal)
  | 'my_roster'
  | 'my_timesheets'
  | 'my_leave'
  | 'shift_routines'
  // Care Management
  | 'participants'
  | 'participant_clinical_trackers'
  | 'shift_notes'
  // Employees & HR
  | 'employees'
  | 'timesheets'
  | 'leave_requests'
  // Operations & Facilities
  | 'houses'
  | 'house_checklists'
  | 'roster_board'
  // System Administration
  | 'access_control'
  | 'master_lists'
  | 'activity_log'
  // Reporting
  | 'reporting_clinical'
  | 'reporting_operational'
  | 'reporting_compliance';

export function usePermissions() {
  const { user, isAdmin } = useAuth();
  const { hasAccess } = useRBAC();

  const canView = (module: string | string[]) => {
    if (Array.isArray(module)) {
      return module.some((m) =>
        hasAccess({
          resource: m,
          requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
        }),
      );
    }
    return hasAccess({
      resource: module,
      requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
    });
  };

  const canEdit = (module: string | string[]) => {
    if (Array.isArray(module)) {
      return module.some((m) =>
        hasAccess({
          resource: m,
          requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
        }),
      );
    }
    return hasAccess({
      resource: module,
      requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
    });
  };

  const isContextAware = (module: string) => {
    const level = (user?.permissions?.[module] ||
      ACCESS_LEVEL.NONE) as AccessLevel;
    return (
      level === ACCESS_LEVEL.CONTEXT_READ_WRITE ||
      level === ACCESS_LEVEL.CONTEXT_READ_ONLY
    );
  };

  const hasFullAccess = (module: string) => {
    const level = (user?.permissions?.[module] ||
      ACCESS_LEVEL.NONE) as AccessLevel;
    return isAdmin || level === ACCESS_LEVEL.FULL;
  };

  return {
    permissions: user?.permissions || {},
    canView,
    canEdit,
    isContextAware,
    hasFullAccess,
  };
}
