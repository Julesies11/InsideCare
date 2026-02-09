import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface EmploymentType {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmploymentTypesMaster() {
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmploymentTypes();
  }, []);

  async function fetchEmploymentTypes() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('employment_types_master')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setEmploymentTypes(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employment types';
      console.error('Error fetching employment types:', err);
      setError(errorMessage);
      setEmploymentTypes([]);
    } finally {
      setLoading(false);
    }
  }

  async function addEmploymentType(employmentTypeData: Omit<EmploymentType, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('employment_types_master')
        .insert([employmentTypeData])
        .select()
        .single();

      if (error) throw error;

      setEmploymentTypes([...employmentTypes, data]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employment type';
      console.error('Error adding employment type:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateEmploymentType(id: string, updates: Partial<EmploymentType>) {
    try {
      const { data, error } = await supabase
        .from('employment_types_master')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEmploymentTypes(employmentTypes.map(et => et.id === id ? data : et));
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employment type';
      console.error('Error updating employment type:', err);
      return { data: null, error: errorMessage };
    }
  }

  const refresh = () => {
    fetchEmploymentTypes();
  };

  return {
    employmentTypes,
    loading,
    error,
    addEmploymentType,
    updateEmploymentType,
    refresh,
  };
}
