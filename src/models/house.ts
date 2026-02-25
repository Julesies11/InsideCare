export interface House {
  id: string;
  name: string;
  branch_id: string | null;
  address: string | null;
  phone: string | null;
  capacity: number | null;
  current_occupancy: number | null;
  house_manager: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
