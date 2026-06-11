import { useEffect, useState } from 'react';
import { housesApi } from '@/api/houses.api';

export interface HouseFormAssignment {
  id: string;
  form_id: string;
  participant_id?: string;
  staff_id?: string;
  assigned_by?: string;
  due_date?: string;
  status: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  participant?: {
    id: string;
    participant_name?: string;
    email?: string;
  };
  staff?: {
    id: string;
    staff_name?: string;
    email?: string;
  };
  assigned_by_staff?: {
    id: string;
    staff_name?: string;
    email?: string;
  };
  completed_by_staff?: {
    id: string;
    staff_name?: string;
    email?: string;
  };
}

export interface HouseForm {
  id: string;
  house_id: string;
  house_form_name?: string;
  type: string;
  description?: string;
  frequency: string;
  is_global: boolean;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    staff_name?: string;
    email?: string;
  };
  house_form_assignments?: HouseFormAssignment[];
}

export function useHouseForms(houseId?: string) {
  const [houseForms, setHouseForms] = useState<HouseForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      setHouseForms([]);
      setLoading(false);
      return;
    }

    const fetchHouseForms = async () => {
      try {
        setLoading(true);
        const data = await housesApi.listForms(houseId);
        setHouseForms(data || []);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch house forms';
        console.error('Error fetching house forms:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseForms();
  }, [houseId]);

  return {
    houseForms,
    loading,
    error,
  };
}
