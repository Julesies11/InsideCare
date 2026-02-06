import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FundingSourceMaster } from '@/models/funding-source-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

export function useFundingSourcesMaster() {
  const [fundingSources, setFundingSources] = useState<FundingSourceMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchFundingSources();
  }, []);

  const fetchFundingSources = async (includeInactive = true) => {
    try {
      setLoading(true);
      let query = supabase
        .from('funding_sources_master')
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFundingSources(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch funding sources';
      console.error('Error fetching funding sources:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  async function addFundingSource(fundingSource: Omit<FundingSourceMaster, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('funding_sources_master')
        .insert({
          ...fundingSource,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFundingSources([...fundingSources, data].sort((a, b) => a.name.localeCompare(b.name)));
        
        await logActivity({
          activityType: 'create',
          entityType: 'funding_source_master',
          entityId: data.id,
          entityName: data.name,
          userName: user?.email || undefined,
        });
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funding source';
      console.error('Error adding funding source:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateFundingSource(id: string, updates: Partial<FundingSourceMaster>) {
    try {
      const oldFundingSource = fundingSources.find(fs => fs.id === id);
      
      const { data, error } = await supabase
        .from('funding_sources_master')
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
        setFundingSources(fundingSources.map(fs => fs.id === id ? data : fs).sort((a, b) => a.name.localeCompare(b.name)));
        
        if (oldFundingSource) {
          const changes = detectChanges(oldFundingSource, data);
          if (Object.keys(changes).length > 0) {
            await logActivity({
              activityType: 'update',
              entityType: 'funding_source_master',
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to update funding source';
      console.error('Error updating funding source:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteFundingSource(id: string) {
    try {
      const fundingSource = fundingSources.find(fs => fs.id === id);
      
      const { error } = await supabase
        .from('funding_sources_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setFundingSources(fundingSources.filter(fs => fs.id !== id));
      
      if (fundingSource) {
        await logActivity({
          activityType: 'delete',
          entityType: 'funding_source_master',
          entityId: id,
          entityName: fundingSource.name,
          userName: user?.email || undefined,
        });
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete funding source';
      console.error('Error deleting funding source:', err);
      return { error: errorMessage };
    }
  }

  return {
    fundingSources,
    loading,
    error,
    addFundingSource,
    updateFundingSource,
    deleteFundingSource,
    refresh: fetchFundingSources,
  };
}
