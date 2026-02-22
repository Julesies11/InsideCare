import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type StaffStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Staff {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  hobbies?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  department_id?: string | null;
  employment_type_id?: string | null;
  manager_id?: string | null;
  hire_date?: string | null;
  separation_date?: string | null;
  availability?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  status: StaffStatus;
  created_at?: string;
  updated_at?: string;
  department_info?: { id: string; name: string; } | null;
  employment_type_info?: { id: string; name: string; } | null;
  manager_info?: { id: string; name: string; } | null;
  // Compliance checklist fields
  ndis_worker_screening_check?: boolean | null;
  ndis_worker_screening_check_expiry?: string | null;
  ndis_orientation_module?: boolean | null;
  ndis_orientation_module_expiry?: string | null;
  ndis_code_of_conduct?: boolean | null;
  ndis_code_of_conduct_expiry?: string | null;
  ndis_infection_control_training?: boolean | null;
  ndis_infection_control_training_expiry?: string | null;
  drivers_license?: boolean | null;
  drivers_license_expiry?: string | null;
  comprehensive_car_insurance?: boolean | null;
  comprehensive_car_insurance_expiry?: string | null;
  photo_url?: string | null;
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

export interface StaffTraining {
  id: string;
  staff_id?: string;
  title: string;
  category: string;
  description?: string | null;
  provider?: string | null;
  date_completed?: string | null;
  expiry_date?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffUpdateData {
  name?: string;
  email?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  hobbies?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  department_id?: string | null;
  employment_type_id?: string | null;
  manager_id?: string | null;
  hire_date?: string | null;
  separation_date?: string | null;
  availability?: string | null;
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
        .select(`
          *,
          department_info:departments(id, name),
          employment_type_info:employment_types_master(id, name)
        `)
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
        .select(`
          *,
          department_info:departments(id, name),
          employment_type_info:employment_types_master(id, name),
          manager_info:staff!manager_id(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format joined data
      const formattedData = {
        ...data,
        department_info: Array.isArray(data.department_info) ? data.department_info[0] : data.department_info,
        employment_type_info: Array.isArray(data.employment_type_info) ? data.employment_type_info[0] : data.employment_type_info,
        manager_info: Array.isArray(data.manager_info) ? data.manager_info[0] : data.manager_info,
      };

      return { data: formattedData, error: null };
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

  async function getStaffTraining(staffId?: string) {
    try {
      let query = supabase
        .from('staff_training')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch training records';
      console.error('Error fetching training:', err);
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
    getStaffTraining,
    refetch: fetchStaff,
  };
}
