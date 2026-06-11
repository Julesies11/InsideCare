import { uploadFile } from './storage';

/**
 * Specifically handles the upload and resizing of a user's profile picture.
 * @param file The raw file selected by the user
 * @param bucket The Supabase bucket to upload to (e.g., 'staff-photos', 'participant-photos')
 * @param userId The ID of the user (used for folder structure)
 * @returns The filename of the uploaded and compressed avatar
 */
export async function handleAvatarUpload(
  file: File,
  bucket: string,
  userId: string,
): Promise<string> {
  return await uploadFile(file, {
    bucket,
    folder: userId,
    fileName: `avatar-${Date.now()}.jpg`,
    compressionPreset: 'AVATAR',
  });
}
