export interface MedicationMaster {
  id: string;
  name: string;
  category: string | null;
  common_dosages: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
