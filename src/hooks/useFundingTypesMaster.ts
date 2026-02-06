import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FundingTypeMaster } from '@/models/funding-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

export function useFundingTypesMaster() {
  const [fundingTypes, setFundingTypes] = useState<FundingTypeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchFundingTypes();
  }, []);

  const fetchFundingTypes = async (includeInactive = true) => {
    try {
      setLoading(true);
      let query = supabase
        .from('funding_types_master')
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFundingTypes(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch funding types';
      console.error('Error fetching funding types:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  async function addFundingType(fundingType: Omit<FundingTypeMaster, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('funding_types_master')
        .insert({
          ...fundingType,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFundingTypes([...fundingTypes, data].sort((a, b) => a.name.localeCompare(b.name)));
        
        await logActivity({
          activityType: 'create',
          entityType: 'funding_type_master',
          entityId: data.id,
          entityName: data.name,
          userName: user?.email || undefined,
        });
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funding type';
      console.error('Error adding funding type:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateFundingType(id: string, updates: Partial<FundingTypeMaster>) {
    try {
      const oldFundingType = fundingTypes.find(ft => ft.id === id);
      
      const { data, error } = await supabase
        .from('funding_types_master')
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
        setFundingTypes(fundingTypes.map(ft => ft.id === id ? data : ft).sort((a, b) => a.name.localeCompare(b.name)));
        
        if (oldFundingType) {
          const changes = detectChanges(oldFundingType, data);
          if (Object.keys(changes).length > 0) {
            await logActivity({
              activityType: 'update',
              entityType: 'funding_type_master',
              entityId: data.id,
              entityName: data.name,
              changes,
              userName: user?.email || undefined,
            });
          }
        }
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update funding type';
      console.error('Error updating funding type:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteFundingType(id: string) {
    try {
      const fundingType = fundingTypes.find(ft => ft.id === id);
      
      const { error } = await supabase
        .from('funding_types_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setFundingTypes(fundingTypes.filter(ft => ft.id !== id));
      
      if (fundingType) {
        await logActivity({
          activityType: 'delete',
          entityType: 'funding_type_master',
          entityId: id,
          entityName: fundingType.name,
          userName: user?.email || undefined,
        });
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete funding type';
      console.error('Error deleting funding type:', err);
      return { error: errorMessage };
    }
  }

  return {
    fundingTypes,
    loading,
    error,
    addFundingType,
    updateFundingType,
    deleteFundingType,
    refresh: fetchFundingTypes,
  };
}
