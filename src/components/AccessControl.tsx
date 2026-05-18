import { ReactNode } from 'react';
import { AccessLevel, useRBAC } from '@/hooks/useRBAC';
import { RBACModule } from '@/config/rbac-modules';

interface AccessControlProps {
  resource: RBACModule;
  requiredLevel: AccessLevel;
  fallback?: ReactNode;
  children: ReactNode | ((isAllowed: boolean) => ReactNode);
}

/**
 * AccessControl component for declarative RBAC in the UI.
 * Follows a 'Dumb Frontend' philosophy: checks if a user has any permission level 
 * for a resource, and lets Supabase RLS handle the contextual data filtering.
 * 
 * Supports both standard conditional rendering and the Render Prop pattern.
 * 
 * @example
 * <AccessControl resource={RBAC_MODULES.HOUSES} requiredLevel="read_only">
 *   {(isAllowed) => (
 *     <button disabled={!isAllowed}>Save</button>
 *   )}
 * </AccessControl>
 */
export function AccessControl({
  resource,
  requiredLevel,
  fallback = null,
  children,
}: AccessControlProps) {
  const { hasAccess } = useRBAC();
  
  const isAllowed = hasAccess({ resource, requiredLevel });

  // 1. Render Prop Pattern (Function as a Child)
  if (typeof children === 'function') {
    return <>{children(isAllowed)}</>;
  }

  // 2. Standard Conditional Rendering
  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
