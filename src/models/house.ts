import { Database } from './database.types';

export type HouseType =
  Database['public']['Tables']['ic_house_types_master']['Row'];
export type HouseRow = Database['public']['Tables']['ic_houses']['Row'];

export interface House extends HouseRow {
  house_type_info?: HouseType;
  staff_assignments?: Array<{
    id: string;
    end_date: string | null;
    staff: {
      id: string;
      staff_name: string;
      photo_url: string | null;
      status: string;
    } | null;
  }>;
  risk_management?: string | null;
}
