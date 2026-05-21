export interface ContactTypeMaster {
  id: string;
  contact_type_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
