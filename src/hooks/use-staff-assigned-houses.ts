import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
  return useQuery({
    queryKey: ['staff-assigned-houses', staffId],
    queryFn: async () => {
      // First, ensure we have a staff ID. If not passed, try to find it from current auth user
      let effectiveStaffId = staffId;
      
      if (!effectiveStaffId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
          
        if (!staffData) return [];
        effectiveStaffId = staffData.id;
      }

      console.log('Fetching assigned houses for staff:', effectiveStaffId);
      
      const { data, error } = await supabase
        .from('house_staff_assignments')
        .select(`
          id, 
          house_id, 
          house:houses(id, name, address)
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
