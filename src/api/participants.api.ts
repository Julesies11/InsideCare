import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { PARTICIPANT_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';

export interface ParticipantsFilter {
  search?: string;
  houses?: string[];
  statuses?: string[];
}

export interface ParticipantsSort {
  id: string;
  desc: boolean;
}

/**
 * Data Access Layer (DAL) for Participants.
 * 
 * This module is the single source of truth for all Participant-related 
 * database operations. It ensures type safety and prevents magic string 
 * duplication across the codebase.
 */
export const participantsApi = {
  /**
   * Fetches participants assigned to a specific house.
   */
  async listByHouse(houseId: string, status?: string) {
    let query = supabase
      .from(TABLES.PARTICIPANTS)
      .select(PARTICIPANT_VIEWS.LIST)
      .eq('house_id', houseId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('participant_name', { ascending: true });
    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      name: (p as any).participant_name,
      house_name: (p as any).houses?.house_name || null,
    }));
  },

  /**
   * Fetches a paginated list of participants with house details.
   */
  async list({
    pageIndex = 0,
    pageSize = 10,
    sort = [],
    filters = {}
  }: {
    pageIndex?: number;
    pageSize?: number;
    sort?: ParticipantsSort[];
    filters?: ParticipantsFilter;
  } = {}) {
    let query = supabase
      .from(TABLES.PARTICIPANTS)
      .select(PARTICIPANT_VIEWS.LIST, { count: 'exact' });

    // Apply Search
    if (filters.search) {
      query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    // Apply House Filter
    if (filters.houses && filters.houses.length > 0) {
      query = query.in('house_id', filters.houses);
    }

    // Apply Status Filter
    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    // Apply Sorting
    if (sort.length > 0) {
      sort.forEach(s => {
        const column = s.id === 'house' ? 'house_id' : (s.id === 'name' || s.id === 'participant' ? 'participant_name' : s.id);
        query = query.order(column as any, { ascending: !s.desc });
      });
    } else {
      query = query.order('participant_name', { ascending: true });
    }

    // Apply Pagination
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { 
      data: (data || []).map(p => ({
        ...p,
        name: (p as any).participant_name,
        house_name: (p as any).houses?.house_name || null,
      })), 
      count: count || 0 
    };
  },

  /**
   * Fetches a single participant by ID with full details.
   */
  async get(id: string) {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .select(PARTICIPANT_VIEWS.DETAIL)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      house_name: (data as any).houses?.house_name || null,
    };
  },

  /**
   * Creates a new participant.
   */
  async create(participant: Database['public']['Tables']['ic_participants']['Insert']) {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .insert([participant])
      .select(PARTICIPANT_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create participant');

    return data;
  },

  /**
   * Updates an existing participant.
   */
  async update(id: string, updates: Database['public']['Tables']['ic_participants']['Update']) {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .update(updates)
      .eq('id', id)
      .select(PARTICIPANT_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Participant not found or permission denied');

    return {
      ...data,
      house_name: (data as any).houses?.house_name || null,
    };
  },

  /**
   * Deletes a participant.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Gets total count of participants based on filters.
   */
  async count(filters: ParticipantsFilter = {}) {
    let query = supabase
      .from(TABLES.PARTICIPANTS)
      .select('*', { count: 'exact', head: true });

    if (filters.houses && filters.houses.length > 0) {
      query = query.in('house_id', filters.houses);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.search) {
      query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }
};
