import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  access_level?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function useDepartmentsMaster() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setDepartments(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      console.error('Error fetching departments:', err);
      setError(errorMessage);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }

  async function addDepartment(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([departmentData])
        .select()
        .single();

      if (error) throw error;

      setDepartments([...departments, data]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add department';
      console.error('Error adding department:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateDepartment(id: string, updates: Partial<Department>) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDepartments(departments.map(d => d.id === id ? data : d));
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      console.error('Error updating department:', err);
      return { data: null, error: errorMessage };
    }
  }

  const refresh = () => {
    fetchDepartments();
  };

  return {
    departments,
    loading,
    error,
    addDepartment,
    updateDepartment,
    refresh,
  };
}
