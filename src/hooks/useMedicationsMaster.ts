import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MedicationMaster } from '@/models/medication-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

export function useMedicationsMaster() {
  const [medications, setMedications] = useState<MedicationMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async (includeInactive = true) => {
    try {
      setLoading(true);
      let query = supabase
        .from('medications_master')
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMedications(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medications';
      console.error('Error fetching medications:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  async function addMedication(medication: Omit<MedicationMaster, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('medications_master')
        .insert({
          ...medication,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMedications([...medications, data].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Log activity
        await logActivity({
          activityType: 'create',
          entityType: 'medication_master',
          entityId: data.id,
          entityName: data.name,
          userName: user?.email || undefined,
        });
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding medication:', err);
      // Check for duplicate key constraint
      if (err?.code === '23505' && err?.message?.includes('medications_master_name_key')) {
        return { data: null, error: 'DUPLICATE_NAME' };
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to add medication';
      return { data: null, error: errorMessage };
    }
  }

  async function updateMedication(id: string, updates: Partial<MedicationMaster>) {
    try {
      // Get old values for change detection
      const oldMedication = medications.find(m => m.id === id);
      
      const { data, error } = await supabase
        .from('medications_master')
        .update({
          ...updates,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMedications(medications.map(m => m.id === id ? data : m).sort((a, b) => a.name.localeCompare(b.name)));
        
        // Log activity with changes
        if (oldMedication) {
          const changes = detectChanges(oldMedication, data);
          if (Object.keys(changes).length > 0) {
            await logActivity({
              activityType: 'update',
              entityType: 'medication_master',
              entityId: data.id,
              entityName: data.name,
              changes,
              userName: user?.email || undefined,
            });
          }
        }
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating medication:', err);
      // Check for duplicate key constraint
      if (err?.code === '23505' && err?.message?.includes('medications_master_name_key')) {
        return { data: null, error: 'DUPLICATE_NAME' };
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to update medication';
      return { data: null, error: errorMessage };
    }
  }

  async function deleteMedication(id: string) {
    try {
      const medication = medications.find(m => m.id === id);
      
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from('medications_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setMedications(medications.filter(m => m.id !== id));
      
      // Log activity
      if (medication) {
        await logActivity({
          activityType: 'delete',
          entityType: 'medication_master',
          entityId: id,
          entityName: medication.name,
          userName: user?.email || undefined,
        });
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete medication';
      console.error('Error deleting medication:', err);
      return { error: errorMessage };
    }
  }

  return {
    medications,
    loading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    refresh: fetchMedications,
  };
}
