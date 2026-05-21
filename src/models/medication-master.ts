export interface MedicationMaster {
  id: string;
  medication_name: string;
  category: string | null;
  common_dosages: string | null;
  side_effects: string | null;
  interactions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
