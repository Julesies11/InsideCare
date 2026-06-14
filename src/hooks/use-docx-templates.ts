import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { docxGenerator } from '@/lib/docx/generator';

const BUCKET_NAME = STORAGE_BUCKETS.WORD_TEMPLATES;

export interface DocxTemplate {
  name: string;
  id: string;
  updated_at: string;
  size: number;
}

/**
 * Hook to manage MS Word templates in Supabase Storage.
 * @param entityFolder Optional folder path (e.g., 'participants', 'staff', 'houses')
 */
export function useDocxTemplates(entityFolder: string = '') {
  const queryClient = useQueryClient();
  const queryKey = ['docx-templates', entityFolder];

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(entityFolder, {
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      return (data || [])
        .filter(file => file.name.endsWith('.docx'))
        .map(file => ({
          name: file.name,
          id: file.id,
          updated_at: file.updated_at,
          size: file.metadata?.size || 0,
        })) as DocxTemplate[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validate template syntax first
      const validation = await docxGenerator.validateTemplate(file);
      if (!validation.valid) {
        throw new Error(`Invalid template syntax: ${validation.error}`);
      }

      const path = entityFolder ? `${entityFolder}/${file.name}` : file.name;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, { upsert: true });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const path = entityFolder ? `${entityFolder}/${name}` : name;
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const downloadTemplate = async (name: string) => {
    const path = entityFolder ? `${entityFolder}/${name}` : name;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
    if (error) {
      toast.error(`Download failed: ${error.message}`);
      throw error;
    }
    return data;
  };

  return {
    templates,
    isLoading,
    error,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    downloadTemplate,
  };
}
