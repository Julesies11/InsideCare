import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

export function useContactTypesMaster() {
  const [contactTypes, setContactTypes] = useState<ContactTypeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchContactTypes();
  }, []);

  const fetchContactTypes = async (includeInactive = true) => {
    try {
      setLoading(true);
      let query = supabase
        .from('contact_types_master')
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContactTypes(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contact types';
      console.error('Error fetching contact types:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  async function addContactType(contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('contact_types_master')
        .insert({
          ...contactType,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setContactTypes([...contactTypes, data].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Log activity
        await logActivity({
          activityType: 'create',
          entityType: 'contact_type_master',
          entityId: data.id,
          entityName: data.name,
          userName: user?.email || undefined,
        });
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact type';
      console.error('Error adding contact type:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateContactType(id: string, updates: Partial<ContactTypeMaster>) {
    try {
      // Get old values for change detection
      const oldContactType = contactTypes.find(ct => ct.id === id);
      
      const { data, error } = await supabase
        .from('contact_types_master')
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
        setContactTypes(contactTypes.map(ct => ct.id === id ? data : ct).sort((a, b) => a.name.localeCompare(b.name)));
        
        // Log activity with changes
        if (oldContactType) {
          const changes = detectChanges(oldContactType, data);
          if (Object.keys(changes).length > 0) {
            await logActivity({
              activityType: 'update',
              entityType: 'contact_type_master',
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact type';
      console.error('Error updating contact type:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteContactType(id: string) {
    try {
      const contactType = contactTypes.find(ct => ct.id === id);
      
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from('contact_types_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setContactTypes(contactTypes.filter(ct => ct.id !== id));
      
      // Log activity
      if (contactType) {
        await logActivity({
          activityType: 'delete',
          entityType: 'contact_type_master',
          entityId: id,
          entityName: contactType.name,
          userName: user?.email || undefined,
        });
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact type';
      console.error('Error deleting contact type:', err);
      return { error: errorMessage };
    }
  }

  return {
    contactTypes,
    loading,
    error,
    addContactType,
    updateContactType,
    deleteContactType,
    refresh: fetchContactTypes,
  };
}
