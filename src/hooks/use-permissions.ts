import { useMemo } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { AccessLevel } from './use-role-permissions';

export type PermissionModule = 
  | 'participant_profiles'
  | 'staff_profiles'
  | 'house_profiles'
  | 'shift_notes'
  | 'participant_documents'
  | 'house_documents'
  | 'staff_documents'
  | 'roster_board'
  | 'assign_staff_to_shift'
  | 'timesheets_submit'
  | 'timesheets_approve'
  | 'house_checklists'
  | 'shift_routines'
  | 'leave_requests';

export function usePermissions() {
  const { user, isAdmin } = useAuth();

  const permissions = useMemo(() => {
    // Admins always have full access
    if (isAdmin) {
      return {
        participant_profiles: 'full',
        staff_profiles: 'full',
        house_profiles: 'full',
        shift_notes: 'full',
        participant_documents: 'full',
        house_documents: 'full',
        staff_documents: 'full',
        roster_board: 'full',
        assign_staff_to_shift: 'full',
        timesheets_submit: 'full',
        timesheets_approve: 'full',
        house_checklists: 'full',
        shift_routines: 'full',
        leave_requests: 'full',
      } as Record<PermissionModule, AccessLevel>;
    }

    // Otherwise use permissions from user metadata
    return (user as any)?.permissions || {} as Record<PermissionModule, AccessLevel>;
  }, [user, isAdmin]);

  const canView = (module: PermissionModule) => {
    const level = permissions[module] || 'none';
    return level !== 'none';
  };

  const canEdit = (module: PermissionModule) => {
    const level = permissions[module] || 'none';
    return level === 'full' || level === 'context_locked';
  };

  const isContextLocked = (module: PermissionModule) => {
    const level = permissions[module] || 'none';
    return level === 'context_locked';
  };

  const hasFullAccess = (module: PermissionModule) => {
    const level = permissions[module] || 'none';
    return level === 'full';
  };

  return {
    permissions,
    canView,
    canEdit,
    isContextLocked,
    hasFullAccess,
  };
}
