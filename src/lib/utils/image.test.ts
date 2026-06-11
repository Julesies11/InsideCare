import imageCompression from 'browser-image-compression';
import { describe, expect, it, vi } from 'vitest';
import { compressImage, COMPRESSION_PRESETS, validateImage } from './image';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn().mockImplementation((file) => Promise.resolve(file)),
}));

describe('Image Utility', () => {
  describe('validateImage', () => {
    it('should return error for files larger than 10MB', () => {
      const largeFile = { size: 11 * 1024 * 1024, type: 'image/jpeg' } as File;
      const result = validateImage(largeFile);
      expect(result.error).toContain('Image is too large');
    });

    it('should return error for invalid file types', () => {
      const invalidFile = { size: 1024, type: 'application/pdf' } as File;
      const result = validateImage(invalidFile);
      expect(result.error).toBe(
        'Invalid file type. Please upload a JPG, PNG, or WebP image.',
      );
    });

    it('should return empty object for valid files', () => {
      const validFile = { size: 1024, type: 'image/png' } as File;
      const result = validateImage(validFile);
      expect(result.error).toBeUndefined();
    });
  });

  describe('compressImage', () => {
    it('should return original file if not an image', async () => {
      const nonImageFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
      });
      const result = await compressImage(nonImageFile);
      expect(result).toBe(nonImageFile);
    });

    it('should call imageCompression with correct options for AVATAR preset', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await compressImage(file, 'AVATAR');

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        COMPRESSION_PRESETS.AVATAR,
      );
    });

    it('should return a new File object with the same name', async () => {
      const file = new File(['test'], 'my-photo.png', { type: 'image/png' });
      const result = await compressImage(file, 'AVATAR');

      expect(result.name).toBe('my-photo.png');
      expect(result).not.toBe(file); // Should be a new File object
    });

    it('should return original file if compression fails', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      vi.mocked(imageCompression).mockRejectedValueOnce(
        new Error('Compression failed'),
      );

      const result = await compressImage(file);
      expect(result).toBe(file);
    });
  });
});
