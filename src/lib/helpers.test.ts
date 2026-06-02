import { describe, it, expect } from 'vitest';
import { getFilenameFromStorageUrl } from './helpers';

describe('helpers', () => {
  describe('getFilenameFromStorageUrl', () => {
    it('returns "Existing attachment" for null or undefined', () => {
      expect(getFilenameFromStorageUrl(null)).toBe('Existing attachment');
      expect(getFilenameFromStorageUrl(undefined)).toBe('Existing attachment');
      expect(getFilenameFromStorageUrl('')).toBe('Existing attachment');
    });

    it('extracts filename from a simple path', () => {
      expect(getFilenameFromStorageUrl('folder/file.pdf')).toBe('file.pdf');
      expect(getFilenameFromStorageUrl('deep/nested/folder/document.docx')).toBe('document.docx');
    });

    it('extracts filename from a signed URL and removes query params', () => {
      const url = 'https://supabase.com/storage/v1/object/sign/bucket/folder/report.pdf?token=123&expires=456';
      expect(getFilenameFromStorageUrl(url)).toBe('report.pdf');
    });

    it('strips the 13-digit timestamp prefix', () => {
      expect(getFilenameFromStorageUrl('folder/1717000000000-important_doc.pdf')).toBe('important_doc.pdf');
      expect(getFilenameFromStorageUrl('1717084532123-signed_file.png?token=xyz')).toBe('signed_file.png');
    });

    it('handles encoded filenames correctly', () => {
      expect(getFilenameFromStorageUrl('folder/My%20Vacation%20Photo.jpg')).toBe('My Vacation Photo.jpg');
      expect(getFilenameFromStorageUrl('folder/1717000000000-Medical%20Report%20Final.pdf')).toBe('Medical Report Final.pdf');
    });

    it('returns the decoded last part if no timestamp is present', () => {
      expect(getFilenameFromStorageUrl('plain-file.txt')).toBe('plain-file.txt');
    });
  });
});
