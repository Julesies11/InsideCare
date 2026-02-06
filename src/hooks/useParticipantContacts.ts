import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ParticipantContact {
  id: string;
  participant_id: string;
  contact_name: string;
  contact_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantContacts(participantId?: string) {
  const [contacts, setContacts] = useState<ParticipantContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchContacts(participantId);
    } else {
      setLoading(false);
    }
  }, [participantId]);

  const fetchContacts = async (participantId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participant_contacts')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContacts(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contacts';
      console.error('Error fetching contacts:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addContact(contact: Omit<ParticipantContact, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setContacts([data, ...contacts]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      console.error('Error adding contact:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateContact(id: string, updates: Partial<ParticipantContact>) {
    try {
      const { data, error } = await supabase
        .from('participant_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setContacts(contacts.map(c => c.id === id ? data : c));
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      console.error('Error updating contact:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteContact(id: string) {
    try {
      const { error } = await supabase
        .from('participant_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      console.error('Error deleting contact:', err);
      return { error: errorMessage };
    }
  }

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    refetch: participantId ? () => fetchContacts(participantId) : () => {}
  };
}
