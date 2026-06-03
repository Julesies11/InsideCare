import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { PARTICIPANT_VIEWS } from '@/config/query-views';
import { Database } from '@/models/database.types';

export interface ParticipantsFilter {
  search?: string;
  statuses?: string[];
  houseIds?: string[];
}

export interface ParticipantsSort {
  id: string;
  desc: boolean;
}

/**
 * Data Access Layer (DAL) for Participants.
 */
export const participantsApi = {
  /**
   * Helper to strip non-existent columns from payloads to prevent 42703 errors.
   */
  sanitizeRecord(record: any, forbidden: string[] = []) {
    const sanitized = { ...record };
    forbidden.forEach(key => delete sanitized[key]);
    
    // Standard system-managed fields that should never be sent in mutations
    const systemFields = ['created_at', 'updated_at', 'created_by', 'updated_by'];
    systemFields.forEach(key => delete sanitized[key]);
    
    return sanitized;
  },

  /**
   * Fetches a paginated list of participants with related house.
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

    if (filters.search) {
      query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,personal_mobile.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.houseIds && filters.houseIds.length > 0) {
      query = query.in('house_id', filters.houseIds);
    }

    if (sort.length > 0) {
      sort.forEach(s => {
        let column = s.id;
        if (s.id === 'house') column = 'house_id';
        if (s.id === 'participant') column = 'participant_name';
        if (s.id === 'contact') column = 'email';
        if (s.id === 'ndis') column = 'ndis_number';
        
        query = query.order(column as any, { ascending: !s.desc });
      });
    } else {
      query = query.order('participant_name', { ascending: true });
    }

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
   * Fetches all active participants.
   */
  async listActive() {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .select('id, participant_name, status, house_id, photo_url')
      .eq('status', 'active')
      .order('participant_name');
    if (error) throw error;
    return (data || []).map((p: any) => ({ ...p, name: p.participant_name }));
  },

  /**
   * Fetches participants for a specific house.
   */
  async listByHouse(houseId: string, status?: string) {
    let query = supabase
      .from(TABLES.PARTICIPANTS)
      .select(PARTICIPANT_VIEWS.LIST)
      .eq('house_id', houseId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('participant_name');
    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      name: (p as any).participant_name,
      house_name: (p as any).houses?.house_name || null,
    }));
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
      name: (data as any).participant_name,
      house_name: (data as any).houses?.house_name || null,
    };
  },

  /**
   * Creates a new participant.
   */
  async create(participant: Database['public']['Tables']['ic_participants']['Insert']) {
    const payload = this.sanitizeRecord(participant, ['frequency', 'instructions']);

    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .insert([payload])
      .select(PARTICIPANT_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create participant. This is likely an RLS policy violation (missing INSERT permission).');

    return data;
  },

  /**
   * Updates an existing participant.
   */
  async update(id: string, updates: Database['public']['Tables']['ic_participants']['Update']) {
    const payload = this.sanitizeRecord(updates, ['frequency', 'instructions']);

    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .update(payload)
      .eq('id', id)
      .select(PARTICIPANT_VIEWS.DETAIL)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Participant not found or permission denied (RLS Violation).');

    return data;
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

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.houseIds && filters.houseIds.length > 0) {
      query = query.in('house_id', filters.houseIds);
    }

    if (filters.search) {
      query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,personal_mobile.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }
};
