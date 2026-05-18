import { useAuth } from '@/auth/context/auth-context';
import { useRBAC, AccessLevel, ACCESS_LEVEL } from './useRBAC';

export type PermissionModule = 
  // Personal (Staff Portal)
  | 'my_roster'
  | 'my_timesheets'
  | 'my_leave'
  | 'shift_routines'
  // Care Management
  | 'participants'
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
  | 'activity_log';

export function usePermissions() {
  const { user, isAdmin } = useAuth();
  const { hasAccess } = useRBAC();

  const canView = (module: string) => {
    return hasAccess({ 
      resource: module, 
      requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY
    });
  };

  const canEdit = (module: string) => {
    return hasAccess({ 
      resource: module, 
      requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE
    });
  };

  const isContextAware = (module: string) => {
    const level = (user?.permissions?.[module] || ACCESS_LEVEL.NONE) as AccessLevel;
    return level === ACCESS_LEVEL.CONTEXT_READ_WRITE || level === ACCESS_LEVEL.CONTEXT_READ_ONLY;
  };

  const hasFullAccess = (module: string) => {
    const level = (user?.permissions?.[module] || ACCESS_LEVEL.NONE) as AccessLevel;
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
