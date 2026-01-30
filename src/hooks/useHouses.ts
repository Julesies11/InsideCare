import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useActivityLog } from '@/hooks/useActivityLog';

export interface House {
  id: string;
  name: string;
  branch_id?: string;
  address?: string;
  phone?: string;
  capacity?: number;
  current_occupancy?: number;
  house_manager?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useHouses(branchId?: string) {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logActivity } = useActivityLog();

  useEffect(() => {
    fetchHouses();
  }, [branchId]);

  async function fetchHouses() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('houses')
        .select('*')
        .order('name', { ascending: true });

      // Filter by branch if specified
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHouses(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch houses';
      console.error('Error fetching houses:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addHouse(house: Omit<House, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .insert([house])
        .select()
        .single();

      if (error) throw error;

      setHouses([data, ...houses]);
      
      // Log activity
      await logActivity({
        activity_type: 'create',
        entity_type: 'house' as any,
        entity_id: data.id,
        entity_name: data.name,
        description: `New house added: ${data.name}`,
        user_name: 'Current User'
      });
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add house';
      console.error('Error adding house:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateHouse(id: string, updates: Partial<House>) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setHouses(houses.map(h => h.id === id ? data : h));
      
      // Log activity
      await logActivity({
        activity_type: 'update',
        entity_type: 'house' as any,
        entity_id: data.id,
        entity_name: data.name,
        description: `House updated: ${data.name}`,
        user_name: 'Current User'
      });
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update house';
      console.error('Error updating house:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteHouse(id: string) {
    try {
      // Get house name before deleting
      const house = houses.find(h => h.id === id);
      
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHouses(houses.filter(h => h.id !== id));
      
      // Log activity
      if (house) {
        await logActivity({
          activity_type: 'delete',
          entity_type: 'house' as any,
          entity_id: id,
          entity_name: house.name,
          description: `House deleted: ${house.name}`,
          user_name: 'Current User'
        });
      }
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete house';
      console.error('Error deleting house:', err);
      return { error: errorMessage };
    }
  }

  return {
    houses,
    loading,
    error,
    addHouse,
    updateHouse,
    deleteHouse,
    refetch: fetchHouses,
  };
}
