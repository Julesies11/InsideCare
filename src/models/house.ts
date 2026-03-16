export interface HouseType {
  id: string;
  name: string;
  description: string | null;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface House extends Record<string, any> {
  id: string;
  name: string;
  branch_id: string | null;
  address: string | null;
  phone: string | null;
  capacity: number | null;
  current_occupancy: number | null;
  house_manager: string | null;
  house_type_id: string | null;
  house_type_info?: HouseType;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  individuals_breakdown: string | null;
  participant_dynamics: string | null;
  observations: string | null;
  general_house_details: string | null;
  created_at: string;
  updated_at: string;
}
