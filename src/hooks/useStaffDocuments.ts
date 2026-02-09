import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface StaffDocument {
  id: string;
  staff_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  is_restricted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useStaffDocuments(staffId?: string) {
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staffId) {
      fetchDocuments(staffId);
    } else {
      setLoading(false);
    }
  }, [staffId]);

  const fetchDocuments = async (staffId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      console.error('Error fetching documents:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument(file: File, uploadedBy?: string) {
    if (!staffId) {
      return { data: null, error: 'Staff ID is required' };
    }
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Save document metadata to database
      const { data, error } = await supabase
        .from('staff_documents')
        .insert({
          staff_id: staffId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: uploadedBy || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      if (data) {
        setDocuments([data, ...documents]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      console.error('Error uploading document:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteDocument(id: string, filePath: string) {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('staff-documents')
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      // Delete from database
      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments(documents.filter(d => d.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('Error deleting document:', err);
      return { error: errorMessage };
    }
  }

  const getFileUrl = (filePath: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('staff-documents')
      .getPublicUrl(filePath);
    return publicUrl;
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    getFileUrl,
    refetch: staffId ? () => fetchDocuments(staffId) : () => {}
  };
}
