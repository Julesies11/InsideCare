import { Database } from './database.types';

export type HouseType = Database['public']['Tables']['ic_house_types_master']['Row'];
export type HouseRow = Database['public']['Tables']['ic_houses']['Row'];

export interface House extends HouseRow {
  house_type_info?: HouseType;
  staff_assignments?: Array<{ count: number }>;
  risk_management?: string | null;
}
