import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

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
    house_form_name?: string; staff_name?: string; participant_name?: string;
    email?: string;
  };
  staff?: {
    id: string;
    house_form_name?: string; staff_name?: string; participant_name?: string;
    email?: string;
  };
  assigned_by_staff?: {
    id: string;
    house_form_name?: string; staff_name?: string; participant_name?: string;
    email?: string;
  };
  completed_by_staff?: {
    id: string;
    house_form_name?: string; staff_name?: string; participant_name?: string;
    email?: string;
  };
}

export interface HouseForm {
  id: string;
  house_id: string;
  house_form_name?: string; staff_name?: string; participant_name?: string;
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
    house_form_name?: string; staff_name?: string; participant_name?: string;
    email?: string;
  };
  assignments?: HouseFormAssignment[];
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
        
        const { data, error } = await supabase
          .from(TABLES.HOUSE_FORMS)
          .select(`
            *,
            creator:ic_staff!fk_ic_house_forms_created_by(id, staff_name, email),
            house_form_assignments:ic_house_form_assignments(
              id,
              form_id,
              participant_id,
              staff_id,
              assigned_by,
              due_date,
              status,
              completed_at,
              completed_by,
              notes,
              created_at,
              updated_at,
              participant:ic_participants(id, participant_name, email),
              staff:ic_staff!house_form_assignments_staff_id_fkey(id, staff_name, email),
              assigned_by_staff:ic_staff!house_form_assignments_assigned_by_fkey(id, staff_name, email),
              completed_by_staff:ic_staff!house_form_assignments_completed_by_fkey(id, staff_name, email)
            )
          `)
          .eq('house_id', houseId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setHouseForms(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house forms';
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
