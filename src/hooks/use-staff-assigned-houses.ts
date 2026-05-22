import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { TABLES } from '@/config/db-tables';

export interface AssignedHouse {
  id: string;
  house_id: string;
  house: {
    id: string;
    name: string;
    address?: string;
  };
}

export function useStaffAssignedHouses(staffId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['staff-assigned-houses', staffId || user?.staff_id],
    queryFn: async () => {
      // First, ensure we have a staff ID. If not passed, use the one from AuthContext
      const effectiveStaffId = staffId || user?.staff_id;
      
      if (!effectiveStaffId) {
        return [];
      }

      console.log('Fetching assigned houses for staff:', effectiveStaffId);
      
      const { data, error } = await supabase
        .from(TABLES.HOUSE_STAFF_ASSIGNMENTS)
        .select(`
          id, 
          house_id, 
          house:ic_houses(id, house_name, address)
        `)
        .eq('staff_id', effectiveStaffId);
        
      if (error) {
        console.error('Error fetching assigned houses:', error);
        throw error;
      }
      
      console.log('Found assigned houses:', data?.length || 0);
      
      // Filter out any assignments where house might be null (though unlikely with FK)
      return (data || [])
        .filter(item => item.house)
        .map(item => ({
          id: item.id,
          house_id: item.house_id,
          house: item.house
        })) as unknown as AssignedHouse[];
    },
    // We don't disable it if staffId is missing anymore, we try to find it
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
