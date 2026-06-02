import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/context/auth-context';
import { housesApi } from '@/api/houses.api';

export interface AssignedHouse {
  id: string;
  house_id: string;
  house: {
    id: string;
    house_name: string;
    address?: string;
  };
}

export function useStaffAssignedHouses(staffId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['staff-assigned-houses', staffId || user?.staff_id],
    queryFn: async () => {
      const effectiveStaffId = staffId || user?.staff_id;
      if (!effectiveStaffId) return [];

      return await housesApi.listStaffAssignmentsByStaff(effectiveStaffId) as unknown as AssignedHouse[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
