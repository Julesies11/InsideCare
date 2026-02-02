import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type StaffStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Staff {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  hire_date?: string | null;
  qualifications?: string | null;
  certifications?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  employment_type?: string | null;
  working_hours?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  status: StaffStatus;
  created_at?: string;
  updated_at?: string;
}

export interface StaffCompliance {
  id: string;
  staff_id: string;
  compliance_name: string;
  completion_date?: string | null;
  expiry_date?: string | null;
  status?: 'Complete' | 'Expiring Soon' | 'Expired' | 'Incomplete' | 'Not Required' | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffResource {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  type: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  external_url?: string | null;
  duration?: string | null;
  is_popular?: boolean | null;
  is_interactive?: boolean | null;
  tags?: string[] | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffUpdateData {
  name?: string;
  email?: string;
  phone?: string | null;
  department?: string | null;
  hire_date?: string | null;
  qualifications?: string | null;
  certifications?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  employment_type?: string | null;
  working_hours?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  status?: StaffStatus;
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff(silent = false) {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setStaff(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      console.error('Error fetching staff:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function getStaffById(id: string) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      console.error('Error fetching staff member:', err);
      // Return the full error object to preserve error codes and details
      return { data: null, error: err };
    }
  }

  async function updateStaff(id: string, updates: StaffUpdateData) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Use functional state update to avoid stale closure
      setStaff(prevStaff => prevStaff.map(member => member.id === id ? data : member));

      return { data, error: null };
    } catch (err) {
      console.error('Error updating staff member:', err);
      // Return the full error object to preserve error codes and details
      return { data: null, error: err };
    }
  }

  async function createStaff(staffData: StaffUpdateData) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          ...staffData,
          status: 'draft',        // Always start as draft
          name: staffData.name ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Use functional state update to avoid stale closure
      setStaff(prevStaff => [data, ...prevStaff]);

      return { data, error: null };
    } catch (err) {
      console.error('Error creating staff member:', err);
      // Return the full error object to preserve error codes and details
      return { data: null, error: err };
    }
  }

  async function deleteStaff(id: string) {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Use functional state update to avoid stale closure
      setStaff(prevStaff => prevStaff.filter(member => member.id !== id));

      return { error: null };
    } catch (err) {
      console.error('Error deleting staff member:', err);
      // Return the full error object to preserve error codes and details
      return { error: err };
    }
  }

  async function getStaffCompliance(staffId: string) {
    try {
      const { data, error } = await supabase
        .from('staff_compliance')
        .select('*')
        .eq('staff_id', staffId)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch compliance data';
      console.error('Error fetching compliance data:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function getStaffResources() {
    try {
      const { data, error } = await supabase
        .from('staff_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resources';
      console.error('Error fetching resources:', err);
      return { data: null, error: errorMessage };
    }
  }

  return {
    staff,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    getStaffCompliance,
    getStaffResources,
    refetch: fetchStaff,
  };
}
