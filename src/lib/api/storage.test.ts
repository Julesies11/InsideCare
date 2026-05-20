import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile, deleteFile, getPublicUrl } from './storage';
import { supabase } from '@/lib/supabase';
import * as imageUtils from '@/lib/utils/image';
import { logError } from '@/lib/logger';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/file.jpg' } }),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn().mockResolvedValue(undefined),
}));

describe('Storage API', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should validate, compress and upload file', async () => {
      const validateSpy = vi.spyOn(imageUtils, 'validateImage').mockReturnValue({});
      const compressSpy = vi.spyOn(imageUtils, 'compressImage').mockResolvedValue(mockFile);
      
      const result = await uploadFile(mockFile, { bucket: 'avatars', folder: 'user1' });
      
      expect(validateSpy).toHaveBeenCalledWith(mockFile);
      expect(compressSpy).toHaveBeenCalled();
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(supabase.storage.upload).toHaveBeenCalled();
      expect(result).toContain('user1/file-');
    });

    it('should throw error if validation fails', async () => {
      vi.spyOn(imageUtils, 'validateImage').mockReturnValue({ error: 'Too big' });
      
      await expect(uploadFile(mockFile, { bucket: 'avatars' }))
        .rejects.toThrow('Too big');
    });

    it('should log error and throw if upload fails', async () => {
      vi.spyOn(imageUtils, 'validateImage').mockReturnValue({});
      vi.spyOn(imageUtils, 'compressImage').mockResolvedValue(mockFile);
      vi.mocked(supabase.storage.upload).mockResolvedValueOnce({ data: null, error: { message: 'Upload failed' } as any });
      
      await expect(uploadFile(mockFile, { bucket: 'avatars' }))
        .rejects.toThrow('Storage upload failed: Upload failed');
      
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should call remove with correct path', async () => {
      await deleteFile('avatars', 'user1/photo.jpg');
      
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(supabase.storage.remove).toHaveBeenCalledWith(['user1/photo.jpg']);
    });

    it('should log error if deletion fails', async () => {
      vi.mocked(supabase.storage.remove).mockResolvedValueOnce({ data: null, error: { message: 'Delete failed' } as any });
      
      await expect(deleteFile('avatars', 'path'))
        .rejects.toThrow('Delete failed');
      
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('getPublicUrl', () => {
    it('should return empty string if no path provided', () => {
      expect(getPublicUrl('avatars')).toBe('');
    });

    it('should return path if it is already a URL', () => {
      expect(getPublicUrl('avatars', 'http://external.com/img.jpg')).toBe('http://external.com/img.jpg');
    });

    it('should call getPublicUrl with correct path', () => {
      const result = getPublicUrl('avatars', 'photo.jpg', 'user1');
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(supabase.storage.getPublicUrl).toHaveBeenCalledWith('user1/photo.jpg');
      expect(result).toBe('http://example.com/file.jpg');
    });
  });
});
