import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { QUERY_KEYS } from '@/config/query-keys';

export interface AuthUserStatus {
  id: string;
  email: string;
  created_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  invited_at: string | null;
}

export type AuthStatusMap = Record<string, AuthUserStatus>;

/**
 * Hook to fetch Supabase Auth status for all users.
 * Strictly limited to Admins.
 */
export function useAdminAuthStatus() {
  const { hasAccess } = useRBAC();
  
  const isAdmin = hasAccess({ 
    resource: RBAC_MODULES.ACCESS_CONTROL, 
    requiredLevel: ACCESS_LEVEL.FULL 
  });

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_AUTH_STATUS],
    queryFn: async (): Promise<AuthStatusMap> => {
      const { data, error } = await supabase.functions.invoke('ic-admin-auth-status');
      
      if (error) {
        console.error('Failed to fetch admin auth status:', error);
        throw error;
      }
      
      return data as AuthStatusMap;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
