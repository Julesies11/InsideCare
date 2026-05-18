import { useAuth } from '@/auth/context/auth-context';
import { RBACModule } from '@/config/rbac-modules';

/**
 * Access levels available in the RBAC system.
 */
export const ACCESS_LEVEL = {
  NONE: 'none',
  CONTEXT_READ_ONLY: 'context_read_only',
  READ_ONLY: 'read_only',
  CONTEXT_READ_WRITE: 'context_read_write',
  FULL: 'full',
} as const;

/**
 * Access level type derived from the constants.
 */
export type AccessLevel = typeof ACCESS_LEVEL[keyof typeof ACCESS_LEVEL];

const HIERARCHY: Record<AccessLevel, number> = {
  [ACCESS_LEVEL.NONE]: 0,
  [ACCESS_LEVEL.CONTEXT_READ_ONLY]: 1,
  [ACCESS_LEVEL.READ_ONLY]: 2,
  [ACCESS_LEVEL.CONTEXT_READ_WRITE]: 3,
  [ACCESS_LEVEL.FULL]: 4,
};

interface UseRBACProps {
  resource: RBACModule;
  requiredLevel: AccessLevel;
}

/**
 * Hook for evaluating granular user permissions.
 * Follows a 'Dumb Frontend' philosophy: checks if a user has any permission level 
 * for a resource, and lets Supabase RLS handle the contextual data filtering.
 */
export function useRBAC() {
  const { user, isAdmin } = useAuth();

  const hasAccess = ({ resource, requiredLevel }: UseRBACProps): boolean => {
    // 1. Admins have absolute full access
    if (isAdmin) return true;

    // 2. If no user or permissions are loaded, deny by default
    if (!user || !user.permissions) return false;

    // 3. Get the user's actual permission level for this resource
    const userLevelStr = (user.permissions[resource] || ACCESS_LEVEL.NONE).toLowerCase() as AccessLevel;
    const userLevel = HIERARCHY[userLevelStr] !== undefined ? userLevelStr : ACCESS_LEVEL.NONE;

    // 4. Quick exit if they have no access at all
    if (userLevel === ACCESS_LEVEL.NONE) return false;

    // 5. Hierarchy check
    // We simply check if the user's level is >= the required level.
    // Frontend doesn't care about 'isAssignedToContext' anymore; RLS handles that.
    return HIERARCHY[userLevel] >= HIERARCHY[requiredLevel];
  };

  return { hasAccess, permissions: user?.permissions || {}, isAdmin };
}
