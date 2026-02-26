import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

export interface HousesFilter {
  search?: string;
  statuses?: string[];
}

export interface HousesSort {
  id: string;
  desc: boolean;
}

export function useHouses(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: HousesSort[] = [],
  filters: HousesFilter = {},
  branchId?: string
) {
  const [houses, setHouses] = useState<House[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build base query
      let query = supabase
        .from('houses')
        .select('*', { count: 'exact' });

      // Filter by branch if specified
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,house_manager.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      // Apply sorting
      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id, { ascending: !s.desc });
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count: totalCount } = await query;

      if (error) throw error;

      setHouses(data || []);
      setCount(totalCount || 0);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch houses';
      console.error('Error fetching houses:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, JSON.stringify(sort), JSON.stringify(filters), branchId]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  async function addHouse(house: Omit<House, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .insert([house])
        .select()
        .single();

      if (error) throw error;

      setHouses([data, ...houses]);
      
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
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update house';
      console.error('Error updating house:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteHouse(id: string) {
    try {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHouses(houses.filter(h => h.id !== id));
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete house';
      console.error('Error deleting house:', err);
      return { error: errorMessage };
    }
  }

  return {
    houses,
    count,
    loading,
    error,
    addHouse,
    updateHouse,
    deleteHouse,
    refetch: fetchHouses,
  };
}
